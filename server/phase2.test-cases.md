# Phase 2 acceptance cases

1. `/api/data` returns 80 active committee members and 3 active sessions, but no NIM, phone, attendance list, admin PIN, or geofence coordinates.
2. Check-in rejects missing/invalid GPS, wrong event membership, wrong date, outside check-in window, outside session geofence, and duplicate check-in.
3. Check-in derives Jakarta server time, distance, inside-radius state, and on-time/late status on the server.
4. Check-out requires an existing check-in, correct date/window, valid session geofence, and rejects duplicate check-out.
5. `/api/attendance/status` returns only the requested member/session record.
6. Legacy admin mutation routes return 401 until Phase 3 authentication is complete.
