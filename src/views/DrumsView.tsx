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
  const { state: transport, togglePlay, isPlaying, bpm } = useTransport(roomId, isHost)
  const { broadcastParams } = useInstrumentBroadcast(roomId, 'drums')

  const [params, setParams] = useState({ x: 0.5, y: 0.5 })
  const [stutter, setStutter] = useState(false)
  const [filterAmount, setFilterAmount] = useState(0)
  const [audioStarted, setAudioStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const drumsEngineRef = useRef<DrumsEngine | null>(null)

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
        const { x, y, fx } = saved.params
        setParams({ x: x || 0.5, y: y || 0.5 })
        if (fx) {
          setStutter(fx.stutter || false)
          setFilterAmount(fx.filterAmount || 0)
        }
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

  // Handle XY pad movement - broadcast and update local engine params
  const handleMove = useCallback((x: number, y: number) => {
    setParams({ x, y })

    // Update local engine params for visualization
    drumsEngineRef.current?.setParams(x, y, stutter, filterAmount)

    // Broadcast to conductor
    broadcastParams({ x, y, fx: { stutter, filterAmount } })

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
        saveInstrumentParams(roomId, 'drums', {
          x,
          y,
          fx: { stutter, filterAmount }
        })
      }
    }, 3000)
  }, [roomId, stutter, filterAmount, broadcastParams, audioStarted, startAudio])

  // Toggle stutter
  const toggleStutter = useCallback(() => {
    const newStutter = !stutter
    setStutter(newStutter)
    drumsEngineRef.current?.setParams(params.x, params.y, newStutter, filterAmount)
    broadcastParams({ x: params.x, y: params.y, fx: { stutter: newStutter, filterAmount } })
  }, [stutter, params, filterAmount, broadcastParams])

  // Adjust filter
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value)
    setFilterAmount(newAmount)
    drumsEngineRef.current?.setParams(params.x, params.y, stutter, newAmount)
    broadcastParams({ x: params.x, y: params.y, fx: { stutter, filterAmount: newAmount } })
  }, [params, stutter, broadcastParams])

  // Scheduler callback - plays muted drums locally for visualization
  const handleSchedule = useCallback((time: number, stepIndex: number) => {
    setCurrentStep(stepIndex % 16) // Update visualization step
    drumsEngineRef.current?.scheduleHit(time, stepIndex)
  }, [])

  // Use scheduler (correct parameter order: transport, callback, enabled)
  useScheduler(transport, handleSchedule, audioStarted && isPlaying)

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
      {/* Transport Controls */}
      <div className="transport-controls">
        <button
          className="transport-button"
          onClick={(e) => {
            e.stopPropagation()
            if (isHost) togglePlay()
          }}
          disabled={!isHost}
          style={{ opacity: isHost ? 1 : 0.5 }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <div className="transport-info">
          <div>Tempo: {bpm} BPM</div>
          <div>Key: {transport.keyRoot} {transport.scaleMode}</div>
          {isHost && <div style={{ color: '#ffd700', fontWeight: '700' }}>⭐ HOST</div>}
        </div>
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
          <DrumsVisuals currentStep={currentStep} color="#f5576c" />
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

      {/* FX Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Stutter */}
        <button
          onClick={toggleStutter}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: stutter ? '#ffd700' : 'rgba(255,255,255,0.9)',
            color: stutter ? '#000' : '#333',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          ⚡ Stutter {stutter ? 'ON' : 'OFF'}
        </button>

        {/* Filter */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '700' }}>
            🎛️ Filter: {(filterAmount * 100).toFixed(0)}%
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={filterAmount}
            onChange={handleFilterChange}
            style={{
              width: '150px',
              cursor: 'pointer',
            }}
          />
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
