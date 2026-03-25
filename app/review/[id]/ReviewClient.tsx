'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Review, Comment } from '@/lib/types'
import Navbar from '@/components/Navbar'
import ReviewModal from '@/components/ReviewModal'
import Link from 'next/link'
import { ArrowLeft, Heart, Shuffle, Share2, Edit3, Trash2, Send, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { LIMITS, getLevelInfo } from '@/lib/constants'
import { useEquippedItems, fetchEquippedItems } from '@/lib/hooks/useEquippedItems'
import { getTheme, getCardFrameStyle, getAvatarFrameStyle } from '@/lib/themeUtils'
import EffectRenderer from '@/components/EffectRenderer'

// Sub-componente para renderizar o autor do comentário com seus efeitos
function CommentAuthor({
  authorId,
  username,
  avatarUrl,
}: {
  authorId: string
  username: string
  avatarUrl: string | null
}) {
  const [eq, setEq] = useState<any>(null)

  useEffect(() => {
    // Carga inicial
    fetchEquippedItems(authorId).then(setEq)

    // Listener Realtime
    const channel = supabase
      .channel(`comment-author-${authorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${authorId}`,
        },
        () => fetchEquippedItems(authorId).then(setEq)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authorId])

  const frameStyle = eq?.frame ? {
    position: 'absolute' as const,
    inset: -2, borderRadius: '50%', zIndex: 1,
    pointerEvents: 'none' as const,
    background:
      eq.frame.style === 'holographic'
        ? 'conic-gradient(#00f2ff,#bc13fe,#ff2079,#ffd700,#00f2ff)'
        : eq.frame.style === 'gold'
        ? 'conic-gradient(#ffd700,#ff7700,#ffd700)'
        : eq.frame.style === 'obsidian'
        ? 'conic-gradient(#1a1a2e,#bc13fe,#1a1a2e)'
        : eq.frame.style === 'plasma'
        ? 'conic-gradient(#bc13fe,#ff2079,#bc13fe)'
        : eq.frame.style === 'glass'
        ? 'linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.05))'
        : `conic-gradient(${eq.frame.color ?? '#00f2ff'},transparent,${eq.frame.color ?? '#00f2ff'})`,
    animation: eq.frame.animated ? 'borderGlow 2s linear infinite' : 'none',
  } : null

  const avatarBackground = eq?.color?.gradient
    ? `linear-gradient(135deg, ${eq.color.gradient[0]}, ${eq.color.gradient[1]})`
    : eq?.color?.hex
    ? eq.color.hex
    : 'linear-gradient(135deg, #00f2ff, #bc13fe)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        {frameStyle && <div style={frameStyle} />}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: avatarBackground,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 700, color: '#050505',
          overflow: 'hidden', position: 'relative', zIndex: 2,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : username[0]?.toUpperCase() ?? '?'
          }
        </div>
      </div>
      <EffectRenderer
        effect={eq?.effect ?? null}
        username={username}
        size="sm"
      />
    </div>
  )
}

export default function ReviewClient() {
  const params = useParams()
  const idRaw = params?.id
  const id = typeof idRaw === 'string' ? idRaw : Array.isArray(idRaw) ? idRaw[0] : null

  const { user } = useAuth()
  const router = useRouter()

  const [review, setReview] = useState<Review | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [cloneModalOpen, setCloneModalOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [likeAnimation, setLikeAnimation] = useState(false)
  
  // Perfil e equipados do autor da review
  const [authorEquipped, setAuthorEquipped] = useState<any>(null)
  const [authorProfile, setAuthorProfile]   = useState<any>(null)
  
  // Meus próprios equipados (para emoji de curtida, etc)
  const { equipped: myEquipped } = useEquippedItems(user?.id ?? null)

  const commentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      loadReview()
      loadComments()
      loadCategories()
    }
  }, [id, user])

  const loadReview = async () => {

    if (!id || typeof id !== 'string') {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_author_id_fkey(*), categories(*)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      setLoading(false)
      return
    }

    setReview(data)

    if (user) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('review_id', id)
        .maybeSingle()
      setIsLiked(!!likeData)
    }

    setLoading(false)
  }

  const loadAuthorData = async (authorId: string) => {
    const [eq, profileRes] = await Promise.all([
      fetchEquippedItems(authorId),
      supabase
        .from('profiles')
        .select('xp, level, username, avatar_url')
        .eq('id', authorId)
        .single()
    ])
    setAuthorEquipped(eq)
    if (profileRes.data) setAuthorProfile(profileRes.data)
  }

  useEffect(() => {
    if (!review?.author_id) return

    loadAuthorData(review.author_id)

    // Listener: recarrega quando o autor equipa algo
    const channel = supabase
      .channel(`review-author-equipped-${review.author_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${review.author_id}`,
        },
        () => loadAuthorData(review.author_id)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [review?.author_id])

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('review_id', id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  const handleLike = async () => {
    if (!user || !review) return
    const newLiked = !isLiked
    
    // Animação
    if (newLiked) {
      setLikeAnimation(true)
      setTimeout(() => setLikeAnimation(false), 800)
    }

    setIsLiked(newLiked)
    setReview(prev => prev ? { ...prev, like_count: prev.like_count + (newLiked ? 1 : -1) } : prev)

    if (newLiked) {
      await supabase.from('likes').insert({ user_id: user.id, review_id: review.id })
    } else {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', review.id)
    }
  }

  const handleDelete = async () => {
    if (!review || !confirm(`Deletar "${review.title}"?`)) return
    await supabase.from('reviews').delete().eq('id', review.id)
    toast.success('Review deletada.')
    router.push('/')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copiado!', { style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' } })
  }

  const handleSendComment = async () => {
    if (!user || !commentText.trim() || !review) return
    
    if (commentText.trim().length > LIMITS.COMMENT_MAX) {
      toast.error(`Comentário muito longo (máx. ${LIMITS.COMMENT_MAX} caracteres)`)
      return
    }

    setSendingComment(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ review_id: review.id, author_id: user.id, content: commentText.trim() })
      .select('*, profiles(*)')
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
      toast.success('Comentário enviado!', { style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' } })
    }
    setSendingComment(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const isOwner = user?.id === review?.author_id
  const attributes = Array.isArray(review?.attributes) ? review.attributes : []
  const authorUsername = (review?.profiles as any)?.username ?? 'anônimo'
  const authorAvatar = (review?.profiles as any)?.avatar_url ?? null
  const categoryName = (review?.categories as any)?.name ?? null
  const categoryIcon = (review?.categories as any)?.icon ?? '🏷️'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505' }}>
        <Navbar />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
          {[1, 0.6, 0.8, 0.4].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: i === 0 ? 32 : 16, width: `${w * 100}%`, marginBottom: '1rem', borderRadius: 8 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff2079', fontSize: '1.25rem' }}>REVIEW NÃO ENCONTRADA</h2>
          <button onClick={() => router.push('/')} style={{
            padding: '0.5rem 1.25rem', background: 'transparent',
            border: '1px solid rgba(0,242,255,0.3)', borderRadius: 8,
            color: '#00f2ff', fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.08em',
          }}>← VOLTAR</button>
        </div>
      </div>
    )
  }

  const authorLevelInfo = getLevelInfo(authorProfile?.xp ?? 0)
  const reviewPageTheme = getTheme(authorEquipped, authorLevelInfo.color)

  return (
    <div style={{
      minHeight: '100vh',
      background: reviewPageTheme.bg,
      fontFamily: 'Inter, sans-serif',
      transition: 'background 0.5s ease',
    }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Voltar */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'transparent', border: 'none',
            color: '#555570', fontSize: '0.75rem',
            fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
            cursor: 'pointer', marginBottom: '1.5rem', padding: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#00f2ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#555570'}
        >
          <ArrowLeft size={14} /> VOLTAR
        </button>

        {/* Card principal */}
        <div style={{
          background: reviewPageTheme.surface,
          border: '1px solid rgba(255,255,255,0.06)', // Base border subtle
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: '1.5rem',
          position: 'relative',
          // Aplicar moldura sem afetar o padding/layout interno
          boxShadow: getCardFrameStyle(authorEquipped?.frame).boxShadow,
        }}>
          {/* O frame agora é uma borda absoluta para não afetar o conteúdo/foto */}
          {authorEquipped?.frame?.style && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16, border: getCardFrameStyle(authorEquipped.frame).border,
              pointerEvents: 'none', zIndex: 10,
            }} />
          )}

          {/* Efeitos especiais da moldura do autor na review */}
          {authorEquipped?.frame?.style === 'holographic' && (
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 18, zIndex: -1,
              background: 'conic-gradient(#00f2ff,#bc13fe,#ff2079,#ffd700,#00ff9d,#00f2ff)',
              animation: 'borderGlow 3s linear infinite',
              opacity: 0.9, pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', inset: 2, borderRadius: 16, background: reviewPageTheme.surface }} />
            </div>
          )}

          {authorEquipped?.frame?.style === 'legendary' && (
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 18, zIndex: -1,
              background: 'conic-gradient(#ffd700,#ff7700,#bc13fe,#00f2ff,#ffd700)',
              animation: 'borderGlow 2s linear infinite',
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', inset: 2, borderRadius: 16, background: reviewPageTheme.surface }} />
            </div>
          )}

          {/* Partículas flutuantes se a moldura permitir */}
          {authorEquipped?.frame?.particles && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: 6, height: 6, borderRadius: '50%',
                  background: ['#ffd700','#bc13fe','#00f2ff'][i % 3],
                  boxShadow: `0 0 8px ${['#ffd700','#bc13fe','#00f2ff'][i % 3]}`,
                  left: `${15 + i * 15}%`, top: '-4px',
                  animation: `floatParticle ${2 + i * 0.5}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          )}

          {/* Linha de acento oculta quando houver moldura equipada */}
          {!authorEquipped?.frame?.style && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${reviewPageTheme.primary}, ${reviewPageTheme.secondary})`,
              zIndex: 1,
            }} />
          )}

          {/* Imagem */}
          {review.image_url && (
            <div style={{ position: 'relative', maxHeight: 360, overflow: 'hidden' }}>
              <img
                src={review.image_url}
                alt={review.title}
                style={{ width: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, #0d0d18 100%)',
              }} />
            </div>
          )}

          <div style={{ padding: '1.75rem' }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {categoryName && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  border: '1px solid rgba(0,242,255,0.3)', borderRadius: 100,
                  padding: '0.25rem 0.75rem', fontSize: '0.65rem',
                  fontFamily: 'Orbitron, sans-serif', color: '#00f2ff', letterSpacing: '0.08em',
                }}>
                  {categoryIcon} {categoryName.toUpperCase()}
                </div>
              )}
              {review.cloned_from && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  border: '1px solid rgba(188,19,254,0.3)', borderRadius: 100,
                  padding: '0.25rem 0.75rem', fontSize: '0.65rem',
                  fontFamily: 'Orbitron, sans-serif', color: '#bc13fe', letterSpacing: '0.08em',
                }}>
                  🔀 CLONE
                </div>
              )}
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(1.2rem, 3vw, 1.75rem)',
              fontWeight: 900,
              color: '#e0e0e0',
              lineHeight: 1.3,
              marginBottom: '0.75rem',
            }}>
              {review.title}
            </h1>

            {/* Autor */}
            <Link href={`/profile/${review.author_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                {/* Moldura do Avatar removida (o item "moldura" agora é exclusivo do card) */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: authorEquipped?.color?.gradient
                    ? `linear-gradient(135deg, ${authorEquipped.color.gradient[0]}, ${authorEquipped.color.gradient[1]})`
                    : authorEquipped?.color?.hex
                    ? authorEquipped.color.hex
                    : 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#050505',
                  overflow: 'hidden', position: 'relative', zIndex: 2,
                }}>
                  {authorAvatar
                    ? <img src={authorAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : authorUsername[0]?.toUpperCase()
                  }
                </div>
              </div>

              <EffectRenderer
                effect={authorEquipped?.effect ?? null}
                username={authorUsername}
                size="md"
              />
              <span style={{ color: '#2a2a40', fontSize: '0.72rem' }}>
                {new Date(review.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </Link>

            {/* Descrição */}
            {review.description && (
              <p style={{ color: '#888899', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {review.description}
              </p>
            )}

            {/* Atributos */}
            {attributes.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
              }}>
                <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', color: '#444466', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                  AVALIAÇÃO
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {attributes.map((attr, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#aaaabc' }}>{attr.label}</span>
                        <span style={{
                          fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 700,
                          color: attr.value >= 8 ? '#00ff9d' : attr.value >= 5 ? '#00f2ff' : '#ff2079',
                        }}>
                          {attr.value}<span style={{ fontSize: '0.65rem', opacity: 0.5 }}>/10</span>
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(attr.value / 10) * 100}%`,
                          background: attr.value >= 8
                            ? 'linear-gradient(90deg, #00f2ff, #00ff9d)'
                            : attr.value >= 5
                            ? 'linear-gradient(90deg, #00f2ff, #bc13fe)'
                            : 'linear-gradient(90deg, #bc13fe, #ff2079)',
                          borderRadius: 4,
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Média geral */}
                {attributes.length > 1 && (
                  <div style={{
                    marginTop: '1.25rem', paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', color: '#444466', letterSpacing: '0.1em' }}>
                      MÉDIA GERAL
                    </span>
                    <span style={{
                      fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem', fontWeight: 900,
                      background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {(attributes.reduce((s, a) => s + a.value, 0) / attributes.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={handleLike} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem',
                background: isLiked ? 'rgba(255,32,121,0.1)' : 'transparent',
                border: `1px solid ${isLiked ? 'rgba(255,32,121,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, color: isLiked ? '#ff2079' : '#666680',
                fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                position: 'relative',
              }}>
                <Heart size={15} fill={isLiked ? '#ff2079' : 'none'} />
                {review.like_count} curtidas

                    {/* Emoji de reação flutuante */}
                    {likeAnimation && (
                      <span style={{
                        position: 'absolute',
                        top: -24, left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '1.4rem',
                        animation: 'floatEmoji 0.8s ease forwards',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}>
                        {myEquipped?.emoji?.emoji ?? '❤️'}
                      </span>
                    )}
              </button>

              <button onClick={() => setCloneModalOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(188,19,254,0.25)',
                borderRadius: 8, color: '#bc13fe',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem', letterSpacing: '0.06em',
              }}>
                <Shuffle size={14} /> CLONAR
              </button>

              <button onClick={handleShare} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#555570',
                fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <Share2 size={14} />
              </button>

              <button
                onClick={() => commentInputRef.current?.focus()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#555570',
                  fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <MessageCircle size={14} /> {comments.length}
              </button>

              {isOwner && (
                <>
                  <button onClick={() => setEditModalOpen(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.55rem 1rem',
                    background: 'rgba(0,242,255,0.05)',
                    border: '1px solid rgba(0,242,255,0.2)',
                    borderRadius: 8, color: '#00f2ff',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem',
                    letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <Edit3 size={13} /> EDITAR
                  </button>

                  <button onClick={handleDelete} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.55rem 1rem',
                    background: 'rgba(255,32,121,0.05)',
                    border: '1px solid rgba(255,32,121,0.2)',
                    borderRadius: 8, color: '#ff2079',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem',
                    letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <Trash2 size={13} /> DELETAR
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Seção de comentários */}
        <div style={{
          background: reviewPageTheme.surface,
          border: `1px solid ${reviewPageTheme.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${reviewPageTheme.border}`,
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <MessageCircle size={16} color={reviewPageTheme.primary} />
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem',
              color: reviewPageTheme.primary, letterSpacing: '0.1em', margin: 0,
            }}>
              COMENTÁRIOS ({comments.length})
            </h2>
          </div>

          {/* Lista de comentários */}
          <div style={{ padding: '0.75rem 1.5rem' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#333350' }}>
                <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
                {comments.map(comment => {
                  const cAuthor = (comment.profiles as any)
                  const isCommentOwner = user?.id === comment.author_id
                  return (
                    <div key={comment.id} style={{
                      display: 'flex', gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,242,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CommentAuthor
                              authorId={comment.author_id}
                              username={cAuthor?.username ?? 'anônimo'}
                              avatarUrl={cAuthor?.avatar_url ?? null}
                            />
                            <span style={{ color: '#2a2a40', fontSize: '0.68rem' }}>
                              {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {isCommentOwner && (
                            <button onClick={() => handleDeleteComment(comment.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#333350', padding: '0.2rem', transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ff2079')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#333350')}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#aaaabc', lineHeight: 1.55, margin: 0 }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Input de comentário */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              {user ? (
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                  <input
                    ref={commentInputRef}
                    maxLength={LIMITS.COMMENT_MAX}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                    placeholder="Escreva um comentário... (Enter para enviar)"
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, color: '#e0e0e0',
                      padding: '0.625rem 0.875rem',
                      fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                      outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#00f2ff'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,242,255,0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={sendingComment || !commentText.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: commentText.trim()
                        ? 'linear-gradient(135deg, #00f2ff, #bc13fe)'
                        : 'rgba(255,255,255,0.05)',
                      border: 'none', cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Send size={16} color={commentText.trim() ? '#050505' : '#333350'} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Link href="/auth" style={{
                    color: '#00f2ff', fontSize: '0.8rem', textDecoration: 'none',
                    fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em',
                  }}>
                    Faça login para comentar →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {editModalOpen && (
        <ReviewModal
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => { setEditModalOpen(false); loadReview() }}
          categories={categories}
          editSource={review}
        />
      )}

      {/* Modal de clone */}
      {cloneModalOpen && (
        <ReviewModal
          onClose={() => setCloneModalOpen(false)}
          onSuccess={() => { setCloneModalOpen(false); router.push('/') }}
          categories={categories}
          cloneSource={review}
        />
      )}
    </div>
  )
}
