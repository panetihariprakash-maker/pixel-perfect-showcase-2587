CREATE OR REPLACE FUNCTION public.partner_room_quote(_room_id uuid,_check_in date,_check_out date) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE r public.owner_rooms; day date; booked integer; remaining integer; total integer:=0; nights jsonb:='[]'::jsonb; rate integer; BEGIN
IF _check_in IS NULL OR _check_out IS NULL OR _check_in<current_date OR _check_out<=_check_in OR _check_out-_check_in>90 THEN RAISE EXCEPTION 'Choose a future stay of 1 to 90 nights'; END IF;
SELECT r0.* INTO r FROM public.owner_rooms r0 JOIN public.owner_properties p ON p.id=r0.property_id JOIN public.business_owners b ON b.user_id=p.owner_id WHERE r0.id=_room_id AND p.status='Approved' AND b.status='Approved';
IF NOT FOUND THEN RAISE EXCEPTION 'Room is not publicly listed'; END IF;
remaining:=CASE WHEN r.available THEN r.units ELSE 0 END; day:=_check_in;
WHILE day<_check_out LOOP SELECT count(*) INTO booked FROM public.owner_reservations x WHERE x.room_id=r.id AND x.status IN ('Confirmed','Checked In') AND x.check_in<=day AND x.check_out>day;
remaining:=least(remaining,greatest(0,r.units-booked)); rate:=round((CASE WHEN r.seasonal_price IS NOT NULL AND day BETWEEN r.season_start AND r.season_end THEN r.seasonal_price ELSE r.price END)*(1-r.discount_pct/100.0)); total:=total+rate; nights:=nights||jsonb_build_array(jsonb_build_object('date',day,'amount',rate)); day:=day+1; END LOOP;
RETURN jsonb_build_object('room_id',r.id,'check_in',_check_in,'check_out',_check_out,'nights',_check_out-_check_in,'capacity',r.capacity,'remaining_units',remaining,'available',remaining>0,'amount',total,'nightly_rates',nights); END $$;
REVOKE ALL ON FUNCTION public.partner_room_quote(uuid,date,date) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.partner_room_quote(uuid,date,date) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.prevent_duplicate_guest_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF new.guest_user_id IS NOT NULL THEN
PERFORM 1 FROM public.owner_rooms WHERE id=new.room_id FOR UPDATE;
IF EXISTS(SELECT 1 FROM public.owner_reservations b WHERE b.guest_user_id=new.guest_user_id AND b.room_id=new.room_id AND b.check_in=new.check_in AND b.check_out=new.check_out AND b.status IN ('Requested','Confirmed','Checked In')) THEN RAISE EXCEPTION 'You already have a request for this room and these dates. Open My Bookings to view it.'; END IF;
END IF; RETURN new; END $$;
REVOKE ALL ON FUNCTION public.prevent_duplicate_guest_request() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER prevent_duplicate_guest_request BEFORE INSERT ON public.owner_reservations FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_guest_request();