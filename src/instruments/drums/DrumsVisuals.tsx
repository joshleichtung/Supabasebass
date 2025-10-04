import { useRef, useEffect, useState } from 'react'

interface DrumsVisualsProps {
  currentStep?: number
  color?: string
}

export default function DrumsVisuals({ currentStep = 0, color = '#f5576c' }: DrumsVisualsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sparks, setSparks] = useState<Array<{ x: number; y: number; age: number }>>([])

  // Add spark on step change
  useEffect(() => {
    if (currentStep < 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.35

    const angle = (currentStep / 16) * Math.PI * 2 - Math.PI / 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    setSparks(prev => [...prev, { x, y, age: 0 }])
  }, [currentStep])

  // Animate sparks
  useEffect(() => {
    const interval = setInterval(() => {
      setSparks(prev =>
        prev
          .map(spark => ({ ...spark, age: spark.age + 1 }))
          .filter(spark => spark.age < 20)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.35

      // Clear with fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      // Draw 16-step arc
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2

        ctx.beginPath()
        ctx.arc(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          i === (currentStep % 16) ? 12 : 6,
          0,
          Math.PI * 2
        )

        ctx.fillStyle = i === (currentStep % 16)
          ? color
          : 'rgba(255, 255, 255, 0.3)'
        ctx.fill()

        // Connect steps with lines
        if (i > 0) {
          const prevAngle = ((i - 1) / 16) * Math.PI * 2 - Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(
            centerX + Math.cos(prevAngle) * radius,
            centerY + Math.sin(prevAngle) * radius
          )
          ctx.lineTo(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius
          )
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      // Draw sparks
      sparks.forEach(spark => {
        const alpha = 1 - (spark.age / 20)
        const size = 8 - (spark.age / 3)

        ctx.beginPath()
        ctx.arc(spark.x, spark.y, Math.max(0, size), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`
        ctx.fill()

        // Glow
        ctx.shadowBlur = 20
        ctx.shadowColor = color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [currentStep, color, sparks])

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
