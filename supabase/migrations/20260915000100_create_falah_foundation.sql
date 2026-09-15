create extension if not exists pgcrypto;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue_name text not null,
  timezone text not null default 'Asia/Jakarta',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  division_id uuid not null references public.divisions(id) on delete restrict,
  public_code text not null,
  name text not null,
  role text not null default 'Anggota',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, public_code),
  check (length(trim(name)) > 0),
  check (length(trim(public_code)) > 0)
);

create table public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  session_number integer not null check (session_number > 0),
  name text not null,
  session_date date not null,
  day_label text not null,
  agenda_start_time time not null,
  agenda_end_time time not null,
  check_in_start_time time not null,
  check_in_end_time time not null,
  late_tolerance_minutes integer not null default 15 check (late_tolerance_minutes between 0 and 240),
  check_out_start_time time not null,
  check_out_end_time time not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, session_number),
  check (agenda_start_time < agenda_end_time),
  check (check_in_start_time <= check_in_end_time),
  check (check_out_start_time <= check_out_end_time),
  check (check_in_start_time >= agenda_start_time and check_in_end_time <= agenda_end_time),
  check (check_out_start_time >= agenda_start_time and check_out_end_time <= agenda_end_time)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  address text not null default '',
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  radius_meters integer not null check (radius_meters between 10 and 5000),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.event_sessions(id) on delete restrict,
  member_id uuid not null references public.committee_members(id) on delete restrict,
  overall_status text not null default 'incomplete' check (overall_status in ('present', 'late', 'permission', 'sick', 'absent', 'incomplete')),
  check_in_status text check (check_in_status in ('on_time', 'late', 'outside_window', 'manual')),
  check_out_status text check (check_out_status in ('valid', 'outside_window', 'manual')),
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_location_id uuid references public.locations(id) on delete set null,
  check_in_latitude numeric(9, 6) check (check_in_latitude between -90 and 90),
  check_in_longitude numeric(9, 6) check (check_in_longitude between -180 and 180),
  check_in_accuracy_meters numeric(10, 2) check (check_in_accuracy_meters >= 0),
  check_in_distance_meters numeric(10, 2) check (check_in_distance_meters >= 0),
  check_in_inside_radius boolean,
  check_out_location_id uuid references public.locations(id) on delete set null,
  check_out_latitude numeric(9, 6) check (check_out_latitude between -90 and 90),
  check_out_longitude numeric(9, 6) check (check_out_longitude between -180 and 180),
  check_out_accuracy_meters numeric(10, 2) check (check_out_accuracy_meters >= 0),
  check_out_distance_meters numeric(10, 2) check (check_out_distance_meters >= 0),
  check_out_inside_radius boolean,
  check_in_notes text,
  check_out_notes text,
  photo_path text,
  source text not null default 'public' check (source in ('public', 'manual', 'import')),
  work_duration_seconds integer check (work_duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, session_id, member_id),
  check (check_out_at is null or check_in_at is null or check_out_at >= check_in_at)
);

create table public.admin_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance_records(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (length(trim(reason)) > 0),
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index divisions_event_active_idx on public.divisions(event_id, is_active, sort_order);
create index committee_members_event_division_active_idx on public.committee_members(event_id, division_id, is_active, name);
create index event_sessions_event_active_date_idx on public.event_sessions(event_id, is_active, session_date);
create index locations_event_active_idx on public.locations(event_id, is_active);
create index attendance_event_session_idx on public.attendance_records(event_id, session_id);
create index attendance_event_member_idx on public.attendance_records(event_id, member_id);
create index attendance_created_at_idx on public.attendance_records(created_at desc);
create index admin_corrections_attendance_idx on public.admin_corrections(attendance_id, created_at desc);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.is_committee_chair()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'committee_chair', false);
$$;

alter table public.events enable row level security;
alter table public.divisions enable row level security;
alter table public.committee_members enable row level security;
alter table public.event_sessions enable row level security;
alter table public.locations enable row level security;
alter table public.attendance_records enable row level security;
alter table public.admin_corrections enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.events, public.divisions, public.committee_members, public.event_sessions, public.locations, public.attendance_records, public.admin_corrections, public.audit_logs from anon, authenticated;

grant select on table public.events, public.divisions, public.event_sessions to anon, authenticated;
grant select (id, event_id, division_id, public_code, name, is_active) on table public.committee_members to anon, authenticated;

create or replace view public.active_committee_members
with (security_invoker = true)
as
select id, event_id, division_id, public_code, name
from public.committee_members
where is_active;

revoke all on public.active_committee_members from anon, authenticated;
grant select on public.active_committee_members to anon, authenticated;

create policy public_read_active_events on public.events
  for select to anon, authenticated
  using (status = 'active');

create policy public_read_active_divisions on public.divisions
  for select to anon, authenticated
  using (is_active and exists (select 1 from public.events e where e.id = event_id and e.status = 'active'));

create policy public_read_active_members on public.committee_members
  for select to anon, authenticated
  using (is_active and exists (select 1 from public.events e where e.id = event_id and e.status = 'active'));

create policy public_read_active_sessions on public.event_sessions
  for select to anon, authenticated
  using (is_active and exists (select 1 from public.events e where e.id = event_id and e.status = 'active'));

create policy chair_manage_events on public.events
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_divisions on public.divisions
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_members on public.committee_members
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_sessions on public.event_sessions
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_locations on public.locations
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_attendance on public.attendance_records
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_corrections on public.admin_corrections
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());

create policy chair_manage_audit_logs on public.audit_logs
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());
