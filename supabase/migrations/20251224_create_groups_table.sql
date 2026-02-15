create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  branch_id uuid,
  name text not null,
  description text,
  sport_type text,
  sport_id uuid,
  age_group text,
  birth_date_from date,
  birth_date_to date,
  license_requirement text default 'any',
  capacity integer not null default 0,
  monthly_fee numeric(10,2),
  instructor_id uuid,
  schedule jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_groups_tenant_id on public.groups(tenant_id);
create index if not exists idx_groups_branch_id on public.groups(branch_id);
create index if not exists idx_groups_instructor_id on public.groups(instructor_id);
create index if not exists idx_groups_status on public.groups(status);

do $$
begin
  if exists (select 1 from pg_class where oid = 'public.branches'::regclass) then
    alter table public.groups
    add constraint fk_groups_branch
    foreign key (branch_id) references public.branches(id)
    on delete set null;
  end if;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'public.sports'::regclass) then
    alter table public.groups
    add constraint fk_groups_sport
    foreign key (sport_id) references public.sports(id)
    on delete set null;
  end if;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  if exists (select 1 from pg_class where oid = 'public.instructors'::regclass) then
    alter table public.groups
    add constraint fk_groups_instructor
    foreign key (instructor_id) references public.instructors(id)
    on delete set null;
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
    where tgrelid = 'public.groups'::regclass
      and tgname = 'set_groups_updated_at'
  ) then
    create trigger set_groups_updated_at
    before update on public.groups
    for each row
    execute function public.set_updated_at_timestamp();
  end if;
end;
$$;

