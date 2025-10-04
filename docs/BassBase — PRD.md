# BassBase — PRD

## Summary
BassBase is a beginner-friendly, multiplayer jam space that runs in the browser. While developers wait for builds and AI agents to finish, they can join a shared room and control an instrument with simple XY controls. Everything is synchronized via Supabase Realtime. Default tempo is 90 BPM. A projector view shows the whole band. Stretch: observability via Datadog RUM during the live demo.

## Goals
- Deliver a delightful, low-friction musical experience for 2–3 people on phones/tablets plus a projector.
- Showcase Supabase Realtime with tight, audible sync and presence.
- Provide a single shared transport (tempo, key) and a chord progression timeline that instruments can follow.

## Users and use cases
- **Hackathon participants**: open a link, pick an instrument, start interacting within 5 seconds.
- **Judges/audience**: hear immediate feedback to touch; see clear visuals that prove realtime sync and multi-user presence.

## Success metrics (demo-oriented)
- Time-to-first-sound under 5 seconds on a fresh device.
- Perceived sync across 2–3 devices within a 16th-note at 90 BPM.
- No scrolling, single-screen controls per instrument on an 8–11 inch tablet and modern phones.

## Non-goals (for hack day)
- Accounts, long-term persistence, social graphs, CRDT research, export engines beyond a tiny optional bounce.