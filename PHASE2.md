# Phase 2 — Secure Attendance API

This branch moves public attendance writes from local JSON storage to Supabase.

## Server-authoritative rules

- The browser supplies only member/session identity plus GPS coordinates and optional notes.
- Server time in `Asia/Jakarta` determines the attendance date and time.
- The server validates the member and session belong to the same active event.
- The server resolves the allowed geofence from `session_locations` and computes Haversine distance itself.
- Check-in/check-out windows are enforced server-side.
- Duplicate attendance is prevented by the database unique constraint `(event_id, session_id, member_id)`.
- Public `/api/data` does not return NIM, phone numbers, attendance records, admin credentials, or geofence coordinates.
- Legacy admin mutation endpoints are disabled until Phase 3 Supabase Auth is implemented.

## Required Vercel server environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose as a `VITE_` variable)

The current frontend still needs a small compatibility update to send browser GPS `accuracy` and restore the selected member's attendance via `/api/attendance/status` after refresh. Do not promote this branch to production until those items and the Vercel environment variables are complete.
