# Security notes

- Never commit or expose `SUPABASE_SERVICE_ROLE_KEY`.
- Public committee users do not authenticate and cannot write directly to Supabase.
- Public API responses must not contain NIM, phone numbers, admin credentials, attendance lists, or geofence coordinates.
- Attendance mutations are validated server-side.
- Admin mutations remain disabled until Supabase Auth role checks are implemented in Phase 3.
