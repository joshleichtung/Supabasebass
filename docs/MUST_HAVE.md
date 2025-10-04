# MUST HAVE Features (Core)

## 1) Shared Transport and Sync
- Global tempo (default 90 BPM), play/stop, key, scale mode.
- Single master clock with host heartbeat and NTP-style offset on clients.
- All instruments quantize to 16ths; start/stop in phase.

**Acceptance**
- Changing tempo updates all devices within 1 bar.
- Start/stop is simultaneous within audible tolerance on all devices.

## 2) Realtime Presence and Rooms
- Room creation with short code (e.g., `/?r=K9FQ`).
- Presence avatars show joined users and assigned instrument.
- Host election: first joiner becomes host; automatic failover.

**Acceptance**
- Opening the same room on two devices shows two distinct avatars within 1s.
- If host leaves, another device becomes host and playback continues within 1 bar.

## 3) Bass Instrument (XY)
- Full-screen XY pad:
  - X: note density (rests → constant 8ths).
  - Y: harmonic complexity (root-only → chord tones → passing tones).
- Auto-harmonized to the current key and chord.
- Visual feedback: oscilloscope line with pulses on hits.

**Acceptance**
- Touch movement audibly changes density/complexity; visuals respond on every hit.
- On chord change, bass line revoices to nearest chord tone without audible glitch.

## 4) Drums (XY) + Two FX
- XY pad:
  - X: groove density (minimal → busy).
  - Y: humanization/swing (straight → lilt).
- FX: Stutter (1/8 retrigger) and Filter (LP sweep macro).
- Visual feedback: 16-step arc with sparks on hits.

**Acceptance**
- XY morphs patterns in real time; stutter and filter are immediately audible.
- Visuals track triggers at performance frame rates.

## 5) Projector “Conductor” View
- Grid showing all instruments, avatars, tempo, key, and a sweeping playhead.
- Tap to temporarily focus/solo an instrument for ~10 seconds.

**Acceptance**
- Changes from any device reflect in conductor view within 200 ms (network permitting).
- Solo mode audibly isolates the instrument and highlights its visuals.

## 6) Minimal Persistence
- Current room state: transport, progression, and each instrument’s `params` saved in Supabase and reloaded on refresh.
- Debounced host-side upsert every 3 seconds.

**Acceptance**
- Reloading any client restores the previous pattern/params within 2 seconds.