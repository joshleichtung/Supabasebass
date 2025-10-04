# Realtime Channels (Authoritative List)

Use these names exactly. Channel routing is centralized in `app/realtime/channels.ts`.

- `room:{id}:presence` — presence and host election state
- `room:{id}:transport` — heartbeat and transport state
- `room:{id}:bass` — bass instrument param updates
- `room:{id}:drums` — drum instrument param updates
- `room:{id}:harmony` — harmony instrument param updates (stretch)
- `room:{id}:melody` — melody instrument param updates (stretch)
- `room:{id}:progression` — chord progression updates (stretch)

Event catalog lives in `docs/CONTRACTS.md` and code schemas in `app/realtime/contracts.ts`.
