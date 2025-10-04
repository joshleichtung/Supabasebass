import { useEffect, useState, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { channelNames } from '../realtime/channels'
import type { PresenceState } from '../types/presence'

export function usePresence(roomId: string | null, instrument: 'bass' | 'drums' | 'harmony' | 'melody' | 'conductor' | null) {
  const [users, setUsers] = useState<Record<string, PresenceState>>({})
  const [isHost, setIsHost] = useState(false)
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!roomId || !instrument) return

    const channels = channelNames(roomId)

    // Create presence channel
    const channel = supabase.channel(channels.presence, {
      config: {
        presence: { key: userId },
        broadcast: { self: false },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const userList: Record<string, PresenceState> = {}

        // Flatten presence state
        for (const key in state) {
          const presences = state[key]
          if (presences && presences.length > 0) {
            userList[key] = presences[0]
          }
        }

        setUsers(userList)

        // Host election: user with lowest ID (alphabetically first)
        const userIds = Object.keys(userList).sort()
        const hostId = userIds[0]
        setIsHost(hostId === userId)

        console.log('Presence sync:', {
          users: userIds.length,
          isHost: hostId === userId,
          hostId,
          myId: userId,
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to presence channel')

          // Track our presence
          await channel.track({
            user_id: userId,
            name: `${instrument} player`,
            instrument,
            joined_at: new Date().toISOString(),
            is_host: false, // Will be updated by sync event
          })
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Presence channel error')
        } else if (status === 'TIMED_OUT') {
          console.error('Presence channel timed out')
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, instrument, userId])

  return {
    users,
    isHost,
    userId,
    userCount: Object.keys(users).length,
  }
}
