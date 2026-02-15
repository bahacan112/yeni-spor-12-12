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
