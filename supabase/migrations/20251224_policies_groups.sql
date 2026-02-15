alter table public.groups enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.groups to anon, authenticated;

drop policy if exists select_groups_for_tenant on public.groups;
create policy select_groups_for_tenant
on public.groups
for select
to anon, authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists insert_groups_for_tenant on public.groups;
create policy insert_groups_for_tenant
on public.groups
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists update_groups_for_tenant on public.groups;
create policy update_groups_for_tenant
on public.groups
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists delete_groups_for_tenant on public.groups;
create policy delete_groups_for_tenant
on public.groups
for delete
to authenticated
using (tenant_id = public.current_tenant_id());

