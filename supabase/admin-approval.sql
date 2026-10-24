-- Dar admin review access. Apply in the Supabase SQL Editor after creating
-- a trusted Supabase Auth user and setting app_metadata.role = 'admin'.
-- Never use user_metadata for authorization; users can change it themselves.

drop policy if exists "Admins review pending listings" on public.listings;
create policy "Admins review pending listings"
  on public.listings for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins update listing status" on public.listings;
create policy "Admins update listing status"
  on public.listings for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
