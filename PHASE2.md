# Phase 2 — Secure Attendance API

This branch moves public attendance from local JSON storage to Supabase.

## Server-authoritative rules

- The browser supplies only member/session identity plus GPS coordinates, accuracy, and optional notes.
- Server time in `Asia/Jakarta` determines the attendance date and time.
- The server validates that the member and session belong to the same active event.
- The server resolves the verified geofence from `session_locations` and computes Haversine distance itself.
- The server enforces operational state (`closed`, `checkin_open`, `checkout_open`, `completed`), date, and time eligibility.
- Duplicate attendance is prevented by `(event_id, session_id, member_id)`.
- Public data is split across `/api/public/bootstrap`, `/api/public/members`, and `/api/public/attendance-state`.
- Legacy `/api/data` returns HTTP 410 and never exposes a full store.
- Public responses do not return NIM, phone numbers, raw GPS, venue coordinates, radii, attendance tables, or admin credentials.
- Legacy admin mutation endpoints are disabled until Phase 3 Supabase Auth is implemented.

## Required Vercel server environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose as a `VITE_` variable)

The live database is authoritative for the current roster and venue configuration. The repository `supabase/seed.sql` is prototype-only and must never be run against production.

All sessions are initialized conservatively as `closed`; only the future authenticated Committee Chair admin flow may open them.
