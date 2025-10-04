import { useRef, useState, useCallback } from 'react'

interface XYPadProps {
  onMove: (x: number, y: number) => void
  color?: string
  children?: React.ReactNode
}

export default function XYPad({ onMove, color = '#667eea', children }: XYPadProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number | null>(null)

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!padRef.current) return

    const rect = padRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

    // Use RAF for smooth updates
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      setPosition({ x, y })
      onMove(x, y)
    })
  }, [onMove])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsActive(true)
    handleMove(e.clientX, e.clientY)
    if (padRef.current) {
      padRef.current.setPointerCapture(e.pointerId)
    }
  }, [handleMove])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Track cursor even when not pressed for hover effect
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsActive(false)
    if (padRef.current) {
      padRef.current.releasePointerCapture(e.pointerId)
    }
  }, [])

  return (
    <div
      ref={padRef}
      className="xy-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'crosshair',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Glowing cursor follower - always visible */}
      <div
        style={{
          position: 'absolute',
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          width: isActive ? '60px' : '40px',
          height: isActive ? '60px' : '40px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          boxShadow: isActive
            ? `0 0 40px ${color}, 0 0 80px ${color}, 0 0 120px ${color}`
            : `0 0 20px ${color}, 0 0 40px ${color}`,
          transition: 'all 0.1s ease-out',
          opacity: isActive ? 1 : 0.7,
        }}
      />

      {/* Center dot */}
      <div
        style={{
          position: 'absolute',
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          boxShadow: '0 0 10px white',
        }}
      />

      {/* Content overlay (visuals, etc.) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {children}
      </div>

      {/* Axis labels */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
        pointerEvents: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}>
        X: {(position.x * 100).toFixed(0)}%
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
        pointerEvents: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}>
        Y: {(position.y * 100).toFixed(0)}%
      </div>
    </div>
  )
}
