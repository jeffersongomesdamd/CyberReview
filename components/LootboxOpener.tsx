'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RARITY_COLORS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Props {
  lootboxId: string
  lootboxRarity: 'common' | 'rare' | 'epic' | 'legendary'
  userId: string
  onClose: () => void
  onResult: (item: DroppedItem) => void
}

interface DroppedItem {
  item_id: string
  item_name: string
  item_type: string
  item_icon: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  value: Record<string, any>
}

const RARITY_LABELS_ITEM_PT: Record<string, string> = {
  common: 'COMUM', rare: 'RARO', epic: 'ÉPICO', legendary: 'LENDÁRIO'
}

const TYPE_LABELS: Record<string, string> = {
  color:           '🎨 COR DE PERFIL',
  frame:           '🖼️ MOLDURA DE AVATAR',
  effect:          '✨ EFEITO VISUAL',
  theme:           '💜 TEMA EXCLUSIVO',
  badge:           '🏅 BADGE DE PERFIL',
  title:           '👑 TÍTULO CUSTOMIZADO',
  boost:           '🔥 BOOST DE FEED',
  review_style:    '📝 ESTILO DE REVIEW',
  profile_banner:  '🖥️ BANNER DE PERFIL',
  reaction_effect: '💥 EFEITO DE REAÇÃO',
  emoji:           '😊 EMOJI DE REAÇÃO',
}

// Pool de símbolos por raridade para o slot
const SYMBOLS = {
  common:    ['🎨','🏷️','😊','👏','🖥️','📝','✨','🖼️'],
  rare:      ['🌈','🖼️','✨','🏅','🔥','⚡','📝','🖥️','💥'],
  epic:      ['💎','🔥','👑','💜','🎖️','📝','🖥️','💥','💛'],
  legendary: ['💫','🌐','👾','⚡','💎','📝','💥','👑','🖥️'],
}

const ALL_SYMBOLS = [
  '🎨','🏷️','🌈','🖼️','✨','🏅','💎','🔥',
  '👑','💜','💫','🌐','👾','⚡','🎖️',
  '📝','🖥️','💥','😊','👏','🔥','💛','👑',
]

export default function LootboxOpener({ lootboxId, lootboxRarity, userId, onClose, onResult }: Props) {
  const [phase, setPhase] = useState<'idle'|'countdown'|'spinning'|'slowing'|'stop'|'reveal'>('idle')
  const [slots, setSlots]   = useState<string[]>(['🎁','🎁','🎁','🎁','🎁'])
  const [countdown, setCountdown] = useState(3)
  const [result, setResult] = useState<DroppedItem | null>(null)
  const [error, setError]   = useState('')
  const [particles, setParticles] = useState<{id:number;x:number;y:number;color:string;size:number;angle:number}[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countRef    = useRef<NodeJS.Timeout | null>(null)
  const particleId  = useRef(0)
  const r = RARITY_COLORS[lootboxRarity]

  // Spawna partículas decorativas
  useEffect(() => {
    const id = setInterval(() => {
      if (phase === 'spinning' || phase === 'reveal') {
        setParticles(prev => {
          const newP = Array.from({ length: 3 }, () => ({
            id: particleId.current++,
            x: Math.random() * 100,
            y: 100,
            color: [r.color,'#ffffff','#ffd700'][Math.floor(Math.random()*3)],
            size: 4 + Math.random() * 6,
            angle: -60 + Math.random() * 120,
          }))
          return [...prev.slice(-30), ...newP]
        })
      }
    }, 80)
    return () => clearInterval(id)
  }, [phase, r.color])

  const randomSlots = (pool: string[]) =>
    Array.from({ length: 5 }, () => pool[Math.floor(Math.random() * pool.length)])

  const handleOpen = async () => {
    if (phase !== 'idle') return
    setError('')

    // Fase 1: countdown 3-2-1
    setPhase('countdown')
    setCountdown(3)
    let c = 3
    countRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        if (countRef.current) clearInterval(countRef.current)
        startSpin()
      }
    }, 700)
  }

  const startSpin = async () => {
    setPhase('spinning')

    // Gira rápido com todos os símbolos
    intervalRef.current = setInterval(() => {
      setSlots(randomSlots(ALL_SYMBOLS))
    }, 60)

    // Chama o banco
    const { data, error: rpcErr } = await supabase.rpc('open_lootbox', {
      p_lootbox_id: lootboxId,
      p_user_id: userId,
    })

    if (rpcErr || data?.error) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPhase('idle')
      setError(rpcErr?.message ?? data?.error ?? 'Erro ao abrir')
      return
    }

    const dropped = data as DroppedItem

    // Normalizar ícone: se for 🎁 ou vazio, usar o ícone do tipo
    const TYPE_ICONS: Record<string, string> = {
      color:           '🎨',
      frame:           '🖼️',
      effect:          '✨',
      theme:           '💜',
      badge:           '🏅',
      title:           '👑',
      boost:           '🔥',
      review_style:    '📝',
      profile_banner:  '🖥️',
      reaction_effect: '💥',
      emoji:           '😊',
    }

    const droppedNormalized = {
      ...dropped,
      item_icon: dropped.item_icon && dropped.item_icon !== '🎁'
        ? dropped.item_icon
        : TYPE_ICONS[dropped.item_type] ?? '🎁'
    }

    // Fase 2: desacelera gradualmente
    setTimeout(() => {
      setPhase('slowing')
      if (intervalRef.current) clearInterval(intervalRef.current)
      // Velocidade média
      intervalRef.current = setInterval(() => {
        setSlots(randomSlots(SYMBOLS[droppedNormalized.rarity as keyof typeof SYMBOLS] ?? SYMBOLS.common))
      }, 160)
    }, 2000)

    // Fase 3: mais lento
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setSlots(randomSlots(SYMBOLS[droppedNormalized.rarity as keyof typeof SYMBOLS] ?? SYMBOLS.common))
      }, 320)
    }, 3500)

    // Fase 4: para nos slots finais
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const finalIcon = droppedNormalized.item_icon ?? '🎁'
      // Travando slot por slot com delay
      setSlots(prev => [finalIcon, prev[1], prev[2], prev[3], prev[4]])
      setTimeout(() => setSlots(prev => [finalIcon, finalIcon, prev[2], prev[3], prev[4]]), 200)
      setTimeout(() => setSlots(prev => [finalIcon, finalIcon, finalIcon, prev[3], prev[4]]), 400)
      setTimeout(() => setSlots(prev => [finalIcon, finalIcon, finalIcon, finalIcon, prev[4]]), 600)
      setTimeout(() => {
        setSlots([finalIcon, finalIcon, finalIcon, finalIcon, finalIcon])
        setPhase('stop')
        setResult(droppedNormalized)

        // Pequeno suspense antes do reveal
        setTimeout(() => {
          setPhase('reveal')
          onResult(droppedNormalized)
        }, 800)
      }, 800)
    }, 4800)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (countRef.current)    clearInterval(countRef.current)
    }
  }, [])

  const isSpinning  = phase === 'spinning' || phase === 'slowing'
  const rarityResult = result ? RARITY_COLORS[result.rarity] : r

  return (
    <div
      onClick={phase === 'reveal' ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.94)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        cursor: phase === 'reveal' ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Partículas de fundo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`,
            bottom: `${100 - p.y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `floatUp 2s ease-out forwards`,
            transform: `rotate(${p.angle}deg)`,
          }} />
        ))}
      </div>

      {/* Card principal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#060610',
          border: `2px solid ${phase === 'reveal' ? rarityResult.color + '80' : r.color + '50'}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: phase === 'reveal'
            ? `0 0 80px ${rarityResult.glow}, 0 0 160px ${rarityResult.color}20`
            : `0 0 40px ${r.glow}`,
          transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
          animation: 'cardIn 0.35s ease forwards',
          position: 'relative',
        }}
      >
        {/* Linha de acento topo */}
        <div style={{
          height: 3,
          background: phase === 'reveal'
            ? `linear-gradient(90deg, transparent, ${rarityResult.color}, transparent)`
            : `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
          transition: 'background 0.5s ease',
        }} />

        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.95rem', fontWeight: 900,
              color: phase === 'reveal' ? rarityResult.color : r.color,
              letterSpacing: '0.1em', margin: 0,
              textShadow: `0 0 16px ${phase === 'reveal' ? rarityResult.glow : r.glow}`,
              transition: 'color 0.5s ease',
            }}>
              🎰 LOOTBOX {RARITY_COLORS[lootboxRarity].label}
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#444466', margin: '0.2rem 0 0', fontFamily: 'Inter, sans-serif' }}>
              {phase === 'idle'      && 'Pressione GIRAR para descobrir seu item'}
              {phase === 'countdown' && `Preparando... ${countdown}`}
              {isSpinning            && 'Girando os rolos...'}
              {phase === 'stop'      && 'Aguarde...'}
              {phase === 'reveal'    && 'Clique em qualquer lugar para fechar'}
            </p>
          </div>
          {phase === 'idle' && (
            <button onClick={onClose} style={{
              background: 'rgba(255,32,121,0.08)', border: '1px solid rgba(255,32,121,0.25)',
              borderRadius: 8, padding: '0.4rem 0.7rem',
              color: '#ff2079', cursor: 'pointer', fontSize: '1rem',
              transition: 'all 0.2s',
            }}>×</button>
          )}
        </div>

        {/* Máquina de slot */}
        <div style={{ padding: '1.5rem' }}>

          {/* Display dos rolos */}
          <div style={{
            background: '#020210',
            border: `1px solid ${isSpinning ? r.color + '60' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16,
            padding: '1.25rem 1rem',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease',
            boxShadow: isSpinning ? `inset 0 0 30px ${r.color}15` : 'none',
          }}>

            {/* Linha de scan quando girando */}
            {isSpinning && (
              <>
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
                  animation: 'scanDown 0.35s linear infinite',
                  zIndex: 5,
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 50% 50%, ${r.color}08, transparent 70%)`,
                  animation: 'pulseGlow 0.8s ease infinite',
                }} />
              </>
            )}

            {/* Linhas de guia */}
            <div style={{
              position: 'absolute', top: '50%', left: '0.75rem', right: '0.75rem',
              height: 52, transform: 'translateY(-50%)',
              border: `1px solid ${phase === 'reveal' ? rarityResult.color + '50' : r.color + '25'}`,
              borderRadius: 8, pointerEvents: 'none',
              transition: 'border-color 0.5s ease',
              boxShadow: phase === 'reveal' ? `0 0 12px ${rarityResult.glow}` : 'none',
            }} />

            {/* Slots — 5 rolos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem',
              position: 'relative', zIndex: 2,
            }}>
              {slots.map((symbol, i) => (
                <div key={i} style={{
                  background: phase === 'reveal' ? `${rarityResult.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${phase === 'reveal' ? rarityResult.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10,
                  padding: '0.75rem 0.25rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: phase === 'reveal' ? `0 0 16px ${rarityResult.glow}` : 'none',
                }}>
                  <span style={{
                    fontSize: '1.8rem',
                    display: 'block',
                    lineHeight: 1,
                    filter: isSpinning
                      ? 'blur(1.5px) brightness(1.3)'
                      : phase === 'reveal'
                      ? `drop-shadow(0 0 10px ${rarityResult.color})`
                      : 'none',
                    transform: isSpinning
                      ? `translateY(${Math.sin((Date.now() / 40) + i * 0.8) * 4}px)`
                      : phase === 'reveal'
                      ? `scale(${1 + Math.sin(Date.now() / 400) * 0.05})`
                      : 'scale(1)',
                    transition: isSpinning ? 'none' : 'all 0.4s ease',
                  }}>
                    {symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown overlay */}
          {phase === 'countdown' && (
            <div style={{
              textAlign: 'center',
              marginBottom: '1.25rem',
              animation: 'countPulse 0.6s ease forwards',
            }}>
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '3.5rem',
                fontWeight: 900,
                color: r.color,
                textShadow: `0 0 30px ${r.glow}`,
                display: 'block',
                animation: 'countPulse 0.65s ease infinite',
              }}>
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </div>
          )}

          {/* Barra de progresso do spin */}
          {isSpinning && (
            <div style={{
              height: 4,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 2,
              marginBottom: '1.25rem',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${r.color}, #ffffff, ${r.color})`,
                backgroundSize: '200% 100%',
                animation: 'shimmerBar 1s linear infinite',
                borderRadius: 2,
                width: '100%',
              }} />
            </div>
          )}

          {/* Resultado revelado */}
          {phase === 'reveal' && result && (
            <div style={{
              background: `${rarityResult.color}08`,
              border: `1px solid ${rarityResult.color}35`,
              borderRadius: 14,
              padding: '1.25rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
              animation: 'revealItem 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}>
              {/* Badge raridade */}
              <p style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 900,
                letterSpacing: '0.15em',
                color: r.color,
                textShadow: `0 0 10px ${r.glow}`,
                marginBottom: '1.5rem',
              }}>
                ✦ {RARITY_LABELS_ITEM_PT[result.rarity as keyof typeof RARITY_LABELS_ITEM_PT] ?? result.rarity.toUpperCase()} ✦
              </p>

              {/* Ícone */}
              <div style={{
                fontSize: '4rem',
                marginBottom: '0.625rem',
                filter: `drop-shadow(0 0 20px ${rarityResult.color})`,
                animation: 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}>
                {result.item_icon}
              </div>

              {/* Nome */}
              <h3 style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '1.1rem', fontWeight: 900,
                color: rarityResult.color, margin: '0 0 0.375rem',
                textShadow: `0 0 14px ${rarityResult.glow}`,
              }}>
                {result.item_name}
              </h3>

              {/* Tipo */}
              <p style={{
                fontSize: '0.7rem', color: '#666680',
                fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em',
                margin: '0 0 0.5rem',
              }}>
                {TYPE_LABELS[result.item_type] ?? result.item_type.toUpperCase()}
              </p>

              {result.description && (
                <p style={{ fontSize: '0.78rem', color: '#888899', margin: '0 0 0.875rem', lineHeight: 1.5 }}>
                  {result.description}
                </p>
              )}

              {/* Confirmação */}
              <div style={{
                padding: '0.5rem 0.875rem',
                background: 'rgba(0,255,157,0.08)',
                border: '1px solid rgba(0,255,157,0.3)',
                borderRadius: 8,
                fontSize: '0.68rem', color: '#00ff9d',
                fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em',
              }}>
                ✓ ADICIONADO AO INVENTÁRIO
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{
              padding: '0.75rem', marginBottom: '1rem',
              background: 'rgba(255,32,121,0.08)',
              border: '1px solid rgba(255,32,121,0.3)',
              borderRadius: 8, color: '#ff2079',
              fontSize: '0.78rem', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Botão GIRAR */}
          {phase === 'idle' && (
            <button
              onClick={handleOpen}
              style={{
                width: '100%', padding: '1.1rem',
                background: `linear-gradient(135deg, ${r.color}, ${r.color}99)`,
                border: 'none', borderRadius: 14,
                color: '#050505', fontFamily: 'Orbitron, sans-serif',
                fontSize: '1rem', fontWeight: 900, letterSpacing: '0.14em',
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: `0 0 30px ${r.glow}, 0 4px 20px rgba(0,0,0,0.4)`,
              }}
              onMouseEnter={e => {
                const target = e.currentTarget as HTMLButtonElement
                target.style.transform = 'translateY(-3px) scale(1.01)'
                target.style.boxShadow = `0 0 50px ${r.glow}, 0 8px 30px rgba(0,0,0,0.5)`
              }}
              onMouseLeave={e => {
                const target = e.currentTarget as HTMLButtonElement
                target.style.transform = 'translateY(0) scale(1)'
                target.style.boxShadow = `0 0 30px ${r.glow}, 0 4px 20px rgba(0,0,0,0.4)`
              }}
            >
              🎰 GIRAR
            </button>
          )}

          {phase === 'reveal' && (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '0.9rem',
                background: 'transparent',
                border: `1px solid ${rarityResult.color}50`,
                borderRadius: 12,
                color: rarityResult.color,
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.8rem', letterSpacing: '0.1em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const target = e.currentTarget as HTMLButtonElement
                target.style.background = `${rarityResult.color}12`
                target.style.boxShadow = `0 0 20px ${rarityResult.glow}`
              }}
              onMouseLeave={e => {
                const target = e.currentTarget as HTMLButtonElement
                target.style.background = 'transparent'
                target.style.boxShadow = 'none'
              }}
            >
              ✓ FECHAR
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cardIn      { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes scanDown    { from{top:0} to{top:100%} }
        @keyframes pulseGlow   { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes shimmerBar  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes countPulse  { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes bounceIn    { 0%{transform:scale(0.2) rotate(-10deg);opacity:0} 60%{transform:scale(1.2) rotate(3deg)} 80%{transform:scale(0.95)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes revealItem  { from{opacity:0;transform:scale(0.9) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes floatUp     { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-200px) rotate(180deg);opacity:0} }
      `}</style>
    </div>
  )
}
