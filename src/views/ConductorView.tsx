import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePresence } from '../hooks/usePresence'
import { useTransport } from '../hooks/useTransport'
import { useConductorAudio } from '../hooks/useConductorAudio'
import { useResolvedRoomId } from '../hooks/useResolvedRoomId'
import BassVisuals from '../instruments/bass/BassVisuals'
import DrumsVisuals from '../instruments/drums/DrumsVisuals'
import type { PresenceState } from '../types/presence'
import { theme } from '../design/theme'
import BassIcon from '../components/icons/BassIcon'
import DrumsIcon from '../components/icons/DrumsIcon'
import MusicIcon from '../components/icons/MusicIcon'

export default function ConductorView() {
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('r')
  const roomId = useResolvedRoomId(roomCode) // Resolve short code to UUID

  const { users, isHost } = usePresence(roomId, 'conductor')
  const { state: transport, togglePlay, setBpm, bpm, barIndex, isPlaying } = useTransport(roomId, isHost)
  const {
    audioStarted,
    startAudio,
    bassParams,
    drumsParams,
    currentStep,
    bassEngine,
    kickFlash,
    snareFlash,
    hatFlash,
    bassFX,
    setBassFX,
    drumsFX,
    setDrumsFX,
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

  // Global keyboard listener for spacebar (play/pause)
  useEffect(() => {
    if (!isHost) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isHost, togglePlay])

  if (!roomId) {
    return <div className="loading" style={{ background: theme.colors.bg.primary, color: theme.colors.neon.cyan }}>No room ID provided</div>
  }

  return (
    <div
      className="fullscreen"
      style={{
        background: theme.colors.bg.primary,
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        position: 'relative',
        overflow: 'hidden'
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
            background: theme.colors.bg.overlay,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            cursor: 'pointer',
            zIndex: 1000,
            backdropFilter: 'blur(20px)',
          }}
        >
          <MusicIcon size={120} color={theme.colors.neon.cyan} />
          <div style={{
            color: theme.colors.neon.cyan,
            fontSize: '52px',
            fontWeight: '800',
            textAlign: 'center',
            textShadow: theme.shadows.glow.cyan,
            letterSpacing: '2px'
          }}>
            Tap to Start Audio
          </div>
          <div style={{
            color: theme.colors.neon.magenta,
            fontSize: '22px',
            textAlign: 'center',
            maxWidth: '600px',
            fontWeight: '600'
          }}>
            {isPlaying ? 'Music is playing! Click anywhere to hear it.' : 'Start playback to enable audio'}
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <MusicIcon size={48} color={theme.colors.neon.cyan} />
        <h1 style={{
          color: theme.colors.neon.cyan,
          fontSize: '48px',
          fontWeight: '800',
          textShadow: theme.shadows.glow.cyan,
          textAlign: 'center',
          letterSpacing: '2px'
        }}>
          JamSync Conductor
        </h1>
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
        gap: '40px',
        marginBottom: '200px',
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

          {/* Cursor Position Indicator */}
          {usersByInstrument.bass.length > 0 && (
            <div style={{
              position: 'absolute',
              left: `${bassParams.x * 100}%`,
              top: `${bassParams.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(99,102,241,0.6) 50%, rgba(99,102,241,0) 100%)',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 0 20px rgba(255,255,255,0.8)',
              pointerEvents: 'none',
              zIndex: 3,
              transition: 'all 0.1s ease-out',
            }} />
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

          {/* Cursor Position Indicator */}
          {usersByInstrument.drums.length > 0 && (
            <div style={{
              position: 'absolute',
              left: `${drumsParams.x * 100}%`,
              top: `${drumsParams.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(245,87,108,0.6) 50%, rgba(245,87,108,0) 100%)',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 0 20px rgba(255,255,255,0.8)',
              pointerEvents: 'none',
              zIndex: 3,
              transition: 'all 0.1s ease-out',
            }} />
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

            {/* FX Indicators */}
            {usersByInstrument.drums.length > 0 && drumsParams.fx && (
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
              }}>
                {(drumsParams.fx.stutter as boolean) && <div>⚡ Stutter</div>}
                {(drumsParams.fx.filterAmount as number) > 0.1 && <div>🎛️ Filter</div>}
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
      </div>

      {/* FX Controls */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.7)',
        padding: '16px 40px',
        display: 'flex',
        gap: '40px',
        justifyContent: 'center',
        zIndex: 99,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Bass FX */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ color: '#6366f1', fontWeight: '700', fontSize: '14px' }}>🎸 BASS FX:</div>

          <button
            onClick={() => setBassFX({ ...bassFX, autoWah: !bassFX.autoWah })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: bassFX.autoWah ? '#ffd700' : 'rgba(255,255,255,0.2)',
              color: bassFX.autoWah ? '#000' : 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Auto-Wah {bassFX.autoWah ? 'ON' : 'OFF'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '12px', minWidth: '60px' }}>Filter: {(bassFX.filterAmount * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bassFX.filterAmount}
              onChange={(e) => setBassFX({ ...bassFX, filterAmount: parseFloat(e.target.value) })}
              style={{ width: '100px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '12px', minWidth: '60px' }}>Delay: {(bassFX.delayAmount * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bassFX.delayAmount}
              onChange={(e) => setBassFX({ ...bassFX, delayAmount: parseFloat(e.target.value) })}
              style={{ width: '100px' }}
            />
          </div>
        </div>

        {/* Drums FX */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ color: '#f5576c', fontWeight: '700', fontSize: '14px' }}>🥁 DRUMS FX:</div>

          <button
            onClick={() => setDrumsFX({ ...drumsFX, stutter: !drumsFX.stutter })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: drumsFX.stutter ? '#ffd700' : 'rgba(255,255,255,0.2)',
              color: drumsFX.stutter ? '#000' : 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Stutter {drumsFX.stutter ? 'ON' : 'OFF'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '12px', minWidth: '60px' }}>Filter: {(drumsFX.filterAmount * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={drumsFX.filterAmount}
              onChange={(e) => setDrumsFX({ ...drumsFX, filterAmount: parseFloat(e.target.value) })}
              style={{ width: '100px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '12px', minWidth: '60px' }}>Delay: {(drumsFX.delayAmount * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={drumsFX.delayAmount}
              onChange={(e) => setDrumsFX({ ...drumsFX, delayAmount: parseFloat(e.target.value) })}
              style={{ width: '100px' }}
            />
          </div>
        </div>
      </div>

      {/* Transport Controls (Bottom) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 40px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
      }}>
        {/* Left: Room info */}
        <div style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div>Room: {roomCode || roomId?.slice(0, 8)}</div>
          <div>Players: {Object.keys(users).length}</div>
        </div>

        {/* Center: Play button and BPM control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}>
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={!isHost}
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              fontSize: '32px',
              cursor: isHost ? 'pointer' : 'not-allowed',
              opacity: isHost ? 1 : 0.5,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (isHost) {
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* BPM Control */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px',
          }}>
            <div style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
            }}>
              {bpm} BPM
            </div>
            {isHost && (
              <>
                <input
                  type="range"
                  min="60"
                  max="180"
                  step="1"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    accentColor: '#ffd700',
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '11px',
                }}>
                  <span>60</span>
                  <span>180</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Host indicator */}
        <div style={{
          color: isHost ? '#ffd700' : 'rgba(255,255,255,0.6)',
          fontSize: '14px',
          fontWeight: '700',
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {isHost && <div>⭐ HOST</div>}
          {isHost && <div style={{ fontSize: '12px' }}>Press SPACE</div>}
          {!isHost && <div>Listener</div>}
        </div>
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
