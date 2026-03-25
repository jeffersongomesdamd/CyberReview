'use client'

interface Props {
  effect: { effect?: string; color?: string; intensity?: string; animated?: boolean } | null
  username: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP   = { sm: '0.75rem', md: '1rem',    lg: '1.5rem'  }
const ORBIT_MAP  = { sm: 20,        md: 28,         lg: 40        }
const PCOUNT_MAP = { sm: 4,         md: 5,          lg: 6         }
const PSIZE_MAP  = { sm: 3,         md: 4,          lg: 5         }

export default function EffectRenderer({ effect, username, size = 'md' }: Props) {
  const fontSize  = SIZE_MAP[size]
  const orbitR    = ORBIT_MAP[size]
  const pCount    = PCOUNT_MAP[size]
  const pSize     = PSIZE_MAP[size]
  const effectType = effect?.effect
  const color      = effect?.color ?? '#00f2ff'
  const intensity  = effect?.intensity

  const base: React.CSSProperties = {
    fontFamily: 'Orbitron, sans-serif',
    fontWeight: 900, fontSize,
    letterSpacing: '0.05em',
    display: 'inline-block',
    position: 'relative',
    lineHeight: 1.2,
  }

  if (!effectType) {
    return <span style={{ ...base, color: '#e0e0e0' }}>@{username}</span>
  }

  // ── Glow (suporta qualquer cor) ───────────────────────────
  if (effectType === 'glow' || effectType === 'soft-glow') {
    const isHigh    = intensity === 'high'
    const isMinimal = intensity === 'minimal'
    const glowSize  = isHigh ? '8px' : isMinimal ? '2px' : '5px'
    const glowOpacity = isHigh ? '1' : isMinimal ? '0.5' : '0.8'
    return (
      <span style={{
        ...base, color,
        filter: `drop-shadow(0 0 ${glowSize} ${color}${isMinimal ? '80' : ''})`,
      }}>
        @{username}
      </span>
    )
  }

  // ── Pulse (suporta qualquer cor) ──────────────────────────
  if (effectType === 'pulse') {
    const uid = `pulse-${color.replace('#','')}-${size}`
    return (
      <>
        <span style={{ ...base, color, animation: `${uid} 2.5s ease infinite` }}>
          @{username}
        </span>
        <style>{`
          @keyframes ${uid} {
            0%,100% { filter: drop-shadow(0 0 3px ${color}80); }
            50%      { filter: drop-shadow(0 0 10px ${color}); }
          }
        `}</style>
      </>
    )
  }

  // ── Neon Pulse ────────────────────────────────────────────
  if (effectType === 'neon-pulse') {
    const uid = `neonp-${color.replace('#','')}-${size}`
    return (
      <>
        <span style={{ ...base, color, animation: `${uid} 1.5s ease infinite` }}>
          @{username}
        </span>
        <style>{`
          @keyframes ${uid} {
            0%,100% { filter: drop-shadow(0 0 3px ${color}aa); color: ${color}; }
            50%      { filter: drop-shadow(0 0 14px ${color}) drop-shadow(0 0 28px ${color}66); color: #ffffff; }
          }
        `}</style>
      </>
    )
  }

  // ── Aura (suporta qualquer cor) ───────────────────────────
  if (effectType === 'aura') {
    const uid = `aura-${color.replace('#','')}-${size}`
    return (
      <>
        <span style={{ ...base, color, animation: `${uid} 2s ease infinite` }}>
          @{username}
        </span>
        <style>{`
          @keyframes ${uid} {
            0%,100% { filter: drop-shadow(0 0 6px ${color}cc); color: ${color}; }
            50%      { filter: drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color}44); color: #ffffff; }
          }
        `}</style>
      </>
    )
  }

  // ── Aura Lendária (impactante) ─────────────────────────────
  if (effectType === 'aura-legendary') {
    return (
      <>
        <span style={{
          ...base,
          color: '#ffffff',
          animation: 'auraLegendary 1.5s ease infinite',
          letterSpacing: '0.1em',
        }}>
          @{username}
        </span>
        <style>{`
          @keyframes auraLegendary {
            0%   { filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #00f2ff); color: #ffffff; }
            25%  { filter: drop-shadow(0 0 8px #ffd700) drop-shadow(0 0 16px #ff7700); color: #ffd700; }
            50%  { filter: drop-shadow(0 0 12px #bc13fe) drop-shadow(0 0 24px #ffffff88); color: #e0aaff; }
            75%  { filter: drop-shadow(0 0 8px #00ff9d) drop-shadow(0 0 16px #00f2ff); color: #aaffee; }
            100% { filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #00f2ff); color: #ffffff; }
          }
        `}</style>
      </>
    )
  }

  // ── RGB Holográfico ───────────────────────────────────────
  if (effectType === 'rgb') {
    return (
      <>
        <span style={{ ...base, animation: 'rgbCycle 3s linear infinite' }}>
          @{username}
        </span>
        <style>{`
          @keyframes rgbCycle {
            0%   { color: #00f2ff; filter: drop-shadow(0 0 6px #00f2ff); }
            16%  { color: #bc13fe; filter: drop-shadow(0 0 6px #bc13fe); }
            33%  { color: #ff2079; filter: drop-shadow(0 0 6px #ff2079); }
            50%  { color: #ffd700; filter: drop-shadow(0 0 6px #ffd700); }
            66%  { color: #00ff9d; filter: drop-shadow(0 0 6px #00ff9d); }
            83%  { color: #ff7700; filter: drop-shadow(0 0 6px #ff7700); }
            100% { color: #00f2ff; filter: drop-shadow(0 0 6px #00f2ff); }
          }
        `}</style>
      </>
    )
  }

  // ── Chamas Neon ───────────────────────────────────────────
  if (effectType === 'flames') {
    return (
      <>
        <span style={{ ...base, animation: 'flamesEffect 0.8s ease infinite', color: '#ff7700' }}>
          @{username}
        </span>
        <style>{`
          @keyframes flamesEffect {
            0%,100% { color: #ff7700; filter: drop-shadow(0 0 4px #ff7700) drop-shadow(0 0 8px #ff2079); }
            25%     { color: #ff2079; filter: drop-shadow(0 0 6px #ff2079) drop-shadow(0 0 12px #ffd700); }
            50%     { color: #ffd700; filter: drop-shadow(0 0 8px #ffd700) drop-shadow(0 0 16px #ff7700); }
            75%     { color: #ff7700; filter: drop-shadow(0 0 5px #ff7700) drop-shadow(0 0 10px #ff2079); }
          }
        `}</style>
      </>
    )
  }

  // ── Partículas (suporta cor customizada e RGB) ────────────
  if (effectType === 'particles') {
    const isRgb = color === 'rgb'
    const PALETTE = isRgb
      ? ['#00f2ff','#bc13fe','#ff2079','#ffd700','#00ff9d','#ff7700']
      : [color, color+'cc', color+'88', color+'cc', color, color+'aa']

    return (
      <>
        {/* Wrapper que não desloca o texto */}
        <span style={{
          ...base,
          color: isRgb ? '#00f2ff' : color,
          // SEM padding — as partículas ficam em overflow:visible
        }}>
          @{username}
          {/* Container de partículas com overflow visible, não afeta layout */}
          <span style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 0, height: 0,
            pointerEvents: 'none',
            zIndex: 10,
            overflow: 'visible',
          }}>
            {Array.from({ length: pCount }).map((_, i) => {
              const pColor = PALETTE[i % PALETTE.length]
              const duration = 2 + i * 0.3
              const delay = -(i * (2 / pCount))
              const uid = `po${i}-${size}-${color.replace('#','').replace(' ','')}`
              return (
                <span key={i} style={{
                  position: 'absolute',
                  width: pSize, height: pSize,
                  borderRadius: '50%',
                  background: pColor,
                  boxShadow: `0 0 6px ${pColor}`,
                  marginTop: -pSize / 2,
                  marginLeft: -pSize / 2,
                  animation: `${uid} ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  pointerEvents: 'none',
                  display: 'block',
                  zIndex: size === 'sm' ? -1 : 10,
                }} />
              )
            })}
          </span>
        </span>
        <style>{`
          ${Array.from({ length: pCount }).map((_, i) => {
            const startAngle = (i / pCount) * 360
            const uid = `po${i}-${size}-${color.replace('#','').replace(' ','')}`
            return `
              @keyframes ${uid} {
                from { transform: rotate(${startAngle}deg) translateX(${orbitR}px) rotate(-${startAngle}deg); }
                to   { transform: rotate(${startAngle + 360}deg) translateX(${orbitR}px) rotate(-${startAngle + 360}deg); }
              }
            `
          }).join('')}
        `}</style>
      </>
    )
  }

  // Fallback
  return <span style={{ ...base, color: '#e0e0e0' }}>@{username}</span>
}
