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

