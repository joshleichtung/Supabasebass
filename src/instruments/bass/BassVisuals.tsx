import { useRef, useEffect } from 'react'
import * as Tone from 'tone'

interface BassVisualsProps {
  synth: Tone.MonoSynth | null
  color?: string
}

export default function BassVisuals({ synth, color = '#667eea' }: BassVisualsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<Tone.Analyser | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!synth || !canvasRef.current) return

    // Create analyser
    const analyser = new Tone.Analyser('waveform', 512)
    synth.connect(analyser)
    analyserRef.current = analyser

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    const draw = () => {
      if (!ctx || !analyser) return

      const width = canvas.width
      const height = canvas.height

      // Clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      // Get waveform
      const waveform = analyser.getValue() as Float32Array

      // Draw waveform
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()

      const sliceWidth = width / waveform.length
      let x = 0

      for (let i = 0; i < waveform.length; i++) {
        const v = (waveform[i] + 1) / 2 // Normalize to 0-1
        const y = v * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()

      // Center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (analyserRef.current) {
        analyserRef.current.dispose()
      }
      window.removeEventListener('resize', resize)
    }
  }, [synth, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
