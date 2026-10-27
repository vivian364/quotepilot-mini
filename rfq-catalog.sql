create table public.rfq_catalog_prices (
 id uuid primary key default gen_random_uuid(),
 country_code text not null check(country_code ~ '^[a-z]{2}$'),
 currency text not null check(currency ~ '^[A-Z]{3}$'),
 brand text not null check(length(trim(brand)) between 2 and 100),
 part_number text not null check(length(trim(part_number)) between 3 and 100),
 brand_key text generated always as (lower(trim(brand))) stored,
 part_key text generated always as (lower(trim(part_number))) stored,
 base_price numeric(16,4) not null check(base_price > 0 and base_price < 10000000),
 valid_until date not null,
 enabled boolean not null default true,
 updated_at timestamptz not null default now(),
 unique(country_code,brand_key,part_key)
);
alter table public.rfq_catalog_prices enable row level security;
revoke all on public.rfq_catalog_prices from public,anon,authenticated;
grant select,insert,update on public.rfq_catalog_prices to authenticated;
grant all on public.rfq_catalog_prices to service_role;
create policy "Marine admins read catalog" on public.rfq_catalog_prices for select to authenticated using ((select public.is_marine_admin()));
create policy "Marine admins create catalog" on public.rfq_catalog_prices for insert to authenticated with check ((select public.is_marine_admin()));
create policy "Marine admins update catalog" on public.rfq_catalog_prices for update to authenticated using ((select public.is_marine_admin())) with check ((select public.is_marine_admin()));
