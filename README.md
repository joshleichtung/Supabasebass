# 🎯 Supabase Realtime Demo: Collaborative Cursor Tracker

A lightweight prototype demonstrating **Supabase Broadcast** and **Presence** features for real-time collaboration.

## What This Demonstrates

### ✅ **Broadcast**
- Low-latency cursor position updates between clients
- `channel.send()` to broadcast events
- `channel.on('broadcast')` to receive events

### ✅ **Presence**
- Track who's online in real-time
- Share user metadata (name, color)
- Auto-cleanup when users leave
- `channel.track()` to share state
- `channel.presenceState()` to get all users

## Setup Instructions

### 1. Wait for Supabase to Start
```bash
# Currently running in background...
# You'll see "Started supabase local development setup" when ready
```

### 2. Get Your Credentials
```bash
supabase status
```

Look for:
- **API URL**: `http://127.0.0.1:54321`
- **anon key**: (long JWT token)

### 3. Update app.js
Open `app.js` and replace:
```javascript
const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'  // ← Paste your anon key
```

### 4. Open in Browser
```bash
# Simple Python server:
python3 -m http.server 8000

# Or use any local server
```

Visit: `http://localhost:8000`

### 5. Test It!
1. Open the page in **multiple browser tabs**
2. Move your mouse in each tab
3. Watch cursors appear and move in real-time!
4. Close a tab and watch the user disappear from the sidebar

## Key Code Concepts

### Creating a Channel
```javascript
const channel = supabase.channel('cursor-room', {
    config: {
        presence: { key: userId },
        broadcast: { self: false }
    }
})
```

### Tracking Presence
```javascript
await channel.track({
    user_id: userId,
    name: userName,
    color: userColor
})
```

### Broadcasting Data
```javascript
channel.send({
    type: 'broadcast',
    event: 'cursor-move',
    payload: { x, y, user_id }
})
```

### Listening for Events
```javascript
channel
    .on('presence', { event: 'sync' }, () => {
        const users = channel.presenceState()
    })
    .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        updateCursor(payload)
    })
```

## How to Apply This to Your Music App

### Presence → Track Musicians
```javascript
await channel.track({
    user_id: userId,
    instrument: 'piano',
    muted: false,
    volume: 0.8
})
```

### Broadcast → Send Note Events
```javascript
channel.send({
    type: 'broadcast',
    event: 'note-played',
    payload: {
        note: 'C4',
        velocity: 100,
        timestamp: Date.now()
    }
})
```

### Sync → Timing and Playback
- Use presence for "who's in the session"
- Use broadcast for real-time note events
- Consider Postgres Changes for saving/loading compositions

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Broadcast Guide](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence Guide](https://supabase.com/docs/guides/realtime/presence)

## Next Steps

- Add **Postgres Changes** for database-backed features
- Implement **authorization** with RLS policies
- Scale up with rate limiting and connection management
- Deploy to production Supabase instance
