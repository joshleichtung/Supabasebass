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

  // Separate effect for BPM updates - doesn't restart the loop
  useEffect(() => {
    if (enabled && loopRef.current) {
      Tone.getTransport().bpm.value = transportState.bpm
    }
  }, [transportState.bpm, enabled])

  useEffect(() => {
    if (!enabled) {
      // Clean up loop immediately if it exists
      if (loopRef.current) {
        loopRef.current.stop()
        loopRef.current.dispose()
        loopRef.current = null
      }
      return
    }

    // Clean up existing loop before creating new one (immediate, synchronous)
    if (loopRef.current) {
      loopRef.current.stop()
      loopRef.current.dispose()
      loopRef.current = null
    }

    // Sync Tone.js transport with our BPM (initial)
    Tone.getTransport().bpm.value = transportState.bpm

    // Create loop for 16th notes
    let stepIndex = 0
    const loop = new Tone.Loop((time) => {
      try {
        callbackRef.current(time, stepIndex % 16)
        stepIndex++
      } catch (e) {
        // Silently ignore errors
      }
    }, '16n')

    loopRef.current = loop

    // Start loop immediately if playing
    if (transportState.isPlaying) {
      loop.start(0)
      // Only start transport if not already started
      if (Tone.getTransport().state !== 'started') {
        Tone.getTransport().start()
      }
    }

    return () => {
      // Immediate cleanup on unmount
      if (loop) {
        loop.stop()
        loop.dispose()
      }
      loopRef.current = null
    }
  }, [transportState.isPlaying, enabled])
}
