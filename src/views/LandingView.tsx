import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createRoom as createRoomDB, joinRoom as joinRoomDB } from '../lib/room-manager'
import { theme } from '../design/theme'
import BassIcon from '../components/icons/BassIcon'
import DrumsIcon from '../components/icons/DrumsIcon'
import ConductorIcon from '../components/icons/ConductorIcon'
import MusicIcon from '../components/icons/MusicIcon'

export default function LandingView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const roomId = searchParams.get('r')

  useEffect(() => {
    // If we have a room code, verify it exists
    if (roomId) {
      setLoading(true)
      joinRoomDB(roomId)
        .then((result) => {
          if (!result) {
            setError(`Room "${roomId}" not found`)
            setShareCode(null)
          } else {
            // Store the short code for sharing
            setShareCode(result.room.name)
          }
        })
        .catch((err) => {
          setError('Failed to join room: ' + err.message)
          setShareCode(null)
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
      const { room, code } = await createRoomDB()
      console.log(`Created room ${room.id} with code ${code}`)
      setShareCode(code)
      // Navigate with short code for simplicity
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
      <div className="loading" style={{ background: theme.colors.bg.primary }}>
        <div style={{
          color: theme.colors.neon.cyan,
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MusicIcon size={32} color={theme.colors.neon.cyan} />
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fullscreen" style={{
        background: theme.colors.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px'
      }}>
        <h1 style={{
          color: theme.colors.neon.cyan,
          fontSize: '56px',
          fontWeight: '800',
          textShadow: theme.shadows.glow.cyan,
          letterSpacing: '2px'
        }}>
          JamSync
        </h1>
        <div style={{
          background: theme.colors.bg.overlay,
          padding: '20px 32px',
          borderRadius: '12px',
          color: theme.colors.neon.pink,
          border: `2px solid ${theme.colors.neon.pink}`,
          boxShadow: theme.shadows.glow.pink,
          backdropFilter: 'blur(10px)'
        }}>
          {error}
        </div>
        <button
          onClick={() => {
            setError(null)
            navigate('/')
          }}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            borderRadius: '12px',
            border: `2px solid ${theme.colors.neon.cyan}`,
            background: 'transparent',
            color: theme.colors.neon.cyan,
            cursor: 'pointer',
            fontWeight: '700',
            transition: 'all 0.3s',
            textShadow: theme.shadows.glow.cyan,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.neon.cyan
            e.currentTarget.style.color = theme.colors.bg.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow.cyan
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = theme.colors.neon.cyan
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Back to Home
        </button>
      </div>
    )
  }

  const copyRoomCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (roomId && shareCode) {
    return (
      <div className="fullscreen" style={{
        background: theme.colors.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px'
      }}>
        <h1 style={{
          color: theme.colors.neon.cyan,
          fontSize: '56px',
          fontWeight: '800',
          textShadow: theme.shadows.glow.cyan,
          letterSpacing: '2px',
          marginBottom: '20px'
        }}>
          JamSync
        </h1>

        {/* Room Code Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: theme.colors.bg.overlay,
          padding: '20px 32px',
          borderRadius: '16px',
          border: `2px solid ${theme.colors.neon.purple}`,
          boxShadow: theme.shadows.glow.purple,
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{
            color: theme.colors.neon.yellow,
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '4px',
            userSelect: 'all',
            fontFamily: theme.typography.fontMono,
            textShadow: `0 0 10px ${theme.colors.neon.yellow}`
          }}>
            {shareCode}
          </span>
          <button
            onClick={copyRoomCode}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '8px',
              border: `2px solid ${copied ? theme.colors.state.success : theme.colors.neon.cyan}`,
              background: 'transparent',
              color: copied ? theme.colors.state.success : theme.colors.neon.cyan,
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Instrument Selection */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(`/bass?r=${roomId}`)}
            style={{
              padding: '24px 40px',
              fontSize: '18px',
              borderRadius: '16px',
              border: `3px solid ${theme.colors.neon.blue}`,
              background: theme.colors.gradient.bass,
              color: 'white',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              minWidth: '180px',
              transition: 'all 0.3s',
              boxShadow: theme.shadows.elevation.mid
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = theme.shadows.elevation.high
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = theme.shadows.elevation.mid
            }}
          >
            <BassIcon size={48} color="white" />
            <span>Bass</span>
          </button>
          <button
            onClick={() => navigate(`/drums?r=${roomId}`)}
            style={{
              padding: '24px 40px',
              fontSize: '18px',
              borderRadius: '16px',
              border: `3px solid ${theme.colors.neon.pink}`,
              background: theme.colors.gradient.drums,
              color: 'white',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              minWidth: '180px',
              transition: 'all 0.3s',
              boxShadow: theme.shadows.elevation.mid
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = theme.shadows.elevation.high
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = theme.shadows.elevation.mid
            }}
          >
            <DrumsIcon size={48} color="white" />
            <span>Drums</span>
          </button>
        </div>

        {/* Conductor Button */}
        <button
          onClick={() => navigate(`/conductor?r=${roomId}`)}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            borderRadius: '12px',
            border: `2px solid ${theme.colors.neon.cyan}`,
            background: 'transparent',
            color: theme.colors.neon.cyan,
            cursor: 'pointer',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.neon.cyan
            e.currentTarget.style.color = theme.colors.bg.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow.cyan
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = theme.colors.neon.cyan
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <ConductorIcon size={24} color="currentColor" />
          Conductor View
        </button>
      </div>
    )
  }

  return (
    <div className="fullscreen" style={{
      background: theme.colors.bg.primary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '48px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background gradient circles */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: theme.colors.gradient.bass,
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.15,
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: theme.colors.gradient.drums,
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.15,
        animation: 'float 15s ease-in-out infinite reverse'
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <MusicIcon size={80} color={theme.colors.neon.cyan} />
        <h1 style={{
          color: theme.colors.neon.cyan,
          fontSize: '80px',
          fontWeight: '900',
          textShadow: theme.shadows.glow.cyan,
          letterSpacing: '4px',
          marginTop: '20px',
          marginBottom: '12px'
        }}>
          JamSync
        </h1>
        <p style={{
          color: theme.colors.neon.magenta,
          fontSize: '24px',
          fontWeight: '600',
          opacity: 0.9,
          letterSpacing: '1px'
        }}>
          Multiplayer jam space
        </p>
      </div>

      <button
        onClick={createRoom}
        style={{
          padding: '24px 64px',
          fontSize: '28px',
          borderRadius: '16px',
          border: `3px solid ${theme.colors.neon.cyan}`,
          background: theme.colors.gradient.primary,
          color: 'white',
          cursor: 'pointer',
          fontWeight: '800',
          boxShadow: theme.shadows.elevation.high,
          transition: 'all 0.3s',
          position: 'relative',
          zIndex: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = theme.shadows.glow.strong
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = theme.shadows.elevation.high
        }}
      >
        Create New Room
      </button>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <input
          type="text"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          style={{
            padding: '16px 24px',
            fontSize: '18px',
            borderRadius: '12px',
            border: `2px solid ${theme.colors.neon.purple}`,
            background: theme.colors.bg.overlay,
            color: theme.colors.neon.cyan,
            width: '240px',
            fontWeight: '700',
            fontFamily: theme.typography.fontMono,
            letterSpacing: '2px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}
        />
        <button
          onClick={joinRoom}
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            borderRadius: '12px',
            border: `2px solid ${theme.colors.neon.magenta}`,
            background: 'transparent',
            color: theme.colors.neon.magenta,
            cursor: 'pointer',
            fontWeight: '700',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.neon.magenta
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.boxShadow = theme.shadows.glow.pink
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = theme.colors.neon.magenta
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Join
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, -50px); }
        }
      `}</style>
    </div>
  )
}
