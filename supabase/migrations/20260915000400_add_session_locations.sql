create table if not exists public.session_locations (
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (session_id, location_id)
);

alter table public.session_locations enable row level security;
revoke all on public.session_locations from anon, authenticated;

create policy chair_manage_session_locations on public.session_locations
  for all to authenticated
  using (public.is_committee_chair())
  with check (public.is_committee_chair());
