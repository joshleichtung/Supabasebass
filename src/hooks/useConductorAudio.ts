import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { channelNames } from '../realtime/channels'
import { BassEngine } from '../instruments/bass/BassEngine'
import { DrumsEngine } from '../instruments/drums/DrumsEngine'
import { useScheduler } from './useScheduler'
import type { TransportState } from '../lib/transport'

interface InstrumentParams {
  x: number
  y: number
  fx?: Record<string, unknown>
}

/**
 * Conductor audio hook - plays ALL instruments locally
 * Listens to param updates from all instrument channels
 * Local timing, no backend blocking
 */
export function useConductorAudio(roomId: string | null, transport: TransportState) {
  const [audioStarted, setAudioStarted] = useState(false)

  // Audio engines
  const bassEngineRef = useRef<BassEngine | null>(null)
  const drumsEngineRef = useRef<DrumsEngine | null>(null)

  // Latest params from instruments (updated via realtime)
  const bassParamsRef = useRef<InstrumentParams>({ x: 0.5, y: 0.5 })
  const drumsParamsRef = useRef<InstrumentParams>({ x: 0.5, y: 0.5, fx: {} })

  // Channels
  const channelsRef = useRef<RealtimeChannel[]>([])

  // Initialize engines
  useEffect(() => {
    bassEngineRef.current = new BassEngine()
    drumsEngineRef.current = new DrumsEngine()

    return () => {
      bassEngineRef.current?.dispose()
      drumsEngineRef.current?.dispose()
    }
  }, [])

  // Subscribe to instrument param updates
  useEffect(() => {
    if (!roomId) return

    const channels = channelNames(roomId)
    const newChannels: RealtimeChannel[] = []

    // Bass channel
    const bassChannel = supabase.channel(channels.bass, {
      config: { broadcast: { self: false } }
    })

    bassChannel
      .on('broadcast', { event: 'instr:update' }, ({ payload }) => {
        // Update params immediately (no re-render, just ref update)
        console.log('[Conductor] Received bass params:', payload)
        if (payload.params) {
          bassParamsRef.current = payload.params
          bassEngineRef.current?.setParams(payload.params.x, payload.params.y)
        }
      })
      .subscribe((status) => {
        console.log('[Conductor] Bass channel status:', status)
      })

    newChannels.push(bassChannel)

    // Drums channel
    const drumsChannel = supabase.channel(channels.drums, {
      config: { broadcast: { self: false } }
    })

    drumsChannel
      .on('broadcast', { event: 'instr:update' }, ({ payload }) => {
        console.log('[Conductor] Received drums params:', payload)
        if (payload.params) {
          drumsParamsRef.current = payload.params
          const { x, y, fx } = payload.params
          drumsEngineRef.current?.setParams(
            x,
            y,
            fx?.stutter || false,
            fx?.filterAmount || 0
          )
        }
      })
      .subscribe((status) => {
        console.log('[Conductor] Drums channel status:', status)
      })

    newChannels.push(drumsChannel)

    channelsRef.current = newChannels

    return () => {
      newChannels.forEach(ch => ch.unsubscribe())
      channelsRef.current = []
    }
  }, [roomId])

  // Start audio (requires user interaction)
  const startAudio = useCallback(async () => {
    if (audioStarted) return

    await bassEngineRef.current?.start()
    await drumsEngineRef.current?.start()
    setAudioStarted(true)
  }, [audioStarted])

  // Scheduler callback - plays all instruments locally
  const handleSchedule = useCallback((time: number, stepIndex: number) => {
    if (!audioStarted) return

    // Get current chord from progression
    const chordPattern = ['I', 'IV', 'V', 'I']
    const barIndex = Math.floor(stepIndex / 16)
    const chordIndex = barIndex % 4
    const romanNumeral = chordPattern[chordIndex]

    // Schedule bass
    if (bassEngineRef.current) {
      bassEngineRef.current.scheduleNote(
        time,
        stepIndex,
        transport.keyRoot,
        transport.scaleMode,
        romanNumeral
      )
    }

    // Schedule drums
    if (drumsEngineRef.current) {
      drumsEngineRef.current.scheduleHit(time, stepIndex)
    }
  }, [audioStarted, transport.keyRoot, transport.scaleMode])

  // Attach scheduler
  useScheduler(transport, handleSchedule, audioStarted)

  return {
    audioStarted,
    startAudio,
    bassParams: bassParamsRef.current,
    drumsParams: drumsParamsRef.current,
  }
}
