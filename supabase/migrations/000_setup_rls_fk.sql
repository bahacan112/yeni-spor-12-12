alter table public.student_groups drop constraint if exists fk_student_groups_student;
alter table public.student_groups drop constraint if exists fk_student_groups_group;

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  t uuid;
begin
  select u.tenant_id into t
  from public.users u
  where u.id = auth.uid();
  return t;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.students to anon, authenticated;
grant select, insert, update, delete on public.student_groups to anon, authenticated;

alter table public.students enable row level security;
alter table public.student_groups enable row level security;

drop policy if exists select_students_for_tenant on public.students;
create policy select_students_for_tenant
on public.students
for select
to anon, authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists insert_students_for_tenant on public.students;
create policy insert_students_for_tenant
on public.students
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists update_students_for_tenant on public.students;
create policy update_students_for_tenant
on public.students
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists delete_students_for_tenant on public.students;
create policy delete_students_for_tenant
on public.students
for delete
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists select_student_groups_for_tenant on public.student_groups;
create policy select_student_groups_for_tenant
on public.student_groups
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = student_groups.group_id
      and g.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists insert_student_groups_for_tenant on public.student_groups;
create policy insert_student_groups_for_tenant
on public.student_groups
for insert
to authenticated
with check (
  exists (
    select 1
    from public.groups g
    where g.id = student_groups.group_id
      and g.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists update_student_groups_for_tenant on public.student_groups;
create policy update_student_groups_for_tenant
on public.student_groups
for update
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = student_groups.group_id
      and g.tenant_id = public.current_tenant_id()
  )
)
with check (
  exists (
    select 1
    from public.groups g
    where g.id = student_groups.group_id
      and g.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists delete_student_groups_for_tenant on public.student_groups;
create policy delete_student_groups_for_tenant
on public.student_groups
for delete
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = student_groups.group_id
      and g.tenant_id = public.current_tenant_id()
  )
);

