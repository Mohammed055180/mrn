-- Dar marketplace schema. Run in the Supabase SQL Editor.
-- Listings stay pending until reviewed by an administrator.

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  city text not null check (city in ('الرياض','جدة','الدمام','مكة','الخبر')),
  district text not null check (char_length(district) between 2 and 80),
  price bigint not null check (price > 0),
  type text not null check (type in ('فيلا','شقة','تاون هاوس','أرض')),
  purpose text not null check (purpose in ('للبيع','للإيجار')),
  beds smallint not null default 0 check (beds between 0 and 30),
  baths smallint not null default 0 check (baths between 0 and 30),
  area integer not null check (area > 0 and area <= 100000),
  image text check (image is null or (image like 'https://%' and char_length(image) <= 2048)),
  status text not null default 'pending' check (status in ('pending','published','rejected','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade the first draft of the schema if it was already applied.
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings alter column status set default 'pending';
update public.listings set status = 'removed' where status = 'hidden';
alter table public.listings
  add constraint listings_status_check check (status in ('pending','published','rejected','removed'));

create index if not exists listings_public_search_idx
  on public.listings (status, city, purpose, type, created_at desc);
create index if not exists listings_owner_created_idx
  on public.listings (user_id, created_at desc);

-- Contact numbers are private to their listing owner. They are not included in
-- the public listings table or returned to anonymous visitors.
create table if not exists public.listing_contacts (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null check (phone ~ '^\+?[0-9 ]{8,20}$'),
  created_at timestamptz not null default now()
);

-- Keep any contact numbers from the first draft private, then remove the public
-- column. This block is safe when the old column does not exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings' and column_name = 'phone'
  ) then
    execute 'insert into public.listing_contacts (listing_id, user_id, phone)
      select id, user_id, phone from public.listings
      where phone is not null on conflict (listing_id) do nothing';
    alter table public.listings drop column phone;
  end if;
end $$;

alter table public.listings enable row level security;
alter table public.listing_contacts enable row level security;

revoke all on public.listings from anon, authenticated;
revoke all on public.listing_contacts from anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select, insert, delete on public.listing_contacts to authenticated;

drop policy if exists "Public reads published listings" on public.listings;
create policy "Public reads published listings"
  on public.listings for select
  using (status = 'published' or (select auth.uid()) = user_id);

drop policy if exists "Owners submit pending listings" on public.listings;
create policy "Owners submit pending listings"
  on public.listings for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "Owners edit pending listings" on public.listings;
create policy "Owners edit pending listings"
  on public.listings for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "Owners delete pending listings" on public.listings;
create policy "Owners delete pending listings"
  on public.listings for delete to authenticated
  using ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "Owners read their contact details" on public.listing_contacts;
create policy "Owners read their contact details"
  on public.listing_contacts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Owners add their contact details" on public.listing_contacts;
create policy "Owners add their contact details"
  on public.listing_contacts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = (select auth.uid()) and l.status = 'pending'
    )
  );

drop policy if exists "Owners delete their contact details" on public.listing_contacts;
create policy "Owners delete their contact details"
  on public.listing_contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Public photos, owner-only uploads/removals, 5 MB image limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "Anyone reads property photos" on storage.objects;
create policy "Anyone reads property photos"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Owners upload property photos" on storage.objects;
create policy "Owners upload property photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Owners remove property photos" on storage.objects;
create policy "Owners remove property photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
