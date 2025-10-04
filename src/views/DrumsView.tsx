import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useInstrumentBroadcast } from '../hooks/useInstrumentBroadcast'
import XYPad from '../components/XYPad'
import { saveInstrumentParams, loadInstrumentParams } from '../lib/room-manager'

export default function DrumsView() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('r')

  const { isHost, userCount } = usePresence(roomId, 'drums')
  const { state: transport, togglePlay, isPlaying, bpm } = useTransport(roomId, isHost)
  const { broadcastParams } = useInstrumentBroadcast(roomId, 'drums')

  const [params, setParams] = useState({ x: 0.5, y: 0.5 })
  const [stutter, setStutter] = useState(false)
  const [filterAmount, setFilterAmount] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)

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

  // Handle XY pad movement - broadcast only
  const handleMove = useCallback((x: number, y: number) => {
    setParams({ x, y })

    // Broadcast to conductor
    broadcastParams({ x, y, fx: { stutter, filterAmount } })

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
  }, [roomId, stutter, filterAmount, broadcastParams])

  // Toggle stutter
  const toggleStutter = useCallback(() => {
    const newStutter = !stutter
    setStutter(newStutter)
    broadcastParams({ x: params.x, y: params.y, fx: { stutter: newStutter, filterAmount } })
  }, [stutter, params, filterAmount, broadcastParams])

  // Adjust filter
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value)
    setFilterAmount(newAmount)
    broadcastParams({ x: params.x, y: params.y, fx: { stutter, filterAmount: newAmount } })
  }, [params, stutter, broadcastParams])

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

      {/* XY Pad - No audio */}
      <XYPad onMove={handleMove} color="#f5576c">
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '120px',
          opacity: 0.3,
          pointerEvents: 'none',
        }}>
          🥁
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
        <div>🥁 Drums Control</div>
        <div style={{ fontSize: '16px', marginTop: '12px', opacity: 0.8 }}>
          Move cursor to control
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          X: Density • Y: Swing
        </div>
        <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.6 }}>
          (Audio plays on Conductor view only)
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
        <div>Swing: {(params.y * 100).toFixed(0)}%</div>
      </div>
    </div>
  )
}
