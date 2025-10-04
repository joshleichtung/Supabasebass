import { useEffect, useState } from 'react'
import { joinRoom } from '../lib/room-manager'

/**
 * Resolve a room code (from URL) to its UUID
 * The URL contains short codes but we need UUIDs for database queries
 */
export function useResolvedRoomId(codeFromUrl: string | null): string | null {
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    if (!codeFromUrl) {
      setRoomId(null)
      return
    }

    // If it's already a UUID (has dashes), use it directly
    if (codeFromUrl.includes('-')) {
      setRoomId(codeFromUrl)
      return
    }

    // Otherwise resolve the short code to UUID
    joinRoom(codeFromUrl)
      .then((result) => {
        if (result) {
          setRoomId(result.room.id)
        } else {
          console.error(`Room code "${codeFromUrl}" not found`)
          setRoomId(null)
        }
      })
      .catch((err) => {
        console.error('Failed to resolve room code:', err)
        setRoomId(null)
      })
  }, [codeFromUrl])

  return roomId
}
