-- Phase 2 runtime fields. Forward-only and safe for the live database.
-- Existing session_locations rows remain authoritative; the direct location_id
-- is backfilled only when a session has exactly one existing mapping.

alter table public.event_sessions
  add column if not exists operational_state text;

update public.event_sessions
set operational_state = 'closed'
where operational_state is null;

alter table public.event_sessions
  alter column operational_state set default 'closed',
  alter column operational_state set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'event_sessions_operational_state_check'
      and conrelid = 'public.event_sessions'::regclass
  ) then
    alter table public.event_sessions
      add constraint event_sessions_operational_state_check
      check (operational_state in ('closed', 'checkin_open', 'checkout_open', 'completed'));
  end if;
end $$;

alter table public.event_sessions
  add column if not exists location_id uuid;

update public.event_sessions s
set location_id = mapping.location_id
from (
  select session_id, min(location_id) as location_id
  from public.session_locations
  group by session_id
  having count(*) = 1
) mapping
where s.id = mapping.session_id
  and s.location_id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'event_sessions_location_id_fkey'
      and conrelid = 'public.event_sessions'::regclass
  ) then
    alter table public.event_sessions
      add constraint event_sessions_location_id_fkey
      foreign key (location_id) references public.locations(id) on delete restrict;
  end if;
end $$;

alter table public.locations
  add column if not exists max_gps_accuracy_meters integer not null default 100;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'locations_max_gps_accuracy_check'
      and conrelid = 'public.locations'::regclass
  ) then
    alter table public.locations
      add constraint locations_max_gps_accuracy_check
      check (max_gps_accuracy_meters between 1 and 1000);
  end if;
end $$;

create index if not exists event_sessions_location_idx
  on public.event_sessions(location_id);
