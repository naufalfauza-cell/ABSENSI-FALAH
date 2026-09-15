# Vercel deployment notes

This repository now deploys as two Vercel surfaces:

- The Vite-built React application is collected from `dist`.
- `api/[...path].ts` exposes the existing Express API as a Node.js serverless function.

`server.ts` remains the local development/production listener. It is not used as a long-running process by Vercel. The reusable Express application and current JSON-backed routes live in `server/app.ts`.

The current JSON persistence in `data/attendance_store.json` is preserved temporarily for compatibility. Vercel functions are stateless and their local filesystem is not durable or shared between invocations. Attendance data must not be considered reliable on Vercel until the later Supabase attendance API phase is implemented.

The Supabase schema and seed files are not used by this deployment change and remain untouched.
