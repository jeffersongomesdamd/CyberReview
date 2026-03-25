'use client'

import { useEffect, useRef } from 'react'
import { getLevelInfo } from '@/lib/constants'

interface Props {
  reviewTitle: string
  xpGained: number
  newXp: number
  oldXp: number
  onComplete: () => void
}

export default function ReviewCelebration({ reviewTitle, xpGained, newXp, oldXp, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    // Cleanup da execução anterior (StrictMode chama 2x)
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    doneRef.current = false

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dimensões
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2

    // Regiões verticais fixas
    const R_TITLE  = H * 0.20
    const R_XP     = H * 0.44
    const R_LEVELUP = H * 0.72

    const oldLevel = getLevelInfo(oldXp)
    const newLevel = getLevelInfo(newXp)
    const leveledUp = newLevel.level > oldLevel.level
    const rankChanged = leveledUp && newLevel.rank !== oldLevel.rank
    const luColor = newLevel.rank === 'CYBER GOD' ? '#ffd700' : newLevel.color

    // ── Partículas ──────────────────────────────────────────
    type P = {
      x: number; y: number; vx: number; vy: number
      r: number; color: string; alpha: number; decay: number
      type: 0 | 1 | 2  // 0=circle, 1=star, 2=line
      angle: number; spin: number; len: number
    }
    const pts: P[] = []

    const PALETTE = ['#00f2ff','#bc13fe','#ff2079','#00ff9d','#ffffff','#ffd700']

    function burst(x: number, y: number, n: number, spd = 1) {
      for (let i = 0; i < n; i++) {
        const a  = (Math.PI * 2 * i / n) + Math.random() * 0.4
        const sp = (1.5 + Math.random() * 11) * spd
        pts.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - Math.random() * 3,
          r: 1.5 + Math.random() * 5,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          alpha: 1, decay: 0.007 + Math.random() * 0.013,
          type: Math.floor(Math.random() * 3) as 0 | 1 | 2,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.22,
          len: 5 + Math.random() * 18,
        })
      }
    }

    // Burst central + chuva
    burst(cx, H * 0.5, 160)
    for (let i = 0; i < 50; i++) {
      pts.push({
        x: Math.random() * W, y: -8,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 3.5,
        r: 1.5 + Math.random() * 3,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 1, decay: 0.004 + Math.random() * 0.007,
        type: 0, angle: 0, spin: 0, len: 0,
      })
    }

    // Anéis
    const rings = [
      { r: 0, max: Math.max(W, H) * 0.65, alpha: 0.85, color: '#00f2ff', delay: 0  },
      { r: 0, max: Math.max(W, H) * 0.45, alpha: 0.65, color: '#bc13fe', delay: 5  },
      { r: 0, max: Math.max(W, H) * 0.28, alpha: 0.45, color: '#ff2079', delay: 10 },
    ]

    // Timings
    const F_TOTAL    = leveledUp ? 300 : 230
    const F_XP_IN    = 30
    const F_LU_IN    = 120  // level up só aparece depois do XP
    const F_FADE_OUT = F_TOTAL - 45

    let frame = 0
    let xpBarPct = 0
    const xpTarget = newLevel.progress / 100
    let luBursted = false

    // ── Helpers de desenho ───────────────────────────────────
    function drawStar(cx2: number, cy2: number, r: number, angle: number) {
      ctx.save()
      ctx.translate(cx2, cy2)
      ctx.rotate(angle)
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2
        const b = a + Math.PI / 5
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        ctx.lineTo(Math.cos(b) * r * 0.42, Math.sin(b) * r * 0.42)
      }
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }

    function rrect(x: number, y: number, w: number, h: number, rx: number) {
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, rx)
      else ctx.rect(x, y, w, h)
    }

    function ga(): number {
      if (frame < 12) return frame / 12
      if (frame > F_FADE_OUT) return Math.max(0, (F_TOTAL - frame) / 45)
      return 1
    }

    // ── Loop principal ────────────────────────────────────────
    function tick() {
      if (doneRef.current) return

      if (frame >= F_TOTAL) {
        doneRef.current = true
        onComplete()
        return
      }

      ctx.clearRect(0, 0, W, H)

      // Fundo
      const bgA = frame < 14
        ? (frame / 14) * 0.86
        : frame > F_FADE_OUT
        ? Math.max(0, (F_TOTAL - frame) / 45) * 0.86
        : 0.86
      ctx.fillStyle = `rgba(4,4,12,${bgA})`
      ctx.fillRect(0, 0, W, H)

      // Anéis
      rings.forEach(ring => {
        if (frame < ring.delay) return
        ring.r  += (ring.max - ring.r) * 0.055
        ring.alpha *= 0.964
        if (ring.alpha < 0.004) return
        ctx.globalAlpha = ring.alpha
        ctx.beginPath()
        ctx.arc(cx, H * 0.5, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = ring.color
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      // Partículas
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        p.vy += 0.17; p.vx *= 0.992
        p.alpha -= p.decay; p.angle += p.spin
        if (p.alpha <= 0) { pts.splice(i, 1); continue }
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.strokeStyle = p.color
        ctx.shadowBlur = 7
        ctx.shadowColor = p.color
        if (p.type === 1) {
          drawStar(p.x, p.y, p.r, p.angle)
        } else if (p.type === 2) {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
          ctx.lineWidth = 1.5; ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(0, -p.len / 2); ctx.lineTo(0, p.len / 2)
          ctx.stroke(); ctx.restore()
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1
      }

      const alpha = ga()
      ctx.globalAlpha = alpha

      // ──────────────────────────────────────────────────────
      // REGIÃO 1 — TOPO: "REVIEW PUBLICADA!"
      // ──────────────────────────────────────────────────────
      {
        const sc = frame < 18 ? 0.15 + (frame / 18) * 0.92 : 1 + Math.sin(frame * 0.09) * 0.022
        const h  = (frame * 1.8) % 360

        ctx.save()
        ctx.translate(cx, R_TITLE)
        ctx.scale(sc, sc)

        const g = ctx.createLinearGradient(-280, 0, 280, 0)
        g.addColorStop(0,   `hsl(${h}, 100%, 62%)`)
        g.addColorStop(0.5, '#ffffff')
        g.addColorStop(1,   `hsl(${(h + 180) % 360}, 100%, 62%)`)

        ctx.shadowBlur = 42; ctx.shadowColor = '#00f2ff'
        ctx.font = `900 ${Math.min(52, W * 0.062)}px Orbitron, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = g
        ctx.fillText('REVIEW PUBLICADA!', 0, 0)
        ctx.shadowBlur = 0; ctx.restore()

        // Subtítulo (título da review)
        const title = reviewTitle.length > 46 ? reviewTitle.slice(0, 46) + '…' : reviewTitle
        ctx.font = `400 ${Math.min(16, W * 0.021)}px Inter, sans-serif`
        ctx.fillStyle = '#ccccdd'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.shadowBlur = 7; ctx.shadowColor = '#bc13fe'
        ctx.fillText(`"${title}"`, cx, R_TITLE + 44)
        ctx.shadowBlur = 0
      }

      // ──────────────────────────────────────────────────────
      // REGIÃO 2 — MEIO: badge +XP + barra de progresso
      // ──────────────────────────────────────────────────────
      if (frame >= F_XP_IN) {
        const t   = Math.min(1, (frame - F_XP_IN) / 16)
        const bW  = 210; const bH = 54
        const bx  = cx - bW / 2; const by = R_XP - bH / 2

        ctx.globalAlpha = alpha * t

        // Fundo badge
        ctx.fillStyle = 'rgba(3,3,14,0.92)'
        ctx.beginPath(); rrect(bx, by, bW, bH, 12); ctx.fill()

        // Borda animada
        const hb = (frame * 3) % 360
        const bg = ctx.createLinearGradient(bx, 0, bx + bW, 0)
        bg.addColorStop(0,   `hsl(${hb}, 100%, 58%)`)
        bg.addColorStop(0.5, `hsl(${(hb + 120) % 360}, 100%, 68%)`)
        bg.addColorStop(1,   `hsl(${(hb + 240) % 360}, 100%, 58%)`)
        ctx.strokeStyle = bg; ctx.lineWidth = 2
        ctx.beginPath(); rrect(bx, by, bW, bH, 12); ctx.stroke()

        // Número XP (count-up)
        const xpShow = Math.min(xpGained, Math.floor(xpGained * ((frame - F_XP_IN) / 22)))
        ctx.shadowBlur = 22; ctx.shadowColor = '#00f2ff'
        ctx.font = `900 30px Orbitron, sans-serif`
        ctx.fillStyle = '#00f2ff'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(`+${xpShow} XP`, cx, by + bH / 2)
        ctx.shadowBlur = 0

        // Barra de progresso
        const barW = Math.min(320, W * 0.48)
        const barH = 9
        const barX = cx - barW / 2
        const barY = by + bH + 14

        xpBarPct = Math.min(xpTarget, xpBarPct + 0.016)

        ctx.fillStyle = 'rgba(255,255,255,0.07)'
        ctx.beginPath(); rrect(barX, barY, barW, barH, 5); ctx.fill()

        if (xpBarPct > 0) {
          const fg = ctx.createLinearGradient(barX, 0, barX + barW, 0)
          fg.addColorStop(0, '#00f2ff'); fg.addColorStop(1, '#bc13fe')
          ctx.shadowBlur = 9; ctx.shadowColor = '#00f2ff'
          ctx.fillStyle = fg
          ctx.beginPath(); rrect(barX, barY, barW * xpBarPct, barH, 5); ctx.fill()
          ctx.shadowBlur = 0
        }

        // Rank label
        ctx.font = `700 11px Orbitron, sans-serif`
        ctx.fillStyle = luColor
        ctx.shadowBlur = 5; ctx.shadowColor = newLevel.glow
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillText(
          `${newLevel.rank}  ·  NV ${newLevel.level}${newLevel.prestige > 0 ? `  ·  P${newLevel.prestige}` : ''}`,
          cx, barY + barH + 7
        )
        ctx.shadowBlur = 0
      }

      // ──────────────────────────────────────────────────────
      // REGIÃO 3 — BASE: LEVEL UP (só se subiu de nível)
      // Aparece 90 frames DEPOIS do XP, na parte inferior
      // ──────────────────────────────────────────────────────
      if (leveledUp && frame >= F_LU_IN) {
        // Burst extra de partículas na estreia do level up
        if (!luBursted) {
          luBursted = true
          burst(cx, R_LEVELUP, 50, 0.7)
        }

        const luE   = frame - F_LU_IN
        const luT   = Math.min(1, luE / 18)
        const hLu   = (frame * 2.5) % 360

        ctx.globalAlpha = alpha * luT

        // Caixa sólida própria (SEPARADA da região de XP)
        const boxW  = Math.min(420, W * 0.62)
        const boxH  = 96
        const boxX  = cx - boxW / 2
        const boxY  = R_LEVELUP - boxH / 2

        // Fundo opaco para garantir que não vaza
        ctx.fillStyle = 'rgba(2, 2, 12, 0.97)'
        ctx.beginPath(); rrect(boxX, boxY, boxW, boxH, 14); ctx.fill()

        // Borda gradiente animada
        const bG = ctx.createLinearGradient(boxX, 0, boxX + boxW, 0)
        bG.addColorStop(0,    `hsl(${hLu}, 100%, 58%)`)
        bG.addColorStop(0.33, `hsl(${(hLu + 120) % 360}, 100%, 68%)`)
        bG.addColorStop(0.66, `hsl(${(hLu + 240) % 360}, 100%, 58%)`)
        bG.addColorStop(1,    `hsl(${hLu}, 100%, 58%)`)
        ctx.strokeStyle = bG; ctx.lineWidth = 2.5
        ctx.beginPath(); rrect(boxX, boxY, boxW, boxH, 14); ctx.stroke()

        // Linha de acento no topo da caixa
        ctx.strokeStyle = bG; ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(boxX + 16, boxY + 1); ctx.lineTo(boxX + boxW - 16, boxY + 1)
        ctx.stroke()

        // Texto "⬆ LEVEL UP!" com escala de entrada
        const sc2 = luE < 10 ? 0.2 + (luE / 10) * 0.88 : 1 + Math.sin(frame * 0.18) * 0.023
        ctx.save()
        ctx.translate(cx, boxY + 38)
        ctx.scale(sc2, sc2)

        const tG = ctx.createLinearGradient(-180, 0, 180, 0)
        tG.addColorStop(0,   `hsl(${hLu}, 100%, 65%)`)
        tG.addColorStop(0.5, '#ffffff')
        tG.addColorStop(1,   `hsl(${(hLu + 200) % 360}, 100%, 65%)`)

        ctx.shadowBlur = 32; ctx.shadowColor = luColor
        ctx.font = `900 ${Math.min(32, W * 0.042)}px Orbitron, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = tG
        ctx.fillText('⬆ LEVEL UP!', 0, 0)
        ctx.shadowBlur = 0; ctx.restore()

        // Subtexto com pill de fundo
        const sub = rankChanged
          ? `VOCÊ AGORA É ${newLevel.rank}`
          : `NV ${newLevel.level} ALCANÇADO!`

        ctx.font = `700 ${Math.min(12, W * 0.016)}px Orbitron, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const subW2 = ctx.measureText(sub).width + 26
        const subY  = boxY + 74

        ctx.fillStyle   = rankChanged ? `${luColor}20` : 'rgba(136,136,153,0.1)'
        ctx.strokeStyle = rankChanged ? `${luColor}55` : 'rgba(136,136,153,0.3)'
        ctx.lineWidth   = 1
        ctx.beginPath(); rrect(cx - subW2 / 2, subY - 10, subW2, 22, 11)
        ctx.fill(); ctx.stroke()

        ctx.shadowBlur = rankChanged ? 10 : 4; 
        ctx.shadowColor = rankChanged ? luColor : 'rgba(136,136,153,0.4)'
        ctx.fillStyle  = rankChanged ? luColor : '#888899'
        ctx.fillText(sub, cx, subY + 1)
        ctx.shadowBlur = 0
      }

      ctx.globalAlpha = 1
      frame++
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    // Clique para pular
    const skip = () => {
      if (doneRef.current) return
      doneRef.current = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      onComplete()
    }
    canvas.addEventListener('click', skip)

    // Cleanup (chamado pelo StrictMode na 1ª execução)
    return () => {
      doneRef.current = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('click', skip)
    }
  }, []) // SEM dependências — executa 1x e o cleanup cancela a anterior

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        cursor: 'pointer',
        pointerEvents: 'all',
        display: 'block',
      }}
    />
  )
}
