ALTER TABLE public.business_owners
  ADD COLUMN can_add boolean NOT NULL DEFAULT true,
  ADD COLUMN can_edit boolean NOT NULL DEFAULT true,
  ADD COLUMN can_publish boolean NOT NULL DEFAULT true,
  ADD COLUMN can_remove boolean NOT NULL DEFAULT true;

CREATE TABLE public.platform_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name text NOT NULL DEFAULT 'The Azure Ridge Sanctuary',
  support_email text NOT NULL DEFAULT '',
  support_phone text NOT NULL DEFAULT '',
  allow_owner_applications boolean NOT NULL DEFAULT true,
  notify_owners boolean NOT NULL DEFAULT true,
  announcement text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY settings_admin_update ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
INSERT INTO public.platform_settings (id) VALUES (1);

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_read ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));
CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT current_user IN ('service_role','postgres','supabase_admin') OR public.has_role(auth.uid(),'superadmin') $$;

CREATE OR REPLACE FUNCTION public.owner_can(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.business_owners WHERE user_id = _user_id AND status = 'Approved' AND CASE _perm WHEN 'add' THEN can_add WHEN 'edit' THEN can_edit WHEN 'publish' THEN can_publish WHEN 'remove' THEN can_remove ELSE false END) $$;
REVOKE EXECUTE ON FUNCTION public.owner_can(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_can(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_owner_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_privileged() THEN RETURN new; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NOT (SELECT allow_owner_applications FROM public.platform_settings WHERE id = 1) THEN RAISE EXCEPTION 'New business applications are currently closed'; END IF;
    new.status := 'Pending Approval'; new.admin_note := '';
    new.can_add := true; new.can_edit := true; new.can_publish := true; new.can_remove := true;
    RETURN new;
  END IF;
  IF new.user_id IS DISTINCT FROM old.user_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
  new.admin_note := old.admin_note;
  new.can_add := old.can_add; new.can_edit := old.can_edit; new.can_publish := old.can_publish; new.can_remove := old.can_remove;
  IF old.status = 'Rejected' AND new.status = 'Pending Approval' THEN RETURN new; END IF;
  new.status := old.status;
  RETURN new;
END $$;

CREATE OR REPLACE FUNCTION public.guard_listing_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  IF public.is_privileged() THEN RETURN new; END IF;
  IF TG_OP = 'INSERT' THEN
    new.admin_note := '';
    IF new.status NOT IN ('Draft','Pending Approval') THEN new.status := 'Draft'; END IF;
  ELSE
    IF new.owner_id IS DISTINCT FROM old.owner_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
    IF old.status = 'Suspended' THEN RAISE EXCEPTION 'This listing is suspended by the Super Admin'; END IF;
    new.admin_note := old.admin_note;
    IF new.status NOT IN ('Draft','Pending Approval') THEN
      IF new.status = old.status AND old.status IN ('Approved','Rejected') THEN new.status := 'Draft';
      ELSE RAISE EXCEPTION 'Only the Super Admin can set this status'; END IF;
    END IF;
  END IF;
  IF new.status = 'Pending Approval' AND NOT public.owner_can(auth.uid(),'publish') THEN RAISE EXCEPTION 'You do not have permission to submit listings for publishing'; END IF;
  RETURN new;
END $$;

-- Owner policies split by permission
DROP POLICY prop_owner_all ON public.owner_properties;
CREATE POLICY prop_owner_read ON public.owner_properties FOR SELECT TO authenticated USING (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()));
CREATE POLICY prop_owner_insert ON public.owner_properties FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.owner_can(auth.uid(),'add'));
CREATE POLICY prop_owner_update ON public.owner_properties FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND public.owner_can(auth.uid(),'edit')) WITH CHECK (owner_id = auth.uid() AND public.owner_can(auth.uid(),'edit'));
CREATE POLICY prop_owner_delete ON public.owner_properties FOR DELETE TO authenticated USING (owner_id = auth.uid() AND public.owner_can(auth.uid(),'remove'));
CREATE POLICY prop_admin_delete ON public.owner_properties FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'superadmin'));

DROP POLICY room_owner_all ON public.owner_rooms;
CREATE POLICY room_owner_read ON public.owner_rooms FOR SELECT TO authenticated USING (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()));
CREATE POLICY room_owner_insert ON public.owner_rooms FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.owner_can(auth.uid(),'add') AND EXISTS (SELECT 1 FROM public.owner_properties p WHERE p.id = property_id AND p.owner_id = auth.uid() AND p.status <> 'Suspended'));
CREATE POLICY room_owner_update ON public.owner_rooms FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND public.owner_can(auth.uid(),'edit')) WITH CHECK (owner_id = auth.uid() AND public.owner_can(auth.uid(),'edit') AND EXISTS (SELECT 1 FROM public.owner_properties p WHERE p.id = property_id AND p.owner_id = auth.uid() AND p.status <> 'Suspended'));
CREATE POLICY room_owner_delete ON public.owner_rooms FOR DELETE TO authenticated USING (owner_id = auth.uid() AND public.owner_can(auth.uid(),'remove'));
CREATE POLICY room_admin_write ON public.owner_rooms FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY room_admin_delete ON public.owner_rooms FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'superadmin'));

CREATE POLICY res_admin_read ON public.owner_reservations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY res_admin_update ON public.owner_reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY user_roles_admin_read ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));

-- Owner notifications respect platform setting
CREATE OR REPLACE FUNCTION public.notify_owner_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.status IS DISTINCT FROM old.status AND (SELECT notify_owners FROM public.platform_settings WHERE id = 1) THEN
    IF TG_TABLE_NAME = 'business_owners' THEN
      INSERT INTO public.owner_notifications(owner_id, message) VALUES (new.user_id, 'Your business account is now ' || new.status || CASE WHEN new.admin_note <> '' THEN ': ' || new.admin_note ELSE '' END);
    ELSE
      INSERT INTO public.owner_notifications(owner_id, message) VALUES (new.owner_id, 'Listing "' || new.name || '" is now ' || new.status || CASE WHEN new.admin_note <> '' THEN ': ' || new.admin_note ELSE '' END);
    END IF;
  END IF;
  RETURN new;
END $$;

-- Audit logging
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; o jsonb; eid text; label text; act text;
BEGIN
  r := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(old) ELSE to_jsonb(new) END;
  o := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(old) ELSE '{}'::jsonb END;
  eid := coalesce(r->>'id', r->>'user_id', '');
  label := coalesce(r->>'name', r->>'business_name', r->>'role', '');
  act := lower(TG_OP);
  IF TG_OP = 'UPDATE' AND (r->>'status') IS DISTINCT FROM (o->>'status') THEN act := 'status: ' || coalesce(r->>'status',''); END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, entity, entity_id, summary, details)
  VALUES (auth.uid(), act, TG_TABLE_NAME, eid, label,
    CASE WHEN TG_OP = 'UPDATE' THEN (SELECT coalesce(jsonb_object_agg(k, jsonb_build_object('from', o->k, 'to', r->k)), '{}'::jsonb) FROM jsonb_object_keys(r) k WHERE r->k IS DISTINCT FROM o->k AND k NOT IN ('updated_at')) ELSE r END);
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.write_audit_log() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_business_owners AFTER INSERT OR UPDATE OR DELETE ON public.business_owners FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_owner_properties AFTER INSERT OR UPDATE OR DELETE ON public.owner_properties FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_owner_rooms AFTER INSERT OR UPDATE OR DELETE ON public.owner_rooms FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_user_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_platform_settings AFTER UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- Public catalogue: only approved listings from approved owners, safe columns only
CREATE OR REPLACE FUNCTION public.public_listings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'kind', p.kind, 'description', p.description, 'location', p.location,
    'amenities', p.amenities, 'check_in', p.check_in, 'check_out', p.check_out, 'photos', p.photos,
    'rooms', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'room_type', r.room_type, 'description', r.description, 'capacity', r.capacity, 'facilities', r.facilities, 'price', r.price, 'seasonal_price', r.seasonal_price, 'season_start', r.season_start, 'season_end', r.season_end, 'discount_pct', r.discount_pct, 'photos', r.photos) ORDER BY r.price), '[]'::jsonb) FROM public.owner_rooms r WHERE r.property_id = p.id AND r.available AND r.units > 0)
  ) ORDER BY p.updated_at DESC), '[]'::jsonb)
  FROM public.owner_properties p JOIN public.business_owners b ON b.user_id = p.owner_id
  WHERE p.status = 'Approved' AND b.status = 'Approved'
$$;
GRANT EXECUTE ON FUNCTION public.public_listings() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_public_photo(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.owner_properties p JOIN public.business_owners b ON b.user_id = p.owner_id
    WHERE p.status = 'Approved' AND b.status = 'Approved' AND (_path = ANY(p.photos) OR EXISTS (SELECT 1 FROM public.owner_rooms r WHERE r.property_id = p.id AND _path = ANY(r.photos))))
$$;
GRANT EXECUTE ON FUNCTION public.is_public_photo(text) TO anon, authenticated;
CREATE POLICY listing_photos_public_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'listing-photos' AND public.is_public_photo(name));