# Build Plan and Architecture

## Stack
- Frontend: React + Vite (or Next.js) with Canvas 2D visuals and Web Audio API. Look at https://github.com/joshleichtung/vibeloop to see what worked well overall for a hackathon music project 
- Realtime/persistence: Supabase (Channels, Presence, Postgres).
- Optional observability: Datadog Browser RUM (stretch).
- Hosting: Fly.io for the frontend; Supabase hosts the backend.

## Repo layout