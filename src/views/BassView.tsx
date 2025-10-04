import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as Tone from 'tone'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useInstrumentBroadcast } from '../hooks/useInstrumentBroadcast'
import { useResolvedRoomId } from '../hooks/useResolvedRoomId'
import { useScheduler } from '../hooks/useScheduler'
import { BassEngine } from '../instruments/bass/BassEngine'
import BassVisuals from '../instruments/bass/BassVisuals'
import XYPad from '../components/XYPad'
import { saveInstrumentParams, loadInstrumentParams } from '../lib/room-manager'

export default function BassView() {
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('r')
  const roomId = useResolvedRoomId(roomCode) // Resolve short code to UUID

  const { isHost, userCount } = usePresence(roomId, 'bass')
  const { state: transport } = useTransport(roomId, isHost)
  const { broadcastParams } = useInstrumentBroadcast(roomId, 'bass')

  const [params, setParams] = useState({ x: 0.5, y: 0.5 })
  const [audioStarted, setAudioStarted] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)
  const bassEngineRef = useRef<BassEngine | null>(null)
  const lastBroadcastParamsRef = useRef({ x: 0.5, y: 0.5 })

  // Initialize muted bass engine for visualization
  useEffect(() => {
    if (!bassEngineRef.current) {
      bassEngineRef.current = new BassEngine(true) // muted=true for visualization only
    }

    return () => {
      if (bassEngineRef.current) {
        bassEngineRef.current.dispose()
        bassEngineRef.current = null
      }
    }
  }, [])

  // Load saved params
  useEffect(() => {
    if (!roomId) return

    loadInstrumentParams(roomId, 'bass').then((saved) => {
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
      await bassEngineRef.current?.start()
      setAudioStarted(true)
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

    // Debounced save (every 3s)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (roomId) {
        saveInstrumentParams(roomId, 'bass', { x, y })
      }
    }, 3000)
  }, [roomId, broadcastParams, audioStarted, startAudio])

  // Scheduler callback - plays muted bass locally for visualization
  const handleSchedule = useCallback((time: number, stepIndex: number) => {
    bassEngineRef.current?.scheduleNote(
      time,
      stepIndex,
      transport.keyRoot,
      transport.scaleMode,
      'I' // Default to root for now
    )
  }, [transport.keyRoot, transport.scaleMode])

  // Use scheduler (correct parameter order: transport, callback, enabled)
  // Run independently of global isPlaying for local visualization
  useScheduler(transport, handleSchedule, audioStarted)

  if (!roomId) {
    return <div className="loading">No room ID provided</div>
  }

  return (
    <div
      className="fullscreen"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)',
        position: 'relative',
      }}
    >
      {/* Presence */}
      <div className="presence-list">
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>
          Online: {userCount}
        </div>
        <div className="presence-item">
          🎸 Bass (You)
        </div>
      </div>

      {/* XY Pad with bass waveform visualization */}
      <XYPad onMove={handleMove} color="#6366f1">
        {audioStarted && bassEngineRef.current && (
          <BassVisuals synth={bassEngineRef.current.getSynth()} color="#6366f1" />
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
        <div>🎸 Bass Control</div>
        <div style={{ fontSize: '16px', marginTop: '12px', opacity: 0.8 }}>
          Move cursor to control
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          X: Density • Y: Complexity
        </div>
        <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.6, maxWidth: '400px' }}>
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
        <div>Complexity: {(params.y * 100).toFixed(0)}%</div>
      </div>
    </div>
  )
}
