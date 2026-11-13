CREATE OR REPLACE FUNCTION public.owner_applications_open() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT allow_owner_applications FROM public.platform_settings WHERE id=1),false) $$;
REVOKE ALL ON FUNCTION public.owner_applications_open() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.owner_applications_open() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.guard_owner_status() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF public.is_privileged() THEN RETURN new; END IF;
 IF TG_OP='INSERT' THEN IF public.owner_applications_open() IS NOT TRUE THEN RAISE EXCEPTION 'New business applications are currently closed'; END IF; new.status:='Pending Approval'; new.admin_note:=''; new.can_add:=true; new.can_edit:=true; new.can_publish:=true; new.can_remove:=true; RETURN new; END IF;
 IF new.user_id IS DISTINCT FROM old.user_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
 new.admin_note:=old.admin_note; new.can_add:=old.can_add; new.can_edit:=old.can_edit; new.can_publish:=old.can_publish; new.can_remove:=old.can_remove;
 IF old.status='Rejected' AND new.status='Pending Approval' THEN IF public.owner_applications_open() IS NOT TRUE THEN RAISE EXCEPTION 'New business applications are currently closed'; END IF; RETURN new; END IF;
 new.status:=old.status; RETURN new; END $$;
CREATE OR REPLACE FUNCTION public.validate_owner_reservation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE r public.owner_rooms; total bigint; day date; base int; booked int; BEGIN
 IF TG_OP='UPDATE' AND new.owner_id IS DISTINCT FROM old.owner_id THEN RAISE EXCEPTION 'Reservation ownership transfer requires a dedicated migration'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.owner_properties p WHERE p.id=new.property_id AND p.owner_id=new.owner_id) THEN RAISE EXCEPTION 'Property owner mismatch'; END IF;
 IF new.room_id IS NULL THEN RETURN new; END IF;
 SELECT * INTO r FROM public.owner_rooms WHERE id=new.room_id FOR UPDATE;
 IF NOT FOUND OR r.owner_id<>new.owner_id OR r.property_id<>new.property_id THEN RAISE EXCEPTION 'Room does not belong to this property and owner'; END IF;
 IF new.guests<1 OR new.guests>r.capacity THEN RAISE EXCEPTION 'Guest count exceeds room capacity'; END IF;
 IF TG_OP='INSERT' OR new.check_in IS DISTINCT FROM old.check_in OR new.check_out IS DISTINCT FROM old.check_out OR new.room_id IS DISTINCT FROM old.room_id THEN
 IF NOT r.available OR r.units<1 THEN RAISE EXCEPTION 'Room is closed for requests'; END IF; total:=0; day:=new.check_in;
 WHILE day<new.check_out LOOP base:=CASE WHEN r.seasonal_price IS NOT NULL AND day BETWEEN r.season_start AND r.season_end THEN r.seasonal_price ELSE r.price END; total:=total+round(base*(1-r.discount_pct/100.0)); day:=day+1; END LOOP; new.amount:=total;
 END IF;
 IF new.status IN ('Confirmed','Checked In') AND (TG_OP='INSERT' OR new.status IS DISTINCT FROM old.status OR new.check_in IS DISTINCT FROM old.check_in OR new.check_out IS DISTINCT FROM old.check_out) THEN
 IF NOT r.available OR r.units<1 THEN RAISE EXCEPTION 'Room is closed for confirmation'; END IF; day:=new.check_in;
 WHILE day<new.check_out LOOP SELECT count(*) INTO booked FROM public.owner_reservations x WHERE x.room_id=new.room_id AND x.id<>new.id AND x.status IN ('Confirmed','Checked In') AND x.check_in<=day AND x.check_out>day; IF booked>=r.units THEN RAISE EXCEPTION 'No remaining units for these dates'; END IF; day:=day+1; END LOOP;
 END IF; RETURN new; END $$;
CREATE TRIGGER validate_owner_reservation BEFORE INSERT OR UPDATE ON public.owner_reservations FOR EACH ROW EXECUTE FUNCTION public.validate_owner_reservation(); REVOKE ALL ON FUNCTION public.validate_owner_reservation() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.prevent_partial_property_transfer() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF new.owner_id IS DISTINCT FROM old.owner_id THEN RAISE EXCEPTION 'Property transfer is unavailable until reservations and photos can be transferred safely'; END IF; RETURN new; END $$;
CREATE TRIGGER prevent_partial_property_transfer BEFORE UPDATE ON public.owner_properties FOR EACH ROW EXECUTE FUNCTION public.prevent_partial_property_transfer(); REVOKE ALL ON FUNCTION public.prevent_partial_property_transfer() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_reservation_changes AFTER INSERT OR UPDATE OR DELETE ON public.owner_reservations FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();