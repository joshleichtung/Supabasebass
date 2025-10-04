import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createRoom as createRoomDB, joinRoom as joinRoomDB } from '../lib/room-manager'

export default function LandingView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roomId = searchParams.get('r')

  useEffect(() => {
    // If we have a room code, verify it exists
    if (roomId) {
      setLoading(true)
      joinRoomDB(roomId)
        .then((result) => {
          if (!result) {
            setError(`Room "${roomId}" not found`)
          }
        })
        .catch((err) => {
          setError('Failed to join room: ' + err.message)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [roomId])

  const createRoom = async () => {
    setLoading(true)
    setError(null)
    try {
      const { code } = await createRoomDB()
      navigate(`/?r=${code}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError('Failed to create room: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/?r=${roomCode.toUpperCase()}`)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fullscreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <h1 style={{ color: 'white', fontSize: '48px' }}>BassBase</h1>
        <div style={{ background: 'rgba(239, 68, 68, 0.9)', padding: '16px 24px', borderRadius: '8px', color: 'white' }}>
          {error}
        </div>
        <button
          onClick={() => {
            setError(null)
            navigate('/')
          }}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '8px',
            border: 'none',
            background: 'white',
            color: '#667eea',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (roomId) {
    return (
      <div className="fullscreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <h1 style={{ color: 'white', fontSize: '48px' }}>BassBase</h1>
        <p style={{ color: 'white', fontSize: '18px' }}>Room: {roomId}</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => navigate(`/bass?r=${roomId}`)}
            style={{
              padding: '20px 40px',
              fontSize: '18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🎸 Bass
          </button>
          <button
            onClick={() => navigate(`/drums?r=${roomId}`)}
            style={{
              padding: '20px 40px',
              fontSize: '18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🥁 Drums
          </button>
        </div>
        <button
          onClick={() => navigate(`/conductor?r=${roomId}`)}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '2px solid white',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          📺 Conductor View
        </button>
      </div>
    )
  }

  return (
    <div className="fullscreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
      <h1 style={{ color: 'white', fontSize: '72px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>BassBase</h1>
      <p style={{ color: 'white', fontSize: '20px', opacity: 0.9 }}>Multiplayer jam space</p>

      <button
        onClick={createRoom}
        style={{
          padding: '20px 60px',
          fontSize: '24px',
          borderRadius: '16px',
          border: 'none',
          background: 'white',
          color: '#667eea',
          cursor: 'pointer',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
      >
        Create New Room
      </button>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '2px solid white',
            background: 'rgba(255,255,255,0.9)',
            width: '200px'
          }}
        />
        <button
          onClick={joinRoom}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            border: 'none',
            background: 'white',
            color: '#667eea',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Join
        </button>
      </div>
    </div>
  )
}
