CREATE TABLE public."user" (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'guest',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public."user".role IS 'Read-only mirror of public.user_roles; never used for authorization.';
GRANT SELECT ON public."user" TO authenticated;
GRANT UPDATE (name, phone) ON public."user" TO authenticated;
GRANT ALL ON public."user" TO service_role;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_read ON public."user" FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY user_admin_read ON public."user" FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY user_own_update ON public."user" FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_role_label(_uid uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce((SELECT role FROM public.user_roles WHERE user_id = _uid ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'operations' THEN 2 WHEN 'frontdesk' THEN 3 ELSE 4 END LIMIT 1), 'guest')
$$;

-- Keep id, email, role, created_at protected; stamp updated_at
CREATE OR REPLACE FUNCTION public.guard_user_row() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  new.updated_at := now();
  IF current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    new.id := old.id; new.email := old.email; new.role := old.role; new.created_at := old.created_at;
  END IF;
  RETURN new;
END $$;
CREATE TRIGGER guard_user_row BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.guard_user_row();

-- Create on signup (after profile row exists)
CREATE OR REPLACE FUNCTION public.create_user_row() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public."user"(id, name, email, phone, role)
  SELECT new.id, new.full_name, coalesce(u.email,''), new.mobile, public.user_role_label(new.id) FROM auth.users u WHERE u.id = new.id
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END $$;
CREATE TRIGGER create_user_row AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_user_row();

-- Profile edits sync
CREATE OR REPLACE FUNCTION public.sync_user_from_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public."user" SET name = new.full_name, phone = new.mobile WHERE id = new.id AND (name IS DISTINCT FROM new.full_name OR phone IS DISTINCT FROM new.mobile);
  RETURN new;
END $$;
CREATE TRIGGER sync_user_from_profile AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_user_from_profile();

-- Email changes sync
CREATE OR REPLACE FUNCTION public.sync_user_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF new.email IS DISTINCT FROM old.email THEN UPDATE public."user" SET email = coalesce(new.email,'') WHERE id = new.id; END IF;
  RETURN new;
END $$;
CREATE TRIGGER sync_user_email AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- Role mirror
CREATE OR REPLACE FUNCTION public.sync_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := coalesce(new.user_id, old.user_id);
BEGIN
  UPDATE public."user" SET role = public.user_role_label(uid) WHERE id = uid;
  RETURN NULL;
END $$;
CREATE TRIGGER sync_user_role AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- Backfill existing accounts
INSERT INTO public."user"(id, name, email, phone, role, created_at)
SELECT p.id, p.full_name, coalesce(u.email,''), p.mobile, public.user_role_label(p.id), u.created_at
FROM public.profiles p JOIN auth.users u ON u.id = p.id
ON CONFLICT (id) DO NOTHING;