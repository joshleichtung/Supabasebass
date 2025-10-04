import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as Tone from 'tone'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useInstrumentBroadcast } from '../hooks/useInstrumentBroadcast'
import { useResolvedRoomId } from '../hooks/useResolvedRoomId'
import { useScheduler } from '../hooks/useScheduler'
import { DrumsEngine } from '../instruments/drums/DrumsEngine'
import DrumsVisuals from '../instruments/drums/DrumsVisuals'
import XYPad from '../components/XYPad'
import { saveInstrumentParams, loadInstrumentParams } from '../lib/room-manager'

export default function DrumsView() {
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('r')
  const roomId = useResolvedRoomId(roomCode) // Resolve short code to UUID

  const { isHost, userCount } = usePresence(roomId, 'drums')
  const { state: transport } = useTransport(roomId, isHost)
  const { broadcastParams } = useInstrumentBroadcast(roomId, 'drums')

  const [params, setParams] = useState({ x: 0.5, y: 0.5 })
  const [audioStarted, setAudioStarted] = useState(false)

  // Use refs instead of state for visual feedback (decouples from React render cycle)
  const currentStepRef = useRef(0)
  const kickFlashRef = useRef(false)
  const snareFlashRef = useRef(false)
  const hatFlashRef = useRef(false)

  // Force update state for visuals (only updates when ref changes)
  const [, forceUpdate] = useState({})
  const rafRef = useRef<number | null>(null)

  const saveTimeoutRef = useRef<number | null>(null)
  const drumsEngineRef = useRef<DrumsEngine | null>(null)
  const lastBroadcastParamsRef = useRef({ x: 0.5, y: 0.5 })

  // Flash timeout refs for cleanup
  const kickTimeoutRef = useRef<number | null>(null)
  const snareTimeoutRef = useRef<number | null>(null)
  const hatTimeoutRef = useRef<number | null>(null)

  // Initialize muted drums engine for visualization
  useEffect(() => {
    if (!drumsEngineRef.current) {
      drumsEngineRef.current = new DrumsEngine(true) // muted=true for visualization only
    }

    return () => {
      if (drumsEngineRef.current) {
        drumsEngineRef.current.dispose()
        drumsEngineRef.current = null
      }
    }
  }, [])

  // Load saved params
  useEffect(() => {
    if (!roomId) return

    loadInstrumentParams(roomId, 'drums').then((saved) => {
      if (saved && saved.params) {
        const { x, y } = saved.params
        setParams({ x: x || 0.5, y: y || 0.5 })
      }
    })
  }, [roomId])

  // Start audio context (required for visualization)
  const startAudio = useCallback(async () => {
    if (!audioStarted) {
      await Tone.start()
      await drumsEngineRef.current?.start()
      setAudioStarted(true)
    }
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

  // Handle XY pad movement - broadcast only XY (FX controlled from conductor)
  const handleMove = useCallback((x: number, y: number) => {
    // Always update local state for smooth feedback
    setParams({ x, y })

    // Only broadcast if position changed meaningfully (prevents flood)
    const prev = lastBroadcastParamsRef.current
    const threshold = 0.005 // 0.5% minimum change

    if (Math.abs(x - prev.x) >= threshold || Math.abs(y - prev.y) >= threshold) {
      broadcastParams({ x, y })
      lastBroadcastParamsRef.current = { x, y }
    }

    // Start audio on first interaction (for visualization)
    if (!audioStarted) {
      startAudio()
    }

    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (roomId) {
        saveInstrumentParams(roomId, 'drums', { x, y })
      }
    }, 3000)
  }, [roomId, broadcastParams, audioStarted, startAudio])

  // Scheduler callback - plays muted drums locally for visualization (uses refs, not state)
  const handleSchedule = useCallback((time: number, stepIndex: number) => {
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

    drumsEngineRef.current?.scheduleHit(time, stepIndex)
  }, [])

  // Use scheduler (correct parameter order: transport, callback, enabled)
  // Run independently of global isPlaying for local visualization
  useScheduler(transport, handleSchedule, audioStarted)

  // Cleanup flash timeouts on unmount
  useEffect(() => {
    return () => {
      if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current)
      if (snareTimeoutRef.current) clearTimeout(snareTimeoutRef.current)
      if (hatTimeoutRef.current) clearTimeout(hatTimeoutRef.current)
    }
  }, [])

  if (!roomId) {
    return <div className="loading">No room ID provided</div>
  }

  return (
    <div
      className="fullscreen"
      style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        position: 'relative',
      }}
    >
      {/* Drum Hit Flash Indicators */}
      <div style={{
        position: 'absolute',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        {/* Kick Flash */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: kickFlashRef.current
            ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255,255,255,0.3)',
          transition: 'all 0.05s',
          transform: kickFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: kickFlashRef.current ? '0 0 40px rgba(255,255,255,1)' : 'none',
        }} />
        {/* Snare Flash */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: snareFlashRef.current
            ? 'radial-gradient(circle, rgba(255,215,0,0.9) 0%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0) 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255,255,255,0.3)',
          transition: 'all 0.05s',
          transform: snareFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: snareFlashRef.current ? '0 0 40px rgba(255,215,0,1)' : 'none',
        }} />
        {/* HiHat Flash */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: hatFlashRef.current
            ? 'radial-gradient(circle, rgba(147,197,253,0.9) 0%, rgba(147,197,253,0.4) 50%, rgba(147,197,253,0) 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255,255,255,0.3)',
          transition: 'all 0.05s',
          transform: hatFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: hatFlashRef.current ? '0 0 40px rgba(147,197,253,1)' : 'none',
        }} />
      </div>

      {/* Presence */}
      <div className="presence-list">
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>
          Online: {userCount}
        </div>
        <div className="presence-item">
          🥁 Drums (You)
        </div>
      </div>

      {/* XY Pad with drum arc visualization */}
      <XYPad onMove={handleMove} color="#f5576c">
        {audioStarted && (
          <DrumsVisuals currentStep={currentStepRef.current} color="#f5576c" />
        )}
      </XYPad>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: '600',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}>
        <div>🥁 Drums Control</div>
        <div style={{ fontSize: '16px', marginTop: '12px', opacity: 0.8 }}>
          Move cursor to control
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          X: Density • Y: Groove
        </div>
        <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.6 }}>
          {!audioStarted && '(Move cursor to start visualization)'}
          {audioStarted && '(Muted - Audio plays on Conductor only)'}
        </div>
      </div>

      {/* Param Display */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        display: 'flex',
        gap: '20px',
      }}>
        <div>Density: {(params.x * 100).toFixed(0)}%</div>
        <div>Groove: {(params.y * 100).toFixed(0)}%</div>
      </div>
    </div>
  )
}
