import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import type { TransportState } from '../lib/transport'

interface SchedulerCallback {
  (time: number, stepIndex: number): void
}

/**
 * Web Audio scheduler hook
 * Schedules callbacks on 16th note boundaries
 */
export function useScheduler(
  transportState: TransportState,
  callback: SchedulerCallback,
  enabled: boolean
) {
  const loopRef = useRef<Tone.Loop | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      // Clean up loop if it exists
      if (loopRef.current) {
        loopRef.current.stop()
        loopRef.current.dispose()
        loopRef.current = null
      }
      return
    }

    // Sync Tone.js transport with our BPM
    Tone.getTransport().bpm.value = transportState.bpm

    // Create loop for 16th notes
    let stepIndex = 0
    const loop = new Tone.Loop((time) => {
      callbackRef.current(time, stepIndex % 16)
      stepIndex++
    }, '16n')

    loopRef.current = loop

    // Only start/stop loop based on isPlaying, don't touch Transport
    if (transportState.isPlaying) {
      loop.start(0)
      // Only start transport if not already started
      if (Tone.getTransport().state !== 'started') {
        Tone.getTransport().start()
      }
    }

    return () => {
      if (loop) {
        loop.stop()
        loop.dispose()
      }
      // Don't stop transport in cleanup - let other instances continue
      loopRef.current = null
    }
  }, [transportState.bpm, transportState.isPlaying, enabled])
}
