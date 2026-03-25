'use client'

import { useEffect, useRef } from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export default function CyberGodBadge({ size = 'md', showTitle = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sizes = { sm: { w: 120, h: 28, font: 10 }, md: { w: 180, h: 36, font: 13 }, lg: { w: 260, h: 48, font: 17 } }
  const s = sizes[size]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = s.w
    canvas.height = s.h

    let frame = 0
    let animId: number

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = []

    function spawnParticle() {
      if (Math.random() < 0.4) {
        particles.push({
          x: Math.random() * s.w,
          y: s.h + 2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(0.5 + Math.random() * 1.5),
          size: 0.8 + Math.random() * 1.5,
          alpha: 0.8 + Math.random() * 0.2,
          color: ['#00f2ff','#bc13fe','#ff2079','#ffd700','#ffffff'][Math.floor(Math.random() * 5)],
        })
      }
    }

    function animate() {
      frame++
      ctx.clearRect(0, 0, s.w, s.h)

      // Fundo glassmorphism
      ctx.fillStyle = 'rgba(5,5,5,0.7)'
      ctx.beginPath()
      ctx.roundRect(0, 0, s.w, s.h, s.h / 2)
      ctx.fill()

      // Borda animada com gradiente ciclante
      const hue1 = (frame * 2) % 360
      const hue2 = (frame * 2 + 120) % 360
      const hue3 = (frame * 2 + 240) % 360
      const borderGrad = ctx.createLinearGradient(0, 0, s.w, 0)
      borderGrad.addColorStop(0,    `hsl(${hue1}, 100%, 65%)`)
      borderGrad.addColorStop(0.33, `hsl(${hue2}, 100%, 65%)`)
      borderGrad.addColorStop(0.66, `hsl(${hue3}, 100%, 65%)`)
      borderGrad.addColorStop(1,    `hsl(${hue1}, 100%, 65%)`)
      ctx.strokeStyle = borderGrad
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(0.75, 0.75, s.w - 1.5, s.h - 1.5, s.h / 2)
      ctx.stroke()

      // Partículas
      spawnParticle()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.012
        if (p.alpha <= 0 || p.y < -5) { particles.splice(i, 1); continue }
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.shadowBlur = 4
        ctx.shadowColor = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // Texto com gradiente animado
      if (showTitle) {
        const textGrad = ctx.createLinearGradient(20, 0, s.w - 20, 0)
        textGrad.addColorStop(0,    `hsl(${hue1}, 100%, 70%)`)
        textGrad.addColorStop(0.33, `hsl(${hue2}, 100%, 85%)`)
        textGrad.addColorStop(0.66, `hsl(${hue3}, 100%, 70%)`)
        textGrad.addColorStop(1,    `hsl(${hue1}, 100%, 70%)`)

        ctx.font = `900 ${s.font}px Orbitron, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowBlur = 12
        ctx.shadowColor = `hsl(${hue2}, 100%, 65%)`
        ctx.fillStyle = textGrad
        ctx.fillText('⚡ CYBER GOD', s.w / 2, s.h / 2)
        ctx.shadowBlur = 0
      }

      animId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animId)
  }, [size, showTitle])

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: s.h / 2 }} />
}
