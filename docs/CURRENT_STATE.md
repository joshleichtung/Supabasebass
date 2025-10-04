# JamSync - Current State Documentation

**Last Updated:** 2025-10-04
**Version:** 0.0.1
**Project Name:** JamSync (formerly BassBase)

## Overview

JamSync is a multiplayer music jam application built for browser-based real-time collaboration. Users can join rooms, control instruments via XY pads, and jam together with synchronized audio playback.

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Real-time:** Supabase Realtime (Broadcast + Presence)
- **Audio:** Tone.js 14.7.77
- **Routing:** React Router DOM 6

## Architecture

### Component Structure
```
src/
├── views/
│   ├── LandingView.tsx      # Room creation/joining
│   ├── BassView.tsx          # Bass instrument control
│   ├── DrumsView.tsx         # Drums instrument control
│   └── ConductorView.tsx     # Multi-instrument view with audio playback
├── components/
│   └── XYPad.tsx             # Shared XY control pad
├── instruments/
│   ├── bass/
│   │   ├── BassEngine.ts     # Bass audio synthesis
│   │   ├── BassVisuals.tsx   # Waveform visualization
│   │   └── engine.ts         # Bass note generation logic
│   └── drums/
│       ├── DrumsEngine.ts    # Drums audio synthesis
│       ├── DrumsVisuals.tsx  # Arc visualization
│       └── engine.ts         # Drum pattern morphing
├── hooks/
│   ├── useScheduler.ts       # 16th note timing scheduler
│   ├── useConductorAudio.ts  # Conductor audio management
│   ├── useTransport.ts       # Global transport state
│   ├── usePresence.ts        # Supabase presence tracking
│   ├── useInstrumentBroadcast.ts  # Parameter broadcasting
│   ├── useResolvedRoomId.ts  # Short code → UUID resolution
│   └── usePeriodicCleanup.ts # Memory leak prevention
└── lib/
    ├── supabase.ts           # Supabase client
    ├── transport.ts          # Transport state management
    └── room-manager.ts       # Room persistence (localStorage)
```

### Audio Architecture

**Muting Strategy:**
- **Instrument Views:** Create muted audio engines for local visualization only
- **Conductor View:** Creates unmuted engines that actually play audio

**Audio Engines:**
- **BassEngine:** Tone.MonoSynth with separate Volume node for muting
- **DrumsEngine:** 3 synths (MembraneSynth, NoiseSynth, MetalSynth) + Filter

**Scheduling:**
- Uses `Tone.Loop` for 16th note callbacks at 90 BPM
- Each view runs independent scheduler for local visualization
- Conductor scheduler plays actual audio
- Minimum trigger intervals prevent timing conflicts (10ms bass, 5ms drums)

## Implemented Features

### ✅ Core Functionality
- [x] Room creation with short codes (4-char alphanumeric)
- [x] Multi-user presence tracking
- [x] Real-time parameter synchronization
- [x] XY pad controls with hover tracking (no click required)
- [x] Bass instrument (MonoSynth with density/complexity controls)
- [x] Drums instrument (kick/snare/hihat with density/groove controls)
- [x] Conductor view showing all instruments
- [x] Visual feedback (waveforms, drum arcs, hit flashes)

### ✅ Performance Optimizations
- [x] Change-based broadcast filtering (0.5% threshold)
  - Reduces broadcasts from 60/sec to 5-15/sec
  - Zero broadcasts when stationary
- [x] Immediate synchronous scheduler cleanup
- [x] Periodic Transport cleanup (every 10 minutes)
- [x] Console logging removed from hot paths
- [x] Try-catch error handling for scheduling conflicts

### ✅ Effects
- [x] Drums: Filter sweep (lowpass with cutoff control)
- [x] Drums: Stutter effect (retriggering recent hits)

## Recent Bug Fixes

### Audio Stuttering Resolution (2025-10-04)
**Problem:** Progressive audio stuttering, eventually stopping completely

**Root Causes Identified & Fixed:**
1. **Tone.Draw.schedule() queue buildup**
   - Scheduling visual callbacks faster than execution
   - Solution: Replaced with direct state updates + setTimeout

2. **setTimeout cleanup leak**
   - Orphaned callbacks executing after unmount
   - Solution: Removed all setTimeout delays, immediate cleanup

3. **Broadcast flood**
   - 60+ messages/sec per instrument causing React re-render churn
   - Solution: Change-based filtering (only broadcast when position changes ≥ 0.5%)

4. **Tone.js scheduling conflicts**
   - Multiple Tone.Loop instances conflicting on shared Transport
   - Solution: Immediate stop/dispose, minimum trigger intervals, error handling

## Known Issues

### ⚠️ Deferred (Not Blocking Demo)
- **Syncing between windows:** Minor timing issues when multiple windows open
  - Audio works, but not perfectly locked
  - Acceptable for hackathon demo

## Data Flow

### Parameter Updates (Instrument → Conductor)
```
1. User moves cursor on XYPad
2. handleMove() updates local state immediately (smooth feedback)
3. If change >= 0.5%, broadcast params via Supabase
4. Conductor receives broadcast, updates engine params
5. Scheduler triggers synth with new params
```

### Presence Updates
```
1. View subscribes to presence channel
2. Tracks user with instrument, room info
3. All views receive sync events
4. UI updates to show connected users
```

### Transport State
```
1. Host controls play/pause (currently via toggle button)
2. Transport state broadcast to all views
3. Each view's scheduler reacts to isPlaying changes
4. BPM: currently fixed at 90, key: C major
```

## Performance Characteristics

### Broadcast Frequency
- **Before optimization:** 60+ broadcasts/sec per instrument
- **After optimization:** 5-15/sec during movement, 0 when stationary

### Audio Latency
- **Scheduling accuracy:** Sample-accurate via Tone.js
- **Network latency:** ~50-200ms (Supabase Realtime)
- **Visual feedback:** Immediate (no network delay)

### Memory Management
- Automatic cleanup every 10 minutes (Transport.cancel())
- Component unmount cleanup (dispose audio nodes, clear timeouts)
- localStorage for room params (3-second debounce on save)

## Browser Compatibility

**Tested:**
- ✅ Chrome/Edge (Chromium)
- ✅ Safari (macOS/iOS)

**Requirements:**
- Web Audio API support
- WebSocket support
- ES2020+ features

## Environment Variables

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Next Steps

See `docs/DEPLOYMENT.md` and the project roadmap for upcoming features:
- [ ] Production deployment
- [ ] Start/stop controls with spacebar
- [ ] Tempo control UI
- [ ] Additional effects (auto-wah, delay)
