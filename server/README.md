# Server trust boundary

Attendance validation belongs here, not in the browser. Client-provided timestamps, status labels, distance calculations, location IDs, and inside/outside flags are ignored. The server uses its own Jakarta timestamp, database session configuration, private session-to-location mapping, and Haversine calculation before writing attendance through the server-only Supabase service role.
