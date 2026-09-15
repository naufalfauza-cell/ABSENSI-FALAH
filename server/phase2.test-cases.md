# Phase 2 acceptance cases

1. `/api/public/bootstrap` returns the active event, 14 divisions, and 3 sessions without location coordinates or radii.
2. `/api/public/members?divisionId=...` returns only active member IDs, names, public codes, and division IDs; the live total is 80.
3. `/api/public/attendance-state?memberId=...` returns only the selected member's safe attendance state.
4. Closed sessions reject check-in; check-in rejects missing/invalid GPS, wrong event membership, wrong date, poor accuracy, outside session geofence, and duplicate check-in.
5. Check-in derives Jakarta server time, distance, inside-radius state, and on-time/late status on the server.
6. Check-out requires an existing check-in, correct operational state/date/window, valid session geofence, and rejects duplicate check-out.
7. `/api/data` returns 410; legacy admin mutation routes return 403 until Phase 3 Supabase Auth is implemented.
