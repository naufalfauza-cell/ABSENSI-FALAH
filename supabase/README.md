# Supabase data source of truth

The live project is `absensi-falah-2026`. Its verified data is authoritative:

- 1 active event
- 14 active divisions
- 80 active committee members
- 3 active sessions
- 2 verified locations
- 0 attendance records before the event

The live session mapping is maintained in `session_locations`:

- Session 1 — FEB Universitas Airlangga — 150 m
- Session 2 — FEB Universitas Airlangga — 150 m
- Session 3 — ASEEC Tower Universitas Airlangga — 150 m

`seed.sql` is retained only as a development/example fixture from the original
prototype. It contains stale generated data and must never be run against the
live database.

All schema changes must be forward-only migrations. The live database may contain
changes applied through Supabase before repository synchronization, so inspect
the live schema before applying a migration and use `if not exists` guards where
appropriate.
