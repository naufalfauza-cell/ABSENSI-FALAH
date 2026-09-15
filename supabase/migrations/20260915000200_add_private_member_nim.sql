alter table public.committee_members
  add column if not exists nim text;

create unique index if not exists committee_members_event_nim_uidx
  on public.committee_members(event_id, nim)
  where nim is not null;

revoke select (nim) on public.committee_members from anon, authenticated;
