import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

/**
 * Periodic cleanup hook to prevent long-session memory buildup
 * Clears Tone.Transport scheduled events every N minutes
 */
export function usePeriodicCleanup(enabled: boolean, intervalMinutes = 10) {
  const intervalIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    // Run cleanup every N minutes
    intervalIdRef.current = window.setInterval(() => {
      // Cancel all scheduled Transport events
      // This doesn't affect Tone.Loop instances, only timeline events
      Tone.Transport.cancel()
    }, intervalMinutes * 60 * 1000)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [enabled, intervalMinutes])
}
