begin;
create table public.vessel_equipment (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 vessel_id uuid not null references public.vessels(id) on delete cascade,
 category text not null check(category in ('Main engine','Generator','HVAC','Refrigeration','Pump','Compressor','Navigation','Electrical','Safety','Deck equipment','Other')),
 name text not null check(length(trim(name)) between 1 and 150),
 brand text not null default '' check(length(brand)<=100),
 model text not null default '' check(length(model)<=100),
 serial_number text not null default '' check(length(serial_number)<=150),
 part_number text not null default '' check(length(part_number)<=150),
 location text not null default '' check(length(location)<=150),
 notes text not null default '' check(length(notes)<=5000),
 ocr_text text not null default '' check(length(ocr_text)<=12000),
 archived boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.vessel_equipment enable row level security;
revoke all on public.vessel_equipment from anon,authenticated;
grant select,insert,update on public.vessel_equipment to authenticated;
create index vessel_equipment_owner_vessel_idx on public.vessel_equipment(owner_id,vessel_id);
create policy equipment_read_own on public.vessel_equipment for select to authenticated using (owner_id=(select auth.uid()) and vessel_id in (select id from public.vessels where owner_id=(select auth.uid())));
create policy equipment_insert_own on public.vessel_equipment for insert to authenticated with check (owner_id=(select auth.uid()) and vessel_id in (select id from public.vessels where owner_id=(select auth.uid())));
create policy equipment_update_own on public.vessel_equipment for update to authenticated using (owner_id=(select auth.uid()) and vessel_id in (select id from public.vessels where owner_id=(select auth.uid()))) with check (owner_id=(select auth.uid()) and vessel_id in (select id from public.vessels where owner_id=(select auth.uid())));
comment on table public.vessel_equipment is 'Equipment Passport. Account-only descriptive equipment records; OCR must be reviewed. No compatibility certification.';
commit;
