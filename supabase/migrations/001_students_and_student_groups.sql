create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  branch_id uuid,
  user_id uuid,
  student_no text,
  full_name text not null,
  birth_date date,
  is_licensed boolean default false,
  license_no text,
  license_issued_at date,
  license_expires_at date,
  license_federation text,
  gender text,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  photo_url text,
  registration_date date default current_date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_tenant_id on public.students(tenant_id);
create index if not exists idx_students_branch_id on public.students(branch_id);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.students'::regclass
      and tgname = 'set_students_updated_at'
  ) then
    create trigger set_students_updated_at
    before update on public.students
    for each row
    execute function public.set_updated_at_timestamp();
  end if;
end;
$$;

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  group_id uuid not null,
  status text not null default 'active',
  joined_at date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_student_group unique (student_id, group_id)
);

create index if not exists idx_student_groups_student on public.student_groups(student_id);
create index if not exists idx_student_groups_group on public.student_groups(group_id);
create index if not exists idx_student_groups_status on public.student_groups(status);

do $$
begin
  if exists (select 1 from pg_class where oid = 'public.students'::regclass) then
    alter table public.student_groups
    add constraint fk_student_groups_student
    foreign key (student_id) references public.students(id)
    on delete cascade;
  end if;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'public.groups'::regclass) then
    alter table public.student_groups
    add constraint fk_student_groups_group
    foreign key (group_id) references public.groups(id)
    on delete cascade;
  end if;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.student_groups'::regclass
      and tgname = 'set_student_groups_updated_at'
  ) then
    create trigger set_student_groups_updated_at
    before update on public.student_groups
    for each row
    execute function public.set_updated_at_timestamp();
  end if;
end;
$$;

alter table public.students enable row level security;
alter table public.student_groups enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.students to anon, authenticated;
grant select, insert, update, delete on public.student_groups to anon, authenticated;

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
