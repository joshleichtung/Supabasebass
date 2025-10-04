import { useEffect, useRef, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { channelNames } from '../realtime/channels'

/**
 * Broadcast instrument params without playing audio
 * Instruments just send params, Conductor plays the audio
 */
export function useInstrumentBroadcast(
  roomId: string | null,
  instrument: 'bass' | 'drums' | 'harmony' | 'melody'
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const throttleRef = useRef<number | null>(null)

  useEffect(() => {
    if (!roomId) return

    const channels = channelNames(roomId)
    const channelName = channels[instrument]

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Broadcasting on ${instrument} channel`)
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, instrument])

  // Broadcast params with throttling (60fps max)
  const broadcastParams = useCallback((params: {
    x: number
    y: number
    fx?: Record<string, unknown>
  }) => {
    if (!channelRef.current) return

    // Throttle to 60fps
    if (throttleRef.current) return

    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null
    }, 16) // ~60fps

    const message = {
      type: 'broadcast',
      event: 'instr:update',
      payload: {
        instrument,
        params,
        ts: Date.now()
      }
    }

    console.log(`[${instrument}] Broadcasting params:`, params)
    channelRef.current.send(message)
  }, [instrument])

  return { broadcastParams }
}
