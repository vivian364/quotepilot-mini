begin;
create table public.equipment_refrigeration (
 equipment_id uuid primary key references public.vessel_equipment(id) on delete cascade,
 refrigerant text not null default '' check(length(refrigerant)<=50),
 nominal_charge_kg numeric(12,3) check(nominal_charge_kg>=0 and nominal_charge_kg<=1000000),
 next_service_date date,
 notes text not null default '' check(length(notes)<=3000),
 updated_at timestamptz not null default now()
);
create table public.equipment_service_events (
 id uuid primary key default gen_random_uuid(),
 equipment_id uuid not null references public.vessel_equipment(id) on delete cascade,
 event_date date not null check(event_date<=current_date),
 kind text not null check(kind in ('service','leak_inspection','leak_detected','repair','refrigerant_added','refrigerant_recovered')),
 refrigerant text not null default '' check(length(refrigerant)<=50),
 quantity_kg numeric(12,3) check(quantity_kg>0 and quantity_kg<=1000000),
 technician text not null default '' check(length(technician)<=150),
 notes text not null default '' check(length(notes)<=3000),
 voided boolean not null default false,
 created_at timestamptz not null default now(),
 check(kind not in ('refrigerant_added','refrigerant_recovered') or (quantity_kg is not null and length(trim(refrigerant))>0))
);
create index equipment_service_events_equipment_date on public.equipment_service_events(equipment_id,event_date desc,created_at desc);
create table public.equipment_documents (
 id uuid primary key,
 equipment_id uuid not null references public.vessel_equipment(id) on delete cascade,
 storage_path text not null unique,
 filename text not null check(length(filename) between 1 and 200),
 mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
 size_bytes bigint not null check(size_bytes between 1 and 5242880),
 created_at timestamptz not null default now(),
 check(storage_path = equipment_id::text || '/' || id::text || case mime_type when 'application/pdf' then '.pdf' when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end)
);
create index equipment_documents_equipment_idx on public.equipment_documents(equipment_id);
alter table public.equipment_refrigeration enable row level security;
alter table public.equipment_service_events enable row level security;
alter table public.equipment_documents enable row level security;
revoke all on public.equipment_refrigeration,public.equipment_service_events,public.equipment_documents from public,anon,authenticated;
grant select,insert,update on public.equipment_refrigeration to authenticated;
grant select,insert on public.equipment_service_events,public.equipment_documents to authenticated;
grant update(voided) on public.equipment_service_events to authenticated;
grant all on public.equipment_refrigeration,public.equipment_service_events,public.equipment_documents to service_role;
create policy refrigeration_read on public.equipment_refrigeration for select to authenticated using (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy refrigeration_insert on public.equipment_refrigeration for insert to authenticated with check (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy refrigeration_update on public.equipment_refrigeration for update to authenticated using (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid()))) with check (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy service_read on public.equipment_service_events for select to authenticated using (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy service_insert on public.equipment_service_events for insert to authenticated with check (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy service_void on public.equipment_service_events for update to authenticated using (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid()))) with check (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy equipment_document_read on public.equipment_documents for select to authenticated using (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())));
create policy equipment_document_insert on public.equipment_documents for insert to authenticated with check (equipment_id in (select id from public.vessel_equipment where owner_id=(select auth.uid())) and exists (select 1 from storage.objects o where o.bucket_id='marine-equipment-documents' and o.name=storage_path));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('marine-equipment-documents','marine-equipment-documents',false,5242880,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy equipment_storage_read on storage.objects for select to authenticated using (bucket_id='marine-equipment-documents' and (storage.foldername(name))[1] in (select id::text from public.vessel_equipment where owner_id=(select auth.uid())));
create policy equipment_storage_insert on storage.objects for insert to authenticated with check (bucket_id='marine-equipment-documents' and array_length(storage.foldername(name),1)=1 and lower(storage.extension(name)) in ('pdf','jpg','png','webp') and (storage.foldername(name))[1] in (select id::text from public.vessel_equipment where owner_id=(select auth.uid())));
-- Only failed, unlinked uploads can be cleaned up. Linked history files are retained.
create policy equipment_storage_orphan_cleanup on storage.objects for delete to authenticated using (bucket_id='marine-equipment-documents' and (storage.foldername(name))[1] in (select id::text from public.vessel_equipment where owner_id=(select auth.uid())) and not exists(select 1 from public.equipment_documents d where d.storage_path=name));
commit;
