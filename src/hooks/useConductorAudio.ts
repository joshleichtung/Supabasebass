import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { channelNames } from '../realtime/channels'
import { BassEngine } from '../instruments/bass/BassEngine'
import { DrumsEngine } from '../instruments/drums/DrumsEngine'
import { useScheduler } from './useScheduler'
import { usePeriodicCleanup } from './usePeriodicCleanup'
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

  // Use refs instead of state for visual feedback (decouples from React render cycle)
  const currentStepRef = useRef(0)
  const kickFlashRef = useRef(false)
  const snareFlashRef = useRef(false)
  const hatFlashRef = useRef(false)

  // Force update state for visuals (only updates when ref changes)
  const [, forceUpdate] = useState({})
  const rafRef = useRef<number | null>(null)

  // Flash timeout refs for cleanup
  const kickTimeoutRef = useRef<number | null>(null)
  const snareTimeoutRef = useRef<number | null>(null)
  const hatTimeoutRef = useRef<number | null>(null)

  // Audio engines
  const bassEngineRef = useRef<BassEngine | null>(null)
  const drumsEngineRef = useRef<DrumsEngine | null>(null)

  // Latest params from instruments (updated via realtime) - use state for reactivity
  const [bassParams, setBassParams] = useState<InstrumentParams>({ x: 0.5, y: 0.5 })
  const [drumsParams, setDrumsParams] = useState<InstrumentParams>({ x: 0.5, y: 0.5, fx: {} })

  // FX state (controlled locally on conductor)
  const [bassFX, setBassFX] = useState({ autoWah: false, filterAmount: 0, delayAmount: 0 })
  const [drumsFX, setDrumsFX] = useState({ stutter: false, filterAmount: 0, delayAmount: 0 })

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
        if (payload.params) {
          setBassParams(payload.params)
        }
      })
      .subscribe()

    newChannels.push(bassChannel)

    // Drums channel
    const drumsChannel = supabase.channel(channels.drums, {
      config: { broadcast: { self: false } }
    })

    drumsChannel
      .on('broadcast', { event: 'instr:update' }, ({ payload }) => {
        if (payload.params) {
          setDrumsParams(payload.params)
        }
      })
      .subscribe()

    newChannels.push(drumsChannel)

    channelsRef.current = newChannels

    return () => {
      newChannels.forEach(ch => ch.unsubscribe())
      channelsRef.current = []
    }
  }, [roomId])

  // Apply bass params and FX to engine
  useEffect(() => {
    if (bassEngineRef.current) {
      bassEngineRef.current.setParams(bassParams.x, bassParams.y, bassFX)
    }
  }, [bassParams, bassFX])

  // Apply drums params and FX to engine
  useEffect(() => {
    if (drumsEngineRef.current) {
      drumsEngineRef.current.setParams(
        drumsParams.x,
        drumsParams.y,
        drumsFX.stutter,
        drumsFX.filterAmount,
        drumsFX.delayAmount
      )
    }
  }, [drumsParams, drumsFX])

  // Start audio (requires user interaction)
  const startAudio = useCallback(async () => {
    if (audioStarted) return

    await bassEngineRef.current?.start()
    await drumsEngineRef.current?.start()
    setAudioStarted(true)
  }, [audioStarted])

  // RAF loop for visual updates (decoupled from audio)
  useEffect(() => {
    if (!audioStarted) return

    const updateVisuals = () => {
      forceUpdate({})
      rafRef.current = requestAnimationFrame(updateVisuals)
    }

    rafRef.current = requestAnimationFrame(updateVisuals)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [audioStarted])

  // Scheduler callback - plays all instruments locally (uses refs, not state)
  const handleSchedule = useCallback((time: number, stepIndex: number) => {
    if (!audioStarted) return

    // Update current step ref (no React render)
    const step = stepIndex % 16
    currentStepRef.current = step

    // Trigger drum hit flashes using refs (no React render)
    if (step === 0 || step === 8) {
      kickFlashRef.current = true
      if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current)
      kickTimeoutRef.current = window.setTimeout(() => {
        kickFlashRef.current = false
      }, 100)
    }
    if (step === 4 || step === 12) {
      snareFlashRef.current = true
      if (snareTimeoutRef.current) clearTimeout(snareTimeoutRef.current)
      snareTimeoutRef.current = window.setTimeout(() => {
        snareFlashRef.current = false
      }, 100)
    }
    if (step % 2 === 0) {
      hatFlashRef.current = true
      if (hatTimeoutRef.current) clearTimeout(hatTimeoutRef.current)
      hatTimeoutRef.current = window.setTimeout(() => {
        hatFlashRef.current = false
      }, 80)
    }

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

  // Periodic cleanup to prevent long-session memory buildup
  usePeriodicCleanup(audioStarted, 10)

  // Cleanup flash timeouts on unmount
  useEffect(() => {
    return () => {
      if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current)
      if (snareTimeoutRef.current) clearTimeout(snareTimeoutRef.current)
      if (hatTimeoutRef.current) clearTimeout(hatTimeoutRef.current)
    }
  }, [])

  return {
    audioStarted,
    startAudio,
    bassParams,
    drumsParams,
    currentStep: currentStepRef.current,
    bassEngine: bassEngineRef.current,
    drumsEngine: drumsEngineRef.current,
    kickFlash: kickFlashRef.current,
    snareFlash: snareFlashRef.current,
    hatFlash: hatFlashRef.current,
    bassFX,
    setBassFX,
    drumsFX,
    setDrumsFX,
  }
}
