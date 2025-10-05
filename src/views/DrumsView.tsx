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
import { theme } from '../design/theme'
import DrumsIcon from '../components/icons/DrumsIcon'

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

  // Handle XY pad movement - broadcast only XY (FX controlled from stage)
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
    return <div className="loading" style={{ background: theme.colors.bg.primary, color: theme.colors.neon.pink }}>No room ID provided</div>
  }

  return (
    <div
      className="fullscreen"
      style={{
        background: theme.colors.bg.primary,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Vaporwave background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.colors.gradient.drums,
        opacity: 0.1,
        pointerEvents: 'none'
      }} />

      {/* Drum Hit Flash Indicators */}
      <div style={{
        position: 'absolute',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '24px',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        {/* Kick Flash */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: kickFlashRef.current
            ? `radial-gradient(circle, ${theme.colors.neon.pink} 0%, rgba(255,0,110,0.4) 50%, rgba(255,0,110,0) 100%)`
            : theme.colors.bg.tertiary,
          border: `3px solid ${theme.colors.neon.pink}`,
          transition: 'all 0.05s',
          transform: kickFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: kickFlashRef.current ? theme.shadows.glow.strong : theme.shadows.elevation.low,
        }} />
        {/* Snare Flash */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: snareFlashRef.current
            ? `radial-gradient(circle, ${theme.colors.neon.yellow} 0%, rgba(255,214,10,0.4) 50%, rgba(255,214,10,0) 100%)`
            : theme.colors.bg.tertiary,
          border: `3px solid ${theme.colors.neon.yellow}`,
          transition: 'all 0.05s',
          transform: snareFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: snareFlashRef.current ? `0 0 40px ${theme.colors.neon.yellow}` : theme.shadows.elevation.low,
        }} />
        {/* HiHat Flash */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: hatFlashRef.current
            ? `radial-gradient(circle, ${theme.colors.neon.cyan} 0%, rgba(6,255,165,0.4) 50%, rgba(6,255,165,0) 100%)`
            : theme.colors.bg.tertiary,
          border: `3px solid ${theme.colors.neon.cyan}`,
          transition: 'all 0.05s',
          transform: hatFlashRef.current ? 'scale(1.3)' : 'scale(1)',
          boxShadow: hatFlashRef.current ? theme.shadows.glow.cyan : theme.shadows.elevation.low,
        }} />
      </div>

      {/* Presence */}
      <div className="presence-list" style={{
        background: theme.colors.bg.overlay,
        border: `2px solid ${theme.colors.neon.pink}`,
        boxShadow: theme.shadows.glow.pink,
        backdropFilter: 'blur(10px)',
        color: theme.colors.neon.pink
      }}>
        <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DrumsIcon size={20} color={theme.colors.neon.pink} />
          Online: {userCount}
        </div>
        <div className="presence-item" style={{ color: theme.colors.neon.magenta }}>
          Drums (You)
        </div>
      </div>

      {/* XY Pad with drum arc visualization */}
      <XYPad onMove={handleMove} color={theme.colors.neon.pink}>
        {audioStarted && (
          <DrumsVisuals currentStep={currentStepRef.current} color={theme.colors.neon.pink} />
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
        fontWeight: '700',
        textShadow: theme.shadows.glow.pink,
        pointerEvents: 'none',
      }}>
        <DrumsIcon size={64} color={theme.colors.neon.magenta} />
        <div style={{ marginTop: '16px', color: theme.colors.neon.magenta }}>Drums Control</div>
        <div style={{ fontSize: '16px', marginTop: '12px', opacity: 0.8, color: theme.colors.neon.cyan }}>
          Move cursor to control
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7, color: 'white' }}>
          X: Density • Y: Groove
        </div>
        <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.6, color: theme.colors.neon.yellow }}>
          {!audioStarted && '(Move cursor to start visualization)'}
          {audioStarted && '(Muted - Audio plays on Stage only)'}
        </div>
      </div>

      {/* Param Display */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: theme.colors.bg.overlay,
        padding: '16px 28px',
        borderRadius: '12px',
        color: theme.colors.neon.magenta,
        fontSize: '16px',
        display: 'flex',
        gap: '32px',
        border: `2px solid ${theme.colors.neon.pink}`,
        boxShadow: theme.shadows.glow.pink,
        backdropFilter: 'blur(10px)',
        fontWeight: '700',
        fontFamily: theme.typography.fontMono
      }}>
        <div>Density: {(params.x * 100).toFixed(0)}%</div>
        <div>Groove: {(params.y * 100).toFixed(0)}%</div>
      </div>
    </div>
  )
}
