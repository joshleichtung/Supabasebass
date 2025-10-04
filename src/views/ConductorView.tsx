import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useConductorAudio } from '../hooks/useConductorAudio'
import { useResolvedRoomId } from '../hooks/useResolvedRoomId'
import BassVisuals from '../instruments/bass/BassVisuals'
import DrumsVisuals from '../instruments/drums/DrumsVisuals'
import type { PresenceState } from '../types/presence'

export default function ConductorView() {
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('r')
  const roomId = useResolvedRoomId(roomCode) // Resolve short code to UUID

  const { users, isHost } = usePresence(roomId, 'conductor')
  const { state: transport, bpm, barIndex, isPlaying } = useTransport(roomId, isHost)
  const {
    audioStarted,
    startAudio,
    bassParams,
    drumsParams,
    currentStep,
    bassEngine,
    drumsEngine,
    kickFlash,
    snareFlash,
    hatFlash,
  } = useConductorAudio(roomId, transport)

  const [soloedInstrument, setSoloedInstrument] = useState<string | null>(null)
  const [soloTimeout, setSoloTimeout] = useState<number | null>(null)

  // Get users by instrument - useMemo to prevent recalculation
  const usersByInstrument = useMemo(() => {
    const result: Record<string, PresenceState[]> = {
      bass: [],
      drums: [],
      harmony: [],
      melody: [],
    }

    Object.values(users).forEach(user => {
      if (user.instrument && user.instrument !== 'conductor') {
        if (!result[user.instrument]) {
          result[user.instrument] = []
        }
        result[user.instrument].push(user)
      }
    })

    return result
  }, [users])

  // Debug logging
  useEffect(() => {
    console.log('ConductorView - Total users:', Object.keys(users).length)
    console.log('ConductorView - Users:', users)
    console.log('ConductorView - By Instrument:', {
      bass: usersByInstrument.bass.length,
      drums: usersByInstrument.drums.length,
      harmony: usersByInstrument.harmony.length,
      melody: usersByInstrument.melody.length,
    })
  }, [users, usersByInstrument])

  // Handle solo tap
  const handleSolo = (instrument: string) => {
    if (soloTimeout) {
      clearTimeout(soloTimeout)
    }

    setSoloedInstrument(instrument)

    // Clear solo after 10 seconds
    const timeout = window.setTimeout(() => {
      setSoloedInstrument(null)
    }, 10000)

    setSoloTimeout(timeout)
  }

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (soloTimeout) {
        clearTimeout(soloTimeout)
      }
    }
  }, [soloTimeout])

  if (!roomId) {
    return <div className="loading">No room ID provided</div>
  }

  const playheadProgress = ((barIndex % 4) / 4) * 100 // 4-bar loop

  return (
    <div
      className="fullscreen"
      style={{
        background: '#0a0a0a',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        position: 'relative',
      }}
    >
      {/* Audio Start Overlay */}
      {!audioStarted && (
        <div
          onClick={startAudio}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            cursor: 'pointer',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            fontSize: '120px',
            animation: 'pulse 2s infinite',
          }}>
            🎵
          </div>
          <div style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: '700',
            textAlign: 'center',
          }}>
            Tap to Start Audio
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '20px',
            textAlign: 'center',
            maxWidth: '600px',
          }}>
            {isPlaying ? 'Music is playing! Click anywhere to hear it.' : 'Start playback to enable audio'}
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '48px',
          fontWeight: '700',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          📺 JamSync Conductor
        </h1>

        {/* Transport Info */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 40px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            {bpm} BPM
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '16px',
          }}>
            {transport.keyRoot} {transport.scaleMode}
          </div>
        </div>
      </div>

      {/* Loop Progress */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Bar indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                background: (barIndex % 4) + 1 === bar
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }}
            >
              Bar {bar}
            </div>
          ))}
        </div>

        {/* 16-step progress */}
        <div style={{
          width: '100%',
          height: '12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                background: i === currentStep
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : i < currentStep
                  ? 'rgba(102, 126, 234, 0.3)'
                  : 'transparent',
                borderRight: i < 15 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                transition: 'background 0.05s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Instrument Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '30px',
      }}>
        {/* Bass */}
        <div
          onClick={() => handleSolo('bass')}
          style={{
            background: soloedInstrument === 'bass'
              ? 'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)'
              : 'rgba(99, 102, 241, 0.15)',
            borderRadius: '24px',
            padding: '40px',
            cursor: 'pointer',
            border: soloedInstrument === 'bass' ? '4px solid #ffd700' : '2px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Visualization Layer */}
          {audioStarted && bassEngine && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              opacity: 0.6,
            }}>
              <BassVisuals synth={bassEngine.getSynth()} color="#6366f1" />
            </div>
          )}

          {/* Content Layer */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
            }}>
              🎸
            </div>
            <div style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: '700',
              textAlign: 'center',
            }}>
              Bass
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              textAlign: 'center',
            }}>
              {usersByInstrument.bass.length > 0
                ? `${usersByInstrument.bass.length} player${usersByInstrument.bass.length > 1 ? 's' : ''}`
                : 'Waiting...'}
            </div>

            {/* Cursor Position Indicator */}
            {usersByInstrument.bass.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
              }}>
                <div>Density: {(bassParams.x * 100).toFixed(0)}%</div>
                <div>Complexity: {(bassParams.y * 100).toFixed(0)}%</div>
              </div>
            )}

            {soloedInstrument === 'bass' && (
              <div style={{
                color: '#ffd700',
                fontSize: '20px',
                fontWeight: '700',
                textAlign: 'center',
                animation: 'pulse 2s infinite',
              }}>
                ⭐ SOLO
              </div>
            )}
          </div>
        </div>

        {/* Drums */}
        <div
          onClick={() => handleSolo('drums')}
          style={{
            background: soloedInstrument === 'drums'
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'rgba(245, 87, 108, 0.15)',
            borderRadius: '24px',
            padding: '40px',
            cursor: 'pointer',
            border: soloedInstrument === 'drums' ? '4px solid #ffd700' : '2px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Visualization Layer */}
          {audioStarted && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              opacity: 0.6,
            }}>
              <DrumsVisuals currentStep={currentStep} color="#f5576c" />
            </div>
          )}

          {/* Drum Hit Indicators */}
          {audioStarted && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              {/* Kick */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: kickFlash
                  ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)'
                  : 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.05s',
                transform: kickFlash ? 'scale(1.3)' : 'scale(1)',
                boxShadow: kickFlash ? '0 0 30px rgba(255,255,255,1)' : 'none',
              }} />
              {/* Snare */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: snareFlash
                  ? 'radial-gradient(circle, rgba(255,215,0,0.9) 0%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0) 100%)'
                  : 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.05s',
                transform: snareFlash ? 'scale(1.3)' : 'scale(1)',
                boxShadow: snareFlash ? '0 0 30px rgba(255,215,0,1)' : 'none',
              }} />
              {/* HiHat */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: hatFlash
                  ? 'radial-gradient(circle, rgba(147,197,253,0.9) 0%, rgba(147,197,253,0.4) 50%, rgba(147,197,253,0) 100%)'
                  : 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.05s',
                transform: hatFlash ? 'scale(1.3)' : 'scale(1)',
                boxShadow: hatFlash ? '0 0 30px rgba(147,197,253,1)' : 'none',
              }} />
            </div>
          )}

          {/* Content Layer */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
            }}>
              🥁
            </div>
            <div style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: '700',
              textAlign: 'center',
            }}>
              Drums
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              textAlign: 'center',
            }}>
              {usersByInstrument.drums.length > 0
                ? `${usersByInstrument.drums.length} player${usersByInstrument.drums.length > 1 ? 's' : ''}`
                : 'Waiting...'}
            </div>

            {/* Cursor Position Indicator */}
            {usersByInstrument.drums.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
              }}>
                <div>Density: {(drumsParams.x * 100).toFixed(0)}%</div>
                <div>Groove: {(drumsParams.y * 100).toFixed(0)}%</div>
                {drumsParams.fx && (
                  <>
                    {drumsParams.fx.stutter && <div>⚡ Stutter ON</div>}
                    {drumsParams.fx.filterAmount > 0 && (
                      <div>🎛️ Filter: {((drumsParams.fx.filterAmount as number) * 100).toFixed(0)}%</div>
                    )}
                  </>
                )}
              </div>
            )}

            {soloedInstrument === 'drums' && (
              <div style={{
                color: '#ffd700',
                fontSize: '20px',
                fontWeight: '700',
                textAlign: 'center',
                animation: 'pulse 2s infinite',
              }}>
                ⭐ SOLO
              </div>
            )}
          </div>
        </div>

        {/* Harmony (placeholder) */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          padding: '40px',
          border: '2px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          opacity: 0.5,
        }}>
          <div style={{
            fontSize: '64px',
            textAlign: 'center',
          }}>
            🎹
          </div>
          <div style={{
            color: 'white',
            fontSize: '32px',
            fontWeight: '700',
            textAlign: 'center',
          }}>
            Harmony
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '18px',
            textAlign: 'center',
          }}>
            Coming soon...
          </div>
        </div>

        {/* Melody (placeholder) */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          padding: '40px',
          border: '2px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          opacity: 0.5,
        }}>
          <div style={{
            fontSize: '64px',
            textAlign: 'center',
          }}>
            🎺
          </div>
          <div style={{
            color: 'white',
            fontSize: '32px',
            fontWeight: '700',
            textAlign: 'center',
          }}>
            Melody
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '18px',
            textAlign: 'center',
          }}>
            Coming soon...
          </div>
        </div>
      </div>

      {/* Room Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px',
      }}>
        <div>Room: {roomId}</div>
        <div>Total Players: {Object.keys(users).length}</div>
        <div>Bar: {barIndex}</div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
