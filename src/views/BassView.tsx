import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useInstrumentBroadcast } from '../hooks/useInstrumentBroadcast'
import XYPad from '../components/XYPad'
import { saveInstrumentParams, loadInstrumentParams } from '../lib/room-manager'

export default function BassView() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('r')

  const { isHost, userCount } = usePresence(roomId, 'bass')
  const { state: transport, togglePlay, isPlaying, bpm } = useTransport(roomId, isHost)
  const { broadcastParams } = useInstrumentBroadcast(roomId, 'bass')

  const [params, setParams] = useState({ x: 0.5, y: 0.5 })
  const saveTimeoutRef = useRef<number | null>(null)

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

  // Handle XY pad movement - broadcast only, no audio
  const handleMove = useCallback((x: number, y: number) => {
    setParams({ x, y })

    // Broadcast to conductor immediately
    broadcastParams({ x, y })

    // Debounced save (every 3s)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (roomId) {
        saveInstrumentParams(roomId, 'bass', { x, y })
      }
    }, 3000)
  }, [roomId, broadcastParams])

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
          🎸 Bass (You)
        </div>
      </div>

      {/* XY Pad - No audio, just params */}
      <XYPad onMove={handleMove} color="#6366f1">
        {/* Simple waveform visualization (no audio) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '120px',
          opacity: 0.3,
          pointerEvents: 'none',
        }}>
          🎸
        </div>
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
          (Audio plays on Conductor view only)
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
