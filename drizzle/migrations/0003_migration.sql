ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role = ANY (ARRAY['frontdesk','operations','superadmin']));

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

CREATE TABLE public.business_owners (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  notify_email boolean NOT NULL DEFAULT true,
  notify_bookings boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval','Approved','Rejected','Suspended')),
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.business_owners TO authenticated;
GRANT ALL ON public.business_owners TO service_role;
ALTER TABLE public.business_owners ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_approved_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.business_owners WHERE user_id = _user_id AND status = 'Approved') $$;
REVOKE EXECUTE ON FUNCTION public.is_approved_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_owner(uuid) TO authenticated;

CREATE POLICY owner_read ON public.business_owners FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'superadmin'));
CREATE POLICY owner_apply ON public.business_owners FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY owner_update ON public.business_owners FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'superadmin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'superadmin'));

CREATE OR REPLACE FUNCTION public.guard_owner_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'superadmin') THEN RETURN new; END IF;
  IF TG_OP = 'INSERT' THEN new.status := 'Pending Approval'; new.admin_note := ''; RETURN new; END IF;
  IF new.user_id IS DISTINCT FROM old.user_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
  new.admin_note := old.admin_note;
  IF old.status = 'Rejected' AND new.status = 'Pending Approval' THEN RETURN new; END IF;
  new.status := old.status;
  RETURN new;
END $$;
CREATE TRIGGER guard_owner_status BEFORE INSERT OR UPDATE ON public.business_owners FOR EACH ROW EXECUTE FUNCTION public.guard_owner_status();

CREATE TABLE public.owner_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.business_owners(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'Resort' CHECK (kind IN ('Resort','Hotel','Villa')),
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  amenities text[] NOT NULL DEFAULT '{}',
  check_in text NOT NULL DEFAULT '14:00',
  check_out text NOT NULL DEFAULT '11:00',
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Pending Approval','Approved','Rejected','Suspended')),
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_properties TO authenticated;
GRANT ALL ON public.owner_properties TO service_role;
ALTER TABLE public.owner_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY prop_owner_all ON public.owner_properties FOR ALL TO authenticated USING (owner_id = auth.uid() AND public.is_approved_owner(auth.uid())) WITH CHECK (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()));
CREATE POLICY prop_admin_read ON public.owner_properties FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY prop_admin_update ON public.owner_properties FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));

CREATE OR REPLACE FUNCTION public.guard_listing_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  IF public.has_role(auth.uid(),'superadmin') THEN RETURN new; END IF;
  IF TG_OP = 'INSERT' THEN
    new.admin_note := '';
    IF new.status NOT IN ('Draft','Pending Approval') THEN new.status := 'Draft'; END IF;
    RETURN new;
  END IF;
  IF new.owner_id IS DISTINCT FROM old.owner_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
  IF old.status = 'Suspended' THEN RAISE EXCEPTION 'This listing is suspended by the Super Admin'; END IF;
  new.admin_note := old.admin_note;
  IF new.status NOT IN ('Draft','Pending Approval') THEN
    IF new.status = old.status AND old.status IN ('Approved','Rejected') THEN new.status := 'Draft';
    ELSE RAISE EXCEPTION 'Only the Super Admin can set this status'; END IF;
  END IF;
  RETURN new;
END $$;
CREATE TRIGGER guard_listing_status BEFORE INSERT OR UPDATE ON public.owner_properties FOR EACH ROW EXECUTE FUNCTION public.guard_listing_status();

CREATE TABLE public.owner_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.business_owners(user_id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_type text NOT NULL DEFAULT 'Room' CHECK (room_type IN ('Room','Suite','Cottage','Villa')),
  description text NOT NULL DEFAULT '',
  capacity int NOT NULL DEFAULT 2 CHECK (capacity BETWEEN 1 AND 50),
  facilities text[] NOT NULL DEFAULT '{}',
  price int NOT NULL DEFAULT 0 CHECK (price >= 0),
  seasonal_price int CHECK (seasonal_price >= 0),
  season_start date,
  season_end date,
  discount_pct int NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 90),
  units int NOT NULL DEFAULT 1 CHECK (units >= 0),
  available boolean NOT NULL DEFAULT true,
  photos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_rooms TO authenticated;
GRANT ALL ON public.owner_rooms TO service_role;
ALTER TABLE public.owner_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY room_owner_all ON public.owner_rooms FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()))
  WITH CHECK (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()) AND EXISTS (SELECT 1 FROM public.owner_properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));
CREATE POLICY room_admin_read ON public.owner_rooms FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));

CREATE TABLE public.owner_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.business_owners(user_id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.owner_rooms(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL DEFAULT '',
  guest_phone text NOT NULL DEFAULT '',
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests int NOT NULL DEFAULT 1 CHECK (guests >= 1),
  amount int NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested','Confirmed','Declined','Checked In','Completed','Cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_reservations TO authenticated;
GRANT ALL ON public.owner_reservations TO service_role;
ALTER TABLE public.owner_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY res_owner_all ON public.owner_reservations FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()))
  WITH CHECK (owner_id = auth.uid() AND public.is_approved_owner(auth.uid()) AND EXISTS (SELECT 1 FROM public.owner_properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));

CREATE TABLE public.owner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.business_owners(user_id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.owner_notifications TO authenticated;
GRANT ALL ON public.owner_notifications TO service_role;
ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_owner_read ON public.owner_notifications FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY notif_owner_update ON public.owner_notifications FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY notif_owner_delete ON public.owner_notifications FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_owner_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.status IS DISTINCT FROM old.status THEN
    IF TG_TABLE_NAME = 'business_owners' THEN
      INSERT INTO public.owner_notifications(owner_id, message) VALUES (new.user_id, 'Your business account is now ' || new.status || CASE WHEN new.admin_note <> '' THEN ': ' || new.admin_note ELSE '' END);
    ELSE
      INSERT INTO public.owner_notifications(owner_id, message) VALUES (new.owner_id, 'Listing "' || new.name || '" is now ' || new.status || CASE WHEN new.admin_note <> '' THEN ': ' || new.admin_note ELSE '' END);
    END IF;
  END IF;
  RETURN new;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_owner_status() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_owner_status AFTER UPDATE ON public.business_owners FOR EACH ROW EXECUTE FUNCTION public.notify_owner_status();
CREATE TRIGGER notify_listing_status AFTER UPDATE ON public.owner_properties FOR EACH ROW EXECUTE FUNCTION public.notify_owner_status();

CREATE OR REPLACE FUNCTION public.notify_owner_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.business_owners WHERE user_id = new.owner_id AND notify_bookings) THEN
    INSERT INTO public.owner_notifications(owner_id, message) VALUES (new.owner_id, 'New booking request from ' || new.guest_name);
  END IF;
  RETURN new;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_owner_reservation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_owner_reservation AFTER INSERT ON public.owner_reservations FOR EACH ROW EXECUTE FUNCTION public.notify_owner_reservation();

CREATE POLICY listing_photos_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'superadmin')));
CREATE POLICY listing_photos_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_approved_owner(auth.uid()));
CREATE POLICY listing_photos_owner_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_approved_owner(auth.uid()));