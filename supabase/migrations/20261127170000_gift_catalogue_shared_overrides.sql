-- Rajmoti shared gift catalogue overrides.
-- Run in a preview Supabase project before publishing.
create table if not exists public.gift_catalogue_overrides (
  product_id text primary key,
  product jsonb not null,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint gift_catalogue_product_object check (jsonb_typeof(product) = 'object'),
  constraint gift_catalogue_id_matches check (product->>'id' = product_id)
);
create index if not exists gift_catalogue_public_idx
  on public.gift_catalogue_overrides(published) where published;
alter table public.gift_catalogue_overrides enable row level security;
grant select on public.gift_catalogue_overrides to anon, authenticated;
grant insert, update on public.gift_catalogue_overrides to authenticated;
drop policy if exists "Public sees published gift products" on public.gift_catalogue_overrides;
create policy "Public sees published gift products"
  on public.gift_catalogue_overrides for select to anon, authenticated
  using (published);
drop policy if exists "Studio admins see catalogue drafts" on public.gift_catalogue_overrides;
create policy "Studio admins see catalogue drafts"
  on public.gift_catalogue_overrides for select to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role::text = 'admin'
  ));
drop policy if exists "Studio admins insert catalogue products" on public.gift_catalogue_overrides;
create policy "Studio admins insert catalogue products"
  on public.gift_catalogue_overrides for insert to authenticated
  with check (
    updated_by = (select auth.uid()) and
    exists (select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role::text = 'admin')
  );
drop policy if exists "Studio admins update catalogue products" on public.gift_catalogue_overrides;
create policy "Studio admins update catalogue products"
  on public.gift_catalogue_overrides for update to authenticated
  using (exists (select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role::text = 'admin'))
  with check (
    updated_by = (select auth.uid()) and
    exists (select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role::text = 'admin')
  );
notify pgrst, 'reload schema';
