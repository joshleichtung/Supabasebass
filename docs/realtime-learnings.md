# Supabase Realtime - Key Learnings

**Project:** Collaborative Cursor Tracker
**Date:** October 4, 2025
**Purpose:** Prototype for music collaboration app hackathon

## Quick Setup Summary

### 1. Connect to Existing Project
```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Get your credentials
supabase projects api-keys --project-ref YOUR_PROJECT_REF
```

### 2. Initialize Client
```javascript
const supabase = window.supabase.createClient(
    'https://YOUR_PROJECT_REF.supabase.co',
    'YOUR_ANON_KEY'
)
```

---

## Core Realtime Concepts

### Channels (The Foundation)
**What:** Named "rooms" that group users together
**Purpose:** All communication happens within a channel

```javascript
const channel = supabase.channel('room-name', {
    config: {
        presence: { key: userId },
        broadcast: { self: false }
    }
})
```

**Key settings:**
- `presence.key` - Unique identifier for this user's presence
- `broadcast.self: false` - Don't receive your own broadcasts (prevents loops)

---

### Presence (Who's Online)
**What:** Shared state tracking across all clients
**Purpose:** Know who's in the channel and their metadata

#### Track Your Presence
```javascript
await channel.track({
    user_id: userId,
    name: userName,
    emoji: userEmoji,
    // Any JSON data you want
})
```

#### Listen for Changes
```javascript
channel.on('presence', { event: 'sync' }, () => {
    const users = channel.presenceState()
    // users = { user1: [{...metadata}], user2: [{...metadata}] }
})

channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log(`${key} joined`)
})

channel.on('presence', { event: 'leave' }, ({ key }) => {
    console.log(`${key} left`)
})
```

**Auto-cleanup:** When a user closes the tab/browser, Supabase automatically removes them from presence

---

### Broadcast (Real-Time Messages)
**What:** Fast, ephemeral messaging between clients
**Purpose:** Send transient events (cursor moves, note events, etc.)

#### Send Messages
```javascript
channel.send({
    type: 'broadcast',
    event: 'cursor-move',  // Custom event name
    payload: {
        x: 50,
        y: 75,
        // Any JSON data
    }
})
```

#### Receive Messages
```javascript
channel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
    console.log('Cursor moved:', payload)
})
```

**Key characteristics:**
- ⚡ Low-latency (typically <100ms)
- 📡 Not stored in database
- 🔄 Use custom event names to organize message types
- Works only between currently connected clients

---

### Subscribe to Channel
```javascript
channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
        // Channel is connected, start tracking presence
        await channel.track({ /* metadata */ })
    }
})
```

**Important:** You must subscribe before you can send/receive messages!

---

## Architecture Pattern

```
User opens page
    ↓
Create channel
    ↓
Subscribe to channel
    ↓
├─ Listen for presence events (sync, join, leave)
├─ Listen for broadcast events (custom events)
└─ Track own presence with metadata
    ↓
On user interaction (mousemove, etc.)
    ↓
Broadcast event to channel
    ↓
Other clients receive broadcast
    ↓
Update UI based on received data
```

---

## Lessons Learned

### 1. Presence vs Broadcast - When to Use Each

| Feature | Use Case | Persistence |
|---------|----------|-------------|
| **Presence** | User metadata (name, status, settings) | Synced across all clients |
| **Broadcast** | Frequent events (cursor moves, notes) | Not stored, just sent |

**Rule of thumb:**
- Presence = "Who is here and what are their properties?"
- Broadcast = "What just happened right now?"

### 2. Channel Configuration Gotchas

```javascript
// ❌ DON'T: Receive your own broadcasts (causes loops)
config: { broadcast: { self: true } }

// ✅ DO: Ignore your own broadcasts
config: { broadcast: { self: false } }
```

### 3. Event Naming Strategy

Use descriptive, action-based event names:
```javascript
// Good
'cursor-move'
'note-played'
'user-muted'

// Bad
'update'
'data'
'event'
```

### 4. Presence State Structure

`presenceState()` returns an object:
```javascript
{
    "user-abc123": [{ user_id: "user-abc123", name: "User 42", emoji: "👆" }],
    "user-def456": [{ user_id: "user-def456", name: "User 87", emoji: "✌️" }]
}
```

**Note:** The array allows for multiple presences per key (advanced use cases)

### 5. Performance Considerations

**Broadcast throttling:**
```javascript
// ❌ DON'T: Send on every pixel move (too frequent)
mousemove → send immediately

// ✅ DO: Throttle to reasonable rate
mousemove → throttle to ~60fps → send
```

For our cursor tracker, we send on every mousemove because:
- Movements are within the cursor area only
- Natural mouse movement limits frequency
- Low payload size

For music apps with many note events, consider batching.

---

## Migration to Music App

### Presence - Track Musicians
```javascript
await channel.track({
    user_id: userId,
    instrument: 'piano',
    volume: 0.8,
    muted: false,
    color: userColor
})
```

### Broadcast - Send Note Events
```javascript
// On key press
channel.send({
    type: 'broadcast',
    event: 'note-on',
    payload: {
        note: 'C4',
        velocity: 100,
        timestamp: Date.now()
    }
})

// On key release
channel.send({
    type: 'broadcast',
    event: 'note-off',
    payload: {
        note: 'C4',
        timestamp: Date.now()
    }
})
```

### Multiple Event Types
```javascript
// Listen for different events
channel
    .on('broadcast', { event: 'note-on' }, handleNoteOn)
    .on('broadcast', { event: 'note-off' }, handleNoteOff)
    .on('broadcast', { event: 'tempo-change' }, handleTempoChange)
    .subscribe()
```

---

## The Third Feature: Postgres Changes

We didn't use this in the cursor tracker, but it's useful for:
- Saving compositions to database
- Chat messages
- Persistent data that needs to be stored

```javascript
channel.on('postgres_changes',
    {
        event: 'INSERT',
        schema: 'public',
        table: 'compositions'
    },
    (payload) => {
        console.log('New composition saved:', payload.new)
        loadComposition(payload.new)
    }
)
```

**Use case for music app:**
- Real-time note events → **Broadcast** (transient)
- Save composition → **Postgres Changes** (persistent)

---

## Common Issues & Solutions

### Issue: "Cannot read presenceState"
**Cause:** Trying to access presence before channel is subscribed
**Solution:** Only call `presenceState()` after `SUBSCRIBED` status

### Issue: Receiving own broadcasts
**Cause:** `self: true` in config
**Solution:** Set `broadcast: { self: false }`

### Issue: Users not appearing in presence
**Cause:** Not calling `channel.track()` after subscribe
**Solution:** Call `track()` inside the subscribe callback when status is `SUBSCRIBED`

### Issue: Presence not cleaning up
**Cause:** Usually handles automatically, but check connection status
**Solution:** Monitor `presence.leave` events and implement manual cleanup if needed

---

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Broadcast Guide](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence Guide](https://supabase.com/docs/guides/realtime/presence)
- [Postgres Changes Guide](https://supabase.com/docs/guides/realtime/postgres-changes)

---

## Next Steps for Music App

1. **Audio Engine Integration**
   - Use Web Audio API or Tone.js
   - Map broadcast events to audio playback
   - Sync timing across clients

2. **Latency Compensation**
   - Add timestamps to note events
   - Implement client-side prediction
   - Consider server-side timing authority

3. **Scalability**
   - Test with 10+ concurrent users
   - Implement event batching if needed
   - Monitor Supabase realtime quotas

4. **Persistence**
   - Add Postgres Changes for saving sessions
   - Store compositions in database
   - Load previous sessions

5. **UX Enhancements**
   - Visual feedback for other users' notes
   - Instrument selection UI
   - Volume/mute controls
   - Session recording/playback
