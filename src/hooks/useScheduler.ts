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
  const isTransitioningRef = useRef(false)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Prevent rapid re-creation during transitions
    if (isTransitioningRef.current) return

    if (!enabled) {
      // Clean up loop if it exists
      if (loopRef.current) {
        isTransitioningRef.current = true
        const currentLoop = loopRef.current

        // Stop loop immediately
        currentLoop.stop()

        // Small delay before disposal to ensure clean stop
        setTimeout(() => {
          currentLoop.dispose()
          isTransitioningRef.current = false
        }, 50)

        loopRef.current = null
      }
      return
    }

    // Clean up existing loop before creating new one
    if (loopRef.current) {
      isTransitioningRef.current = true
      const oldLoop = loopRef.current
      oldLoop.stop()

      // Wait for clean stop before creating new loop
      setTimeout(() => {
        oldLoop.dispose()
        isTransitioningRef.current = false
      }, 50)

      loopRef.current = null
      return
    }

    // Sync Tone.js transport with our BPM
    Tone.getTransport().bpm.value = transportState.bpm

    // Create loop for 16th notes with safeguards
    let stepIndex = 0
    const loop = new Tone.Loop((time) => {
      // Skip callback if transitioning
      if (!isTransitioningRef.current && loopRef.current) {
        try {
          callbackRef.current(time, stepIndex % 16)
          stepIndex++
        } catch (e) {
          console.debug('Scheduler callback error (transitioning):', e)
        }
      }
    }, '16n')

    loopRef.current = loop

    // Only start/stop loop based on isPlaying
    if (transportState.isPlaying) {
      // Small delay to ensure clean start
      setTimeout(() => {
        if (loopRef.current === loop) {
          loop.start(0)
          // Only start transport if not already started
          if (Tone.getTransport().state !== 'started') {
            Tone.getTransport().start()
          }
        }
      }, 10)
    }

    return () => {
      if (loop) {
        isTransitioningRef.current = true
        loop.stop()

        // Delay disposal to ensure clean shutdown
        setTimeout(() => {
          loop.dispose()
          isTransitioningRef.current = false
        }, 50)
      }
      loopRef.current = null
    }
  }, [transportState.bpm, transportState.isPlaying, enabled])
}
