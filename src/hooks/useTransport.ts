import { useEffect, useState, useRef, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { channelNames } from '../realtime/channels'
import { TransportClock, TransportState, createHeartbeat } from '../lib/transport'
import { updateTransport } from '../lib/room-manager'

export function useTransport(roomId: string | null, isHost: boolean, initialBpm = 90) {
  const [state, setState] = useState<TransportState>({
    bpm: initialBpm,
    keyRoot: 'C',
    scaleMode: 'ionian',
    isPlaying: true,
    barStartHost: performance.now(),
    barIndex: 0,
  })

  const clockRef = useRef(new TransportClock())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatIntervalRef = useRef<number | null>(null)

  // Initialize transport channel
  useEffect(() => {
    if (!roomId) return

    const channels = channelNames(roomId)
    const channel = supabase.channel(channels.transport, {
      config: {
        broadcast: { self: false },
      },
    })

    // Listen for transport state updates
    channel
      .on('broadcast', { event: 'transport:state' }, ({ payload }: { payload: TransportState }) => {
        setState(payload)
      })
      .on('broadcast', { event: 'transport:pulse' }, ({ payload }: { payload: {
        hostNow: number
        barIndex: number
        barStartHost: number
        bpm: number
        isPlaying: boolean
      } }) => {
        // Sync clock with host
        clockRef.current.syncWithHost(payload.hostNow)

        // Update state from heartbeat
        setState(prev => ({
          ...prev,
          barIndex: payload.barIndex,
          barStartHost: payload.barStartHost,
          bpm: payload.bpm,
          isPlaying: payload.isPlaying,
        }))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, isHost])

  // Host heartbeat (1 Hz)
  useEffect(() => {
    if (!isHost || !roomId) {
      // Clear heartbeat if we're not host
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      return
    }

    // Send heartbeat every second
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (channelRef.current) {
        const pulse = createHeartbeat(state)
        channelRef.current.send({
          type: 'broadcast',
          event: 'transport:pulse',
          payload: pulse,
        })
      }
    }, 1000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }
  }, [isHost, roomId, state])

  // Play/Stop
  const togglePlay = useCallback(() => {
    if (!isHost) return

    const newState: TransportState = {
      ...state,
      isPlaying: !state.isPlaying,
      barStartHost: performance.now(), // Reset bar start time
      barIndex: state.isPlaying ? state.barIndex : 0, // Reset to bar 0 on play
    }

    setState(newState)

    // Broadcast to other clients
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'transport:state',
        payload: newState,
      })
    }

    // Persist to DB
    if (roomId) {
      updateTransport(roomId, {
        is_playing: newState.isPlaying,
        bar_start: new Date(newState.barStartHost).toISOString(),
      })
    }
  }, [isHost, state, roomId])

  // Change BPM
  const setBpm = useCallback((newBpm: number) => {
    if (!isHost) return

    const newState: TransportState = {
      ...state,
      bpm: newBpm,
    }

    setState(newState)

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'transport:state',
        payload: newState,
      })
    }

    if (roomId) {
      updateTransport(roomId, { bpm: newBpm })
    }
  }, [isHost, state, roomId])

  return {
    state,
    clock: clockRef.current,
    togglePlay,
    setBpm,
    isPlaying: state.isPlaying,
    bpm: state.bpm,
    barIndex: clockRef.current.getCurrentBar(state),
  }
}
