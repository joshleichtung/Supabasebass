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
  const readyRef = useRef(false)

  useEffect(() => {
    if (!roomId) return

    const channels = channelNames(roomId)
    const channelName = channels[instrument]

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[${instrument}] Channel subscribed, ready to broadcast`)
        readyRef.current = true
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[${instrument}] Channel error`)
        readyRef.current = false
      } else if (status === 'TIMED_OUT') {
        console.error(`[${instrument}] Channel timed out`)
        readyRef.current = false
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      readyRef.current = false
    }
  }, [roomId, instrument])

  // Broadcast params with throttling (60fps max)
  const broadcastParams = useCallback((params: {
    x: number
    y: number
    fx?: Record<string, unknown>
  }) => {
    if (!channelRef.current || !readyRef.current) {
      console.warn(`[${instrument}] Channel not ready, skipping broadcast`)
      return
    }

    // Throttle to 60fps
    if (throttleRef.current) return

    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null
    }, 16) // ~60fps

    console.log(`[${instrument}] Broadcasting params:`, params)
    channelRef.current.send({
      type: 'broadcast',
      event: 'instr:update',
      payload: {
        instrument,
        params,
        ts: Date.now()
      }
    })
  }, [instrument])

  return { broadcastParams }
}
