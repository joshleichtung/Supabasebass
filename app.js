// ========================================
// Supabase Realtime Demo: Cursor Tracker
// Demonstrates: Broadcast + Presence
// ========================================

// Configuration - Connected to your Supabase Cloud project
const SUPABASE_URL = 'https://elikhejyygxjxqswnues.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaWtoZWp5eWd4anhxc3dudWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTUzMjksImV4cCI6MjA3NTEzMTMyOX0.7a-gGdxANOc9MkNEknDr8V2ouhc59INSGCgqFdMWQEs'

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Emoji pool for user cursors
const cursorEmojis = ['👆', '✌️', '👉', '☝️', '🤘', '🖖', '👍', '🤙', '👋', '🤚', '✋', '🖐️', '👌', '🤏', '🫰']

// Generate random user identity
const userId = `user-${Math.random().toString(36).substr(2, 9)}`
const userName = `User ${Math.floor(Math.random() * 1000)}`
const userColor = `hsl(${Math.random() * 360}, 70%, 60%)`
const userEmoji = cursorEmojis[Math.floor(Math.random() * cursorEmojis.length)]

// Store reference to cursors and users
const cursors = new Map()
const users = new Map()

// ========================================
// PRESENCE: Track online users
// ========================================

// Create a channel for the cursor room
const channel = supabase.channel('cursor-room', {
    config: {
        presence: {
            key: userId
        },
        broadcast: {
            self: false  // Don't receive our own broadcasts
        }
    }
})

// Subscribe to presence events
channel
    .on('presence', { event: 'sync' }, () => {
        // Get all users currently in the room
        const state = channel.presenceState()
        updateUserList(state)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key)
        // Remove their cursor
        removeCursor(key)
    })

// ========================================
// BROADCAST: Send cursor positions
// ========================================

channel
    .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        updateCursor(payload)
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            console.log('✅ Connected to Supabase Realtime!')

            // Track our presence
            await channel.track({
                user_id: userId,
                name: userName,
                color: userColor,
                emoji: userEmoji,
                online_at: new Date().toISOString()
            })

            showStatus('Connected', 'connected')
            updateCurrentUser()
        } else if (status === 'CHANNEL_ERROR') {
            showStatus('Connection Error', 'disconnected')
        } else if (status === 'TIMED_OUT') {
            showStatus('Timed Out', 'disconnected')
        }
    })

// ========================================
// Mouse Movement Handler
// ========================================

const cursorArea = document.getElementById('cursor-area')

cursorArea.addEventListener('mousemove', (e) => {
    const rect = cursorArea.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Broadcast cursor position to other users
    channel.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
            user_id: userId,
            name: userName,
            color: userColor,
            emoji: userEmoji,
            x: x,
            y: y
        }
    })
})

// ========================================
// UI Update Functions
// ========================================

function updateCursor(data) {
    const { user_id, name, color, emoji, x, y } = data

    let cursorEl = cursors.get(user_id)

    if (!cursorEl) {
        // Create new cursor element
        cursorEl = document.createElement('div')
        cursorEl.className = 'cursor'
        cursorEl.innerHTML = `
            <div class="cursor-emoji">${emoji || '👆'}</div>
            <div class="cursor-label">${name}</div>
        `
        cursorArea.appendChild(cursorEl)
        cursors.set(user_id, cursorEl)
    }

    // Update cursor position
    cursorEl.style.left = `${x}%`
    cursorEl.style.top = `${y}%`
}

function removeCursor(user_id) {
    const cursorEl = cursors.get(user_id)
    if (cursorEl) {
        cursorEl.remove()
        cursors.delete(user_id)
    }
    users.delete(user_id)
    updateUserListUI()
}

function updateUserList(state) {
    users.clear()

    // state is an object where keys are user IDs
    for (const userId in state) {
        const presences = state[userId]
        if (presences && presences.length > 0) {
            const user = presences[0]
            users.set(userId, user)
        }
    }

    updateUserListUI()
}

function updateUserListUI() {
    const userList = document.getElementById('user-list')
    userList.innerHTML = ''

    if (users.size === 0) {
        userList.innerHTML = '<p style="color: #999; font-size: 13px;">No other users online</p>'
        return
    }

    users.forEach((user, id) => {
        if (id === userId) return // Skip ourselves

        const userItem = document.createElement('div')
        userItem.className = 'user-item'
        userItem.innerHTML = `
            <div class="user-emoji">${user.emoji || '👆'}</div>
            <div class="user-name">${user.name}</div>
        `
        userList.appendChild(userItem)
    })
}

function updateCurrentUser() {
    const currentUserEl = document.getElementById('current-user')
    currentUserEl.innerHTML = `
        <span style="font-size: 16px; margin-right: 6px;">${userEmoji}</span>
        ${userName}
    `
}

function showStatus(message, type) {
    let statusEl = document.querySelector('.status')

    if (!statusEl) {
        statusEl = document.createElement('div')
        statusEl.className = 'status'
        document.body.appendChild(statusEl)
    }

    statusEl.textContent = message
    statusEl.className = `status ${type}`

    // Auto-hide after 3 seconds if connected
    if (type === 'connected') {
        setTimeout(() => {
            statusEl.style.opacity = '0'
            setTimeout(() => statusEl.remove(), 300)
        }, 3000)
    }
}

// ========================================
// Cleanup on page unload
// ========================================

window.addEventListener('beforeunload', () => {
    channel.unsubscribe()
})
