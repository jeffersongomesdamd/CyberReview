'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Review } from '@/lib/types'
import { Heart, Shuffle, Share2, ExternalLink, Trash2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLevelInfo } from '@/lib/constants'
import { fetchEquippedItems } from '@/lib/hooks/useEquippedItems'
import { ThemeColors } from '@/lib/themeUtils'
import { supabase } from '@/lib/supabaseClient'
import EffectRenderer from './EffectRenderer'

interface Props {
  review: Review
  onLikeToggle?: (id: string, isLiked: boolean) => void
  onClone?: (review: Review) => void
  onDelete?: (id: string) => void
  currentUserId?: string
  currentUserEquipped?: { emoji?: { emoji?: string } | null; reaction_effect?: any | null }
  ownerTheme?: ThemeColors  // NOVO — tema do autor da review
}

export default function ReviewCard({
  review, onLikeToggle, onClone, onDelete,
  currentUserId, currentUserEquipped, ownerTheme
}: Props) {
  const [imgError, setImgError] = useState(false)
  const [authorEquipped, setAuthorEquipped] = useState<any>(null)
  const [likeAnimation, setLikeAnimation] = useState(false)
  const [reactionEmoji, setReactionEmoji] = useState<string | null>(null)
  const [burstParticles, setBurstParticles] = useState<{id:number;x:number;y:number;vx:number;vy:number;color:string;life:number}[]>([])
  const burstId = useRef(0)
  const likeButtonRef = useRef<HTMLButtonElement>(null)
  
  const isLiked = review?.is_liked ?? false

  useEffect(() => {
    if (!review.author_id) return
    fetchEquippedItems(review.author_id).then(setAuthorEquipped)
  }, [review.author_id])

  const reviewId = review?.id
  if (!reviewId) {
    return null
  }

  // Extração defensiva — nunca quebra mesmo se campos faltarem
  const title = review.title ?? 'Sem título'
  const description = review.description ?? null
  const imageUrl = review.image_url ?? null
  const attributes = Array.isArray(review.attributes) ? review.attributes : []
  const likeCount = review.like_count ?? 0
  const cloneCount = review.clone_count ?? 0
  const commentCount = review.comment_count ?? 0

  // profiles pode ser objeto ou null — Supabase JOIN retorna objeto direto
  const authorUsername = (review.profiles as any)?.username ?? 'anônimo'
  const authorAvatar = (review.profiles as any)?.avatar_url ?? null
  const authorXp = (review.profiles as any)?.xp ?? 0
  const authorId = review.author_id

  // Level Info
  const levelInfo = getLevelInfo(authorXp)

  // categories pode ser objeto ou null
  const categoryName = (review.categories as any)?.name ?? null
  const categoryIcon = (review.categories as any)?.icon ?? '🏷️'
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/review/${reviewId}`)
    toast.success('Link copiado!', {
      style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' }
    })
  }

  const triggerReactionEffect = () => {
    const effect = currentUserEquipped?.reaction_effect
    if (!effect) return

    const colors = effect.color
      ? [effect.color, '#ffffff', effect.color]
      : ['#ff2079', '#00f2ff', '#bc13fe', '#ffd700']

    const newParticles = Array.from({ length: effect.effect === 'mega-explosion' ? 20 : effect.effect === 'explosion' ? 12 : 8 }, (_, i) => ({
      id: burstId.current++,
      x: 50, y: 50,  // centro do botão em %
      vx: (Math.random() - 0.5) * 8,
      vy: -(2 + Math.random() * 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }))

    setBurstParticles(newParticles)
    setTimeout(() => setBurstParticles([]), 800)
  }

  const handleLikeClick = () => {
    const isGivingLike = !isLiked
    if (isGivingLike) {
      // Emoji flutuante
      const emoji = currentUserEquipped?.emoji?.emoji ?? '❤️'
      setReactionEmoji(emoji)
      setLikeAnimation(true)
      // Efeito de partículas
      triggerReactionEffect()
      setTimeout(() => {
        setLikeAnimation(false)
        setReactionEmoji(null)
      }, 900)
    }
    onLikeToggle?.(review.id, isLiked)
  }

  const reviewStyleValue = authorEquipped?.review_style?.style
  const reviewStyleIntensity = authorEquipped?.review_style?.intensity
  const reviewStyleColor = authorEquipped?.review_style?.color ?? '#bc13fe'

  const cardTheme = ownerTheme  // só usa quando passado (perfil do dono)

  return (
    <div
      className="cyber-card fade-in"
      style={{
        display: 'flex', flexDirection: 'column',
        background: cardTheme ? cardTheme.card : '#111118',
        border: reviewStyleValue === 'neon-border'
          ? '1px solid rgba(0,242,255,0.6)'
          : reviewStyleValue === 'aura'
          ? `1px solid ${reviewStyleColor}60`
          : reviewStyleValue === 'spotlight'
          ? '1px solid rgba(255,215,0,0.35)'
          : reviewStyleValue === 'ultimate-highlight'
          ? '1px solid rgba(0,242,255,0.5)'
          : reviewStyleValue === 'global-highlight'
          ? '1px solid rgba(0,242,255,0.4)'
          : reviewStyleValue === 'soft-shadow'
          ? '1px solid rgba(255,255,255,0.12)'
          : cardTheme ? `1px solid ${cardTheme.border}`
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: reviewStyleValue === 'neon-border'
          ? '0 0 16px rgba(0,242,255,0.2)'
          : reviewStyleValue === 'aura'
          ? `0 0 24px ${reviewStyleColor}30, 0 0 48px ${reviewStyleColor}10`
          : reviewStyleValue === 'spotlight'
          ? '0 0 30px rgba(255,215,0,0.12)'
          : reviewStyleValue === 'ultimate-highlight'
          ? '0 0 40px rgba(188,19,254,0.2), 0 0 80px rgba(0,242,255,0.1)'
          : reviewStyleValue === 'global-highlight'
          ? '0 0 30px rgba(0,242,255,0.2), 0 0 60px rgba(188,19,254,0.1)'
          : reviewStyleValue === 'soft-shadow'
          ? '0 4px 24px rgba(0,0,0,0.7)'
          : undefined,
        transition: 'all 0.3s ease',
        cursor: 'default',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        if (!reviewStyleValue) {
          el.style.borderColor = 'rgba(0,242,255,0.3)'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,242,255,0.08)'
        } else {
          el.style.transform = 'translateY(-2px)'
          el.style.filter = 'brightness(1.1)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        if (!reviewStyleValue) {
          el.style.borderColor = 'rgba(255,255,255,0.07)'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        } else {
          el.style.transform = 'translateY(0)'
          el.style.filter = 'none'
        }
      }}
    >
      {/* Linha topo para spotlight — amarela */}
      {reviewStyleValue === 'spotlight' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
          zIndex: 3,
        }} />
      )}

      {/* Linha topo para ultimate — RGB animado */}
      {reviewStyleValue === 'ultimate-highlight' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #00f2ff, #bc13fe, #ff2079, #ffd700)',
          backgroundSize: '300% 100%',
          animation: 'bannerHolo 3s linear infinite',
          zIndex: 3,
        }} />
      )}

      {/* Efeito aura / global — glow sutil no card */}
      {(reviewStyleValue === 'aura' || reviewStyleValue === 'global-highlight') && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          boxShadow: `inset 0 0 20px ${reviewStyleValue === 'aura' ? reviewStyleColor : '#00f2ff'}15`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Efeito soft-shadow */}
      {reviewStyleValue === 'soft-shadow' && (
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
          borderRadius: 'inherit', pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Imagem */}
      {imageUrl && !imgError ? (
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, #111118 100%)',
          }} />
          {/* Badge de categoria sobre a imagem */}
          {categoryName && (
            <div style={{
              position: 'absolute', top: '0.75rem', left: '0.75rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'rgba(5,5,5,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,242,255,0.3)',
              borderRadius: 100, padding: '0.2rem 0.65rem',
              fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif',
              color: '#00f2ff', letterSpacing: '0.08em',
            }}>
              {categoryIcon} {categoryName.toUpperCase()}
            </div>
          )}
          {review.cloned_from && (
            <div style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'rgba(188,19,254,0.2)',
              border: '1px solid rgba(188,19,254,0.4)',
              borderRadius: 100, padding: '0.2rem 0.6rem',
              fontSize: '0.6rem', fontFamily: 'Orbitron, sans-serif',
              color: '#bc13fe', letterSpacing: '0.08em',
            }}>
              🔀 CLONE
            </div>
          )}
        </div>
      ) : (
        /* Sem imagem — badges no topo */
        <div style={{
          padding: '0.75rem 1rem 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          {categoryName ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              border: '1px solid rgba(0,242,255,0.25)',
              borderRadius: 100, padding: '0.2rem 0.65rem',
              fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif',
              color: '#00f2ff', letterSpacing: '0.08em',
            }}>
              {categoryIcon} {categoryName.toUpperCase()}
            </div>
          ) : <div />}

          {review.cloned_from && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.6rem', color: '#bc13fe',
              fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em',
            }}>
              🔀 CLONE
            </div>
          )}
        </div>
      )}

      {/* Conteúdo principal */}
      <div style={{
        padding: '1rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: 0,
      }}>

        {/* Título */}
        <Link href={`/review/${reviewId}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#e0e0e0',
            lineHeight: 1.4,
            margin: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00f2ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#e0e0e0')}
          >
            {title}
          </h3>
        </Link>

        {/* Autor + data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href={`/profile/${authorUsername}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}
          >
            <div style={{ position: 'relative', flexShrink: 0, width: 22, height: 22 }}>
              {/* Avatar — sempre visível, z-index 2 */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 700, color: '#050505',
                overflow: 'hidden',
                position: 'relative', zIndex: 2,
              }}>
                {authorAvatar
                  ? <img src={authorAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : authorUsername[0]?.toUpperCase() ?? '?'
                }
              </div>

              {/* Moldura — atrás do avatar, z-index 1 */}
              {authorEquipped?.frame && (
                <div style={{
                  position: 'absolute',
                  inset: -2, borderRadius: '50%', zIndex: 1,
                  pointerEvents: 'none',
                  background: authorEquipped.frame.style === 'holographic'
                    ? 'conic-gradient(#00f2ff, #bc13fe, #ff2079, #ffd700, #00f2ff)'
                    : authorEquipped.frame.style === 'obsidian'
                    ? 'conic-gradient(#1a1a2e, #bc13fe, #1a1a2e)'
                    : authorEquipped.frame.style === 'gold'
                    ? 'conic-gradient(#ffd700, #ff7700, #ffd700)'
                    : authorEquipped.frame.style === 'plasma'
                    ? 'conic-gradient(#bc13fe, #ff2079, #bc13fe)'
                    : authorEquipped.frame.style === 'glass'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))'
                    : `conic-gradient(${authorEquipped.frame.color ?? '#00f2ff'}, transparent, ${authorEquipped.frame.color ?? '#00f2ff'})`,
                  animation: authorEquipped.frame.animated ? 'borderGlow 2s linear infinite' : 'none',
                }} />
              )}

              {/* Badge no canto — z-index 3 */}
              {authorEquipped?.badge && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#0d0d18',
                  border: '1px solid rgba(255,215,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.4rem', zIndex: 3,
                }}>
                  {authorEquipped.badge.badge === 'cyber-god' ? '👾'
                    : authorEquipped.badge.badge === 'specialist' ? '🎖️'
                    : authorEquipped.badge.badge === 'curator' ? '🏅'
                    : '⭐'}
                </div>
              )}
            </div>
            <EffectRenderer
              username={authorUsername}
              effect={authorEquipped?.effect}
              size="sm"
            />
            <div style={{
              background: `${levelInfo.color}15`,
              border: `1px solid ${levelInfo.color}40`,
              borderRadius: 100, padding: '0.1rem 0.35rem',
              color: levelInfo.color, fontSize: '0.55rem',
              fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
              textShadow: `0 0 5px ${levelInfo.glow}`,
              display: 'flex', alignItems: 'center'
            }}>
              NV {levelInfo.level}
            </div>
          </Link>
          <span style={{ color: '#2a2a40', fontSize: '0.68rem', marginLeft: 'auto' }}>
            {new Date(review.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Descrição */}
        {description && (
          <p style={{
            fontSize: '0.78rem',
            color: '#777790',
            lineHeight: 1.55,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        {/* Atributos */}
        {attributes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {attributes.slice(0, 4).map((attr, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.2rem', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#666680' }}>
                    {attr.label}
                  </span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    fontFamily: 'Orbitron, sans-serif',
                    color: attr.value >= 8 ? '#00ff9d' : attr.value >= 5 ? '#00f2ff' : '#ff2079',
                  }}>
                    {attr.value}/10
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 4, height: 5, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(attr.value / 10) * 100}%`,
                    background: 'linear-gradient(90deg, #00f2ff, #bc13fe)',
                    borderRadius: 4,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
            {attributes.length > 4 && (
              <span style={{ fontSize: '0.68rem', color: '#333350' }}>
                +{attributes.length - 4} atributo{attributes.length - 4 > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Ações */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap',
        }}>

          {/* Like */}
          <button
            ref={likeButtonRef}
            onClick={handleLikeClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 6,
              border: `1px solid ${isLiked ? 'rgba(255,32,121,0.5)' : 'rgba(255,255,255,0.07)'}`,
              background: isLiked ? 'rgba(255,32,121,0.1)' : 'transparent',
              color: isLiked ? '#ff2079' : '#555570',
              fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              overflow: 'visible', // CRÍTICO: permite ver as partículas saindo
            }}
          >
            <Heart size={12} fill={isLiked ? '#ff2079' : 'none'} />
            {likeCount}

            {/* Emoji de reação flutuante */}
            {likeAnimation && (
              <span style={{
                position: 'absolute',
                top: -24, left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.2rem',
                animation: 'floatEmoji 0.9s ease forwards',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                {reactionEmoji ?? '❤️'}
              </span>
            )}

            {/* Partículas de explosão */}
            {burstParticles.map(p => (
              <div key={p.id} style={{
                position: 'absolute',
                left: `${p.x}%`, top: `${p.y}%`,
                width: 5, height: 5, borderRadius: '50%',
                background: p.color,
                boxShadow: `0 0 6px ${p.color}`,
                pointerEvents: 'none', zIndex: 20,
                animation: 'burstParticle 0.8s ease-out forwards',
                '--vx': `${p.vx * 8}px`,
                '--vy': `${p.vy * 8}px`,
              } as React.CSSProperties} />
            ))}
          </button>

          {/* Clone */}
          <button
            onClick={() => onClone?.(review)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              color: '#555570',
              fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(188,19,254,0.4)'
              e.currentTarget.style.color = '#bc13fe'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = '#555570'
            }}
          >
            <Shuffle size={12} />
            {cloneCount}
          </button>

          {/* Comentários */}
          <Link
            href={`/review/${reviewId}#comments`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              color: '#555570',
              fontSize: '0.72rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'rgba(0,242,255,0.3)'
              el.style.color = '#00f2ff'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'rgba(255,255,255,0.07)'
              el.style.color = '#555570'
            }}
          >
            <MessageCircle size={12} />
            {commentCount}
          </Link>

          {/* Compartilhar */}
          <button
            onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '0.35rem 0.5rem',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              color: '#555570',
              fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,242,255,0.3)'
              e.currentTarget.style.color = '#00f2ff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = '#555570'
            }}
          >
            <Share2 size={12} />
          </button>

          {/* Delete — só para o autor */}
          {onDelete && currentUserId === authorId && (
            <button
              onClick={() => {
                if (confirm(`Deletar "${title}"?`)) onDelete(review.id)
              }}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0.35rem 0.5rem',
                borderRadius: 6,
                border: '1px solid rgba(255,32,121,0.15)',
                background: 'transparent',
                color: '#ff2079',
                fontSize: '0.72rem', cursor: 'pointer',
                opacity: 0.5,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.background = 'rgba(255,32,121,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '0.5'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Trash2 size={12} />
            </button>
          )}

          {/* Ver review */}
          <Link
            href={`/review/${reviewId}`}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.7rem',
              borderRadius: 6,
              border: '1px solid rgba(0,242,255,0.2)',
              color: '#00f2ff',
              fontSize: '0.65rem',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'rgba(0,242,255,0.08)'
              el.style.boxShadow = '0 0 10px rgba(0,242,255,0.2)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'transparent'
              el.style.boxShadow = 'none'
            }}
          >
            VER <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </div>
  )
}
