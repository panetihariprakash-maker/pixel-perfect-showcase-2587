drop policy if exists settings_read on public.platform_settings;

create policy settings_admin_read
on public.platform_settings
for select
to authenticated
using (public.has_role(auth.uid(), 'superadmin'));

create or replace function public.platform_announcement()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select announcement from public.platform_settings where id = 1;
$$;

grant execute on function public.platform_announcement() to authenticated;