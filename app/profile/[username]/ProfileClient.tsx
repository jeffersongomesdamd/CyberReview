'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Profile, Review, FriendStatus, Category } from '@/lib/types'
import ReviewCard from '@/components/ReviewCard'
import ReviewModal from '@/components/ReviewModal'
import Navbar from '@/components/Navbar'
import { UserPlus, Clock, Edit3, Check, X, Camera, Calendar, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { LIMITS, getLevelInfo } from '@/lib/constants'
import CyberGodBadge from '@/components/CyberGodBadge'
import ProfileInventory from '@/components/ProfileInventory'
import { useEquippedItems, fetchEquippedItems, EMPTY_EQUIPPED, EquippedItems } from '@/lib/hooks/useEquippedItems'
import { getTheme, getCardFrameStyle, getAvatarFrameStyle } from '@/lib/themeUtils'
import EffectRenderer from '@/components/EffectRenderer'

function getBannerStyle(banner: any): React.CSSProperties {
  if (!banner?.style) return {}
  
  const styles: Record<string, React.CSSProperties> = {
    'gradient-light': {
      background: 'linear-gradient(135deg, rgba(0,242,255,0.25), rgba(188,19,254,0.25))',
    },
    'pulse-glow': {
      background: 'radial-gradient(ellipse at 50% 50%, rgba(0,242,255,0.3), transparent 70%)',
      animation: 'bannerPulse 3s ease infinite',
    },
    'holographic-animated': {
      background: 'linear-gradient(135deg, #00f2ff, #bc13fe, #ff2079, #ffd700, #00ff9d, #00f2ff)',
      backgroundSize: '400% 400%',
      animation: 'bannerHolo 4s linear infinite',
    },
    'void-dark': {
      background: 'radial-gradient(ellipse at 20% 50%, rgba(102,0,204,0.6), transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(188,19,254,0.3), transparent 50%)',
    },
    'galaxy-stars': {
      background: `
        radial-gradient(ellipse at 30% 40%, rgba(188,19,254,0.5), transparent 50%),
        radial-gradient(ellipse at 70% 60%, rgba(0,100,255,0.4), transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(255,32,121,0.2), transparent 30%)
      `,
    },
    'cyber-grid': {
      background: '#020210',
      backgroundImage: `
        repeating-linear-gradient(0deg, rgba(0,242,255,0.07) 0px, transparent 1px, transparent 60px, rgba(0,242,255,0.07) 61px),
        repeating-linear-gradient(90deg, rgba(0,242,255,0.07) 0px, transparent 1px, transparent 60px, rgba(0,242,255,0.07) 61px),
        radial-gradient(circle at 50% 50%, rgba(0,242,255,0.12), transparent 60%)
      `,
    },
    'cyber-grid-epic': {
      background: '#010118',
      backgroundImage: `
        repeating-linear-gradient(0deg,  rgba(0,242,255,0.1) 0px, transparent 1px, transparent 40px, rgba(0,242,255,0.1) 41px),
        repeating-linear-gradient(90deg, rgba(0,242,255,0.1) 0px, transparent 1px, transparent 40px, rgba(0,242,255,0.1) 41px),
        repeating-linear-gradient(45deg, rgba(188,19,254,0.06) 0px, transparent 1px, transparent 56px, rgba(188,19,254,0.06) 57px),
        radial-gradient(circle at 20% 50%, rgba(0,242,255,0.15), transparent 30%),
        radial-gradient(circle at 80% 50%, rgba(188,19,254,0.15), transparent 30%)
      `,
      animation: 'bannerPulse 4s ease infinite',
    },
    'matrix-rain': {
      background: 'linear-gradient(180deg, rgba(0,20,0,0.9), rgba(0,40,10,0.95))',
      backgroundImage: `
        repeating-linear-gradient(
          180deg,
          transparent 0px,
          transparent 18px,
          rgba(0,255,70,0.06) 18px,
          rgba(0,255,70,0.06) 19px
        )
      `,
    },
    'plasma-waves': {
      background: `
        radial-gradient(ellipse at 0% 50%, rgba(188,19,254,0.4), transparent 50%),
        radial-gradient(ellipse at 100% 50%, rgba(0,242,255,0.4), transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(255,32,121,0.3), transparent 50%)
      `,
      animation: 'bannerPlasma 6s ease infinite',
    },
    'circuit-board': {
      background: '#030318',
      backgroundImage: `
        linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px),
        radial-gradient(circle at 15% 35%, rgba(0,242,255,0.2), transparent 15%),
        radial-gradient(circle at 85% 65%, rgba(188,19,254,0.2), transparent 15%),
        radial-gradient(circle at 50% 15%, rgba(0,255,157,0.15), transparent 10%)
      `,
      backgroundSize: '25px 25px, 25px 25px, 100% 100%, 100% 100%, 100% 100%',
    },
    'aurora-borealis': {
      background: `
        linear-gradient(180deg, transparent 40%, rgba(0,255,157,0.2) 60%, rgba(0,242,255,0.15) 80%, rgba(188,19,254,0.1) 100%),
        linear-gradient(135deg, rgba(0,80,40,0.3), rgba(0,20,60,0.4))
      `,
      animation: 'bannerAurora 8s ease infinite',
    },
    'laser-grid': {
      background: '#000510',
      backgroundImage: `
        repeating-linear-gradient(45deg, rgba(0,242,255,0.08) 0px, transparent 1px, transparent 20px, rgba(0,242,255,0.08) 21px),
        repeating-linear-gradient(-45deg, rgba(188,19,254,0.08) 0px, transparent 1px, transparent 20px, rgba(188,19,254,0.08) 21px)
      `,
    },
    'glitch': {
      background: 'linear-gradient(135deg, rgba(0,242,255,0.15), rgba(188,19,254,0.15))',
      animation: 'bannerGlitch 4s step-end infinite',
    },
    'cyber-city': {
      background: `
        linear-gradient(180deg, transparent 0%, rgba(0,242,255,0.08) 60%, rgba(0,242,255,0.2) 100%),
        linear-gradient(180deg, rgba(5,5,20,0.8), rgba(0,10,30,0.9))
      `,
      backgroundImage: `
        linear-gradient(180deg, transparent 0%, rgba(0,242,255,0.08) 60%, rgba(0,242,255,0.2) 100%),
        repeating-linear-gradient(90deg, rgba(0,242,255,0.04) 0px, transparent 1px, transparent 20px)
      `,
    },
    'prestige': {
      background: `
        radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.5), transparent 60%),
        radial-gradient(ellipse at 20% 100%, rgba(255,119,0,0.3), transparent 40%),
        radial-gradient(ellipse at 80% 100%, rgba(255,215,0,0.3), transparent 40%),
        linear-gradient(180deg, rgba(20,15,0,0.8), rgba(40,30,0,0.9))
      `,
      animation: 'bannerPrestige 4s ease infinite',
    },
    'vaporwave': {
      background: `
        linear-gradient(180deg, rgba(188,19,254,0.4) 0%, rgba(255,32,121,0.3) 50%, rgba(0,242,255,0.2) 100%),
        repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,32,121,0.05) 20px, rgba(255,32,121,0.05) 21px)
      `,
    },
    'singularity': {
      background: `
        radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 0%, rgba(102,0,204,0.4) 40%, rgba(0,242,255,0.2) 70%, transparent 100%)
      `,
      animation: 'bannerSingularity 6s linear infinite',
    },
  }

  return styles[banner.style] ?? {}
}

export default function ProfileClient() {
  const { username } = useParams<{ username: string }>()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const isOwner = user?.id === profile?.id
  const [reviews, setReviews] = useState<Review[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [showAllFriends, setShowAllFriends] = useState(false)
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cloneSource, setCloneSource] = useState<Review | null>(null)
  
  const [profileCategoryFilter, setProfileCategoryFilter] = useState<string>('all')

  const FRIENDS_PREVIEW = 8
  const displayedFriends = showAllFriends ? friends : friends.slice(0, FRIENDS_PREVIEW)
  const [modalOpen, setModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [equipped, setEquipped] = useState<EquippedItems>(EMPTY_EQUIPPED)
  const { equipped: loggedInEquipped } = useEquippedItems(user?.id ?? null)

  const loadEquipped = async (targetId: string) => {
    const eq = await fetchEquippedItems(targetId)
    setEquipped(eq)
  }

  useEffect(() => {
    if (!profile?.id) return
    loadEquipped(profile.id)

    // Removed realtime channel to prevent freezing
  }, [profile?.id])

  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!username) return
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 15000)

    loadAll(signal).finally(() => clearTimeout(timeoutId))

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [username, user?.id])

  const loadAll = async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*').eq('username', username)
      if (signal) query = (query as any).abortSignal(signal)
      const { data: profileData } = await query.maybeSingle()
      
      if (profileData) {
        setProfile(profileData)
        setEditUsername(profileData.username)
        setEditBio(profileData.bio ?? '')
        
        await Promise.all([
          loadReviews(profileData.id, signal),
          loadFriendStatus(profileData.id, signal),
          loadFriends(profileData.id, signal),
          loadCategories(signal),
        ])
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      toast.error('Erro ao carregar os dados do perfil.', { style: { background: '#111118', color: '#ff2079', border: '1px solid rgba(255,32,121,0.3)' } })
    } finally {
      if (signal && !signal.aborted) {
        setLoading(false)
      }
    }
  }

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
    if (data) {
      setProfile(data)
      setEditUsername(data.username)
      setEditBio(data.bio ?? '')
    }
  }

  const loadReviews = async (targetId: string, signal?: AbortSignal) => {
    let query = supabase
      .from('reviews')
      .select('*, profiles!reviews_author_id_fkey(*), categories(*)')
      .eq('author_id', targetId)
      .order('created_at', { ascending: false })
      
    if (signal) query = (query as any).abortSignal(signal)
    
    const { data } = await query
    if (data) setReviews(data)
  }

  const loadFriends = async (targetId: string, signal?: AbortSignal) => {
    let query = supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
      
    if (signal) query = (query as any).abortSignal(signal)
    
    const { data } = await query
    if (data) {
      const friendIds = data.map(f => f.requester_id === targetId ? f.addressee_id : f.requester_id)
      if (friendIds.length > 0) {
        let profileQuery = supabase.from('profiles').select('*').in('id', friendIds)
        if (signal) profileQuery = (profileQuery as any).abortSignal(signal)
        const { data: profilesData } = await profileQuery
        if (profilesData) setFriends(profilesData)
      }
    }
  }

  const loadCategories = async (signal?: AbortSignal) => {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name')
    if (signal) query = (query as any).abortSignal(signal)
    const { data } = await query
    if (data) setCategories(data)
  }

  const loadFriendStatus = async (targetId: string, signal?: AbortSignal) => {
    if (!user || user.id === targetId) return
    let query = supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
      
    if (signal) query = (query as any).abortSignal(signal)
    
    const { data } = await query.maybeSingle()
    if (!data) { setFriendStatus('none'); return }
    setFriendshipId(data.id)
    if (data.status === 'accepted') setFriendStatus('accepted')
    else if (data.requester_id === user.id) setFriendStatus('pending_sent')
    else setFriendStatus('pending_received')
  }

  const handleAddFriend = async () => {
    if (!user || !profile) { router.push('/auth'); return }
    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: profile.id })
      .select().single()
    if (error) { toast.error('Erro ao enviar pedido'); return }
    setFriendshipId(data.id)
    setFriendStatus('pending_sent')
    toast.success('Pedido de amizade enviado!', { style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' } })
  }

  const handleAcceptFriend = async () => {
    if (!friendshipId) return
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    setFriendStatus('accepted')
    toast.success('Amizade aceita!', { style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' } })
  }

  const handleRemoveFriend = async () => {
    if (!friendshipId) return
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendStatus('none')
    setFriendshipId(null)
    toast.success('Amizade removida.')
  }

  const handleSaveProfile = async () => {
    if (!user) return
    if (editUsername.trim().length < LIMITS.USERNAME_MIN) {
      toast.error(`Username muito curto (mín. ${LIMITS.USERNAME_MIN} caracteres)`)
      return
    }
    if (editUsername.trim().length > LIMITS.USERNAME_MAX) {
      toast.error(`Username muito longo (máx. ${LIMITS.USERNAME_MAX} caracteres)`)
      return
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(editUsername.trim())) {
      toast.error('Username contém caracteres inválidos')
      return
    }
    if (editBio.length > LIMITS.BIO_MAX) {
      toast.error(`Bio muito longa (máx. ${LIMITS.BIO_MAX} caracteres)`)
      return
    }

    // Antes de fazer o UPDATE, verificar unicidade:
    if (editUsername.trim() !== profile.username) {
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', editUsername.trim())
        .neq('id', user.id)
        .maybeSingle()

      if (taken) {
        toast.error('Este nickname já está em uso.', {
          style: { background: '#111118', color: '#ff2079', border: '1px solid rgba(255,32,121,0.3)' }
        })
        setEditLoading(false)
        return
      }
    }
    
    setEditLoading(true)
    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (avatarFile) {
        const path = `avatars/${user.id}-${Date.now()}`
        const { error: upErr } = await supabase.storage.from('review-images').upload(path, avatarFile, { upsert: true })
        if (!upErr) {
          const { data } = supabase.storage.from('review-images').getPublicUrl(path)
          avatarUrl = data.publicUrl
        }
      }
      const { error } = await supabase.from('profiles').update({
        username: editUsername.trim(),
        bio: editBio.trim() || null,
        avatar_url: avatarUrl,
      }).eq('id', user.id)
      if (error) throw error
      
      const newUsername = editUsername.trim()
      if (newUsername !== username) {
        router.push(`/profile/${newUsername}`)
      } else {
        await loadProfile()
        await refreshProfile()
      }
      setEditMode(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Perfil atualizado!', { style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' } })
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar')
    } finally {
      setEditLoading(false)
    }
  }

  const handleLikeToggle = async (reviewId: string, isLiked: boolean) => {
    if (!user) return
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, is_liked: !isLiked, like_count: r.like_count + (isLiked ? -1 : 1) } : r
    ))
    if (isLiked) await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', reviewId)
    else await supabase.from('likes').insert({ user_id: user.id, review_id: reviewId })
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Tem certeza que quer deletar esta review?')) return
    await supabase.from('reviews').delete().eq('id', reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    toast.success('Review deletada.')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505' }}>
        <Navbar />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton" style={{ height: 24, width: '40%' }} />
              <div className="skeleton" style={{ height: 14, width: '60%' }} />
              <div className="skeleton" style={{ height: 14, width: '30%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff2079' }}>PERFIL NÃO ENCONTRADO</h2>
          <button className="btn-ghost" onClick={() => router.push('/')}>← VOLTAR</button>
        </div>
      </div>
    )
  }

  const avatarLetter = (profile.username?.[0] ?? '?').toUpperCase()
  const authorLevelInfo = getLevelInfo(profile.xp ?? 0)
  const profileTheme = getTheme(equipped, authorLevelInfo.color)

  return (
    <div style={{
      minHeight: '100vh',
      background: profileTheme.bg,
      color: profileTheme.text,
      fontFamily: 'Inter, sans-serif',
      transition: 'background 0.5s ease',
    }}>
      <Navbar onNewReview={isOwner ? () => setModalOpen(true) : undefined} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Profile header */}
        <div style={{
          background: profileTheme.surface,
          borderRadius: 16,
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 2,
          transition: 'border 0.5s ease, box-shadow 0.5s ease',
          // Quando espectral, a borda vem do div acima — não do próprio card:
          ...(equipped.frame?.style === 'spectral'
            ? { border: 'none', boxShadow: '0 0 30px rgba(0,242,255,0.15), 0 0 60px rgba(188,19,254,0.1)' }
            : getCardFrameStyle(equipped.frame)
          ),
        }}>
          {/* Frame overlay - doesn't affect internal padding/layout */}
          {equipped.frame?.style && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16, border: getCardFrameStyle(equipped.frame).border,
              pointerEvents: 'none', zIndex: 10,
            }} />
          )}
          {/* Efeito holográfico animado na borda */}
          {equipped.frame?.style === 'holographic' && (
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 18, zIndex: -1,
              background: 'conic-gradient(#00f2ff,#bc13fe,#ff2079,#ffd700,#00ff9d,#00f2ff)',
              animation: 'borderGlow 3s linear infinite',
              opacity: 0.9,
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', inset: 2, borderRadius: 16,
                background: profileTheme.surface,
              }} />
            </div>
          )}

          {/* Efeito lendário */}
          {equipped.frame?.style === 'legendary' && (
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 18, zIndex: -1,
              background: 'conic-gradient(#ffd700,#ff7700,#bc13fe,#00f2ff,#ffd700)',
              animation: 'borderGlow 2s linear infinite',
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', inset: 2, borderRadius: 16,
                background: profileTheme.surface,
              }} />
            </div>
          )}

          {/* Partículas da moldura lendária */}
          {equipped.frame?.particles && (
            <div style={{ position:'absolute', inset:0, borderRadius:16, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const positions = [
                  { left:'10%', top:'-4px' }, { left:'30%', top:'-4px' },
                  { left:'60%', top:'-4px' }, { left:'85%', top:'-4px' },
                  { right:'-4px', top:'30%' }, { right:'-4px', top:'70%' },
                  { left:'20%', bottom:'-4px' }, { left:'70%', bottom:'-4px' },
                ]
                const colors = ['#ffd700','#ff7700','#bc13fe','#00f2ff']
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 6, height: 6, borderRadius: '50%',
                    background: colors[i % colors.length],
                    boxShadow: `0 0 8px ${colors[i % colors.length]}`,
                    ...positions[i],
                    animation: `floatParticle ${1.5 + i * 0.25}s ease-in-out infinite`,
                    animationDelay: `${-i * 0.3}s`,
                  }} />
                )
              })}
            </div>
          )}

          {/* Top gradient line - oculta quando houver moldura */}
          {!equipped.frame?.style && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${profileTheme.primary}, ${profileTheme.secondary})`,
            }} />
          )}

          {/* Banner de fundo */}
          {equipped.profile_banner && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16,
              pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
              opacity: 0.6,
              ...getBannerStyle(equipped.profile_banner),
            }} />
          )}

          {/* Moldura Espectral — épica, borda cônica simples */}
          {equipped.frame?.style === 'spectral' && (
            <div style={{
              position: 'absolute', inset: -1, borderRadius: 17,
              padding: 2,
              background: 'conic-gradient(from 0deg, #00f2ff, #bc13fe, #ff2079, #ffd700, #00ff9d, #00f2ff)',
              animation: 'borderGlow 4s linear infinite',
              zIndex: -1, pointerEvents: 'none',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: 15,
                background: profileTheme.surface,
              }} />
            </div>
          )}

          {/* Moldura Singularity — lendária, muito mais elaborada */}
          {equipped.frame?.style === 'singularity-frame' && (
            <>
              {/* Camada 1: borda RGB rotativa dupla */}
              <div style={{
                position: 'absolute', inset: -2, borderRadius: 18,
                padding: 2,
                background: 'conic-gradient(from 0deg, #00f2ff, #bc13fe, #ff2079, #ffd700, #00ff9d, #ffffff, #00f2ff)',
                animation: 'borderGlow 3s linear infinite',
                zIndex: -1, pointerEvents: 'none',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: 16,
                  background: profileTheme.surface,
                }} />
              </div>

              {/* Camada 2: glow externo multi-cor pulsante */}
              <div style={{
                position: 'absolute', inset: -6, borderRadius: 22,
                background: 'transparent',
                boxShadow: '0 0 20px rgba(0,242,255,0.5), 0 0 40px rgba(188,19,254,0.3), 0 0 80px rgba(255,32,121,0.2)',
                animation: 'singularityFrame 4s ease infinite',
                zIndex: -2, pointerEvents: 'none',
              }} />

              {/* Camada 3: partículas orbitando os 4 cantos */}
              {Array.from({ length: 12 }).map((_, i) => {
                const colors = ['#00f2ff','#bc13fe','#ff2079','#ffd700','#00ff9d','#ffffff']
                const color  = colors[i % colors.length]
                // Distribuir ao longo das 4 bordas
                const side   = Math.floor(i / 3) // 0=top 1=right 2=bottom 3=left
                const pos    = (i % 3) * 33 + 16 // 16%, 49%, 82%
                const posStyle: React.CSSProperties =
                  side === 0 ? { top: -3,    left: `${pos}%` } :
                  side === 1 ? { right: -3,  top:  `${pos}%` } :
                  side === 2 ? { bottom: -3, left: `${pos}%` } :
                               { left: -3,   top:  `${pos}%` }
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
                    ...posStyle,
                    animation: `particlePulse ${1.2 + i * 0.15}s ease-in-out infinite`,
                    animationDelay: `${-i * 0.2}s`,
                    zIndex: 10, pointerEvents: 'none',
                  }} />
                )
              })}
            </>
          )}

          {/* Todo o conteúdo do header com zIndex 1 para ficar acima do banner */}
          <div style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
              {/* Moldura do Avatar removida por solicitação: o item "moldura" agora é exclusivo do card */}

              {/* Partículas flutuando ao redor do avatar quando efeito partículas equipado */}
              {equipped.effect?.effect === 'particles' && (
                <div style={{
                  position: 'absolute',
                  inset: -20,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}>
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * 360
                    const delay = (i / 8) * 2
                    return (
                      <div key={i} style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: ['#00f2ff','#bc13fe','#ff2079','#ffd700'][i % 4],
                        boxShadow: `0 0 6px ${['#00f2ff','#bc13fe','#ff2079','#ffd700'][i % 4]}`,
                        transform: `rotate(${angle}deg) translateX(52px)`,
                        animation: `orbit ${1.5 + i * 0.2}s linear infinite`,
                        animationDelay: `${delay}s`,
                      }} />
                    )
                  })}
                </div>
              )}

              {/* Helper para Background do Avatar */}
              {(() => {
                const isAnimated = equipped.color?.animated === true
                const colorType = (equipped.color as any)?.type // 'rainbow' ou 'rgb-cycle'
                
                const getAvatarBackground = (color: any): string => {
                  if (!color) return 'linear-gradient(135deg, #00f2ff, #bc13fe)'
                  
                  // Cores animadas — background controlado por animação CSS
                  if (color.animated === true) {
                    return 'linear-gradient(135deg, #00f2ff, #bc13fe, #ff2079, #ffd700)'
                  }
                  
                  if (color.gradient) {
                    // Suporte a gradiente de 3 cores:
                    if (color.gradient.length === 3) {
                      return `linear-gradient(135deg, ${color.gradient[0]}, ${color.gradient[1]}, ${color.gradient[2]})`
                    }
                    return `linear-gradient(135deg, ${color.gradient[0]}, ${color.gradient[1]})`
                  }
                  
                  if (color.hex) return color.hex
                  
                  return 'linear-gradient(135deg, #00f2ff, #bc13fe)'
                }

                return (
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: getAvatarBackground(equipped.color),
                    padding: 2,
                    boxShadow: equipped.effect?.effect === 'aura'
                      ? '0 0 40px rgba(188,19,254,0.8), 0 0 80px rgba(0,242,255,0.4)'
                      : '0 0 24px rgba(0,242,255,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Overlay para Cores Animadas (Cyclic) */}
                    {isAnimated && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00f2ff, #bc13fe, #ff2079, #ffd700)',
                        backgroundSize: '400% 400%',
                        animation: 'hueShiftBg 3s linear infinite',
                        zIndex: 0,
                      }} />
                    )}

                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: '50%',
                      background: '#0d0d18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative', zIndex: 1,
                      fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
                      color: equipped.color?.hex ?? '#00f2ff',
                    }}>
                      {(avatarPreview || profile.avatar_url) ? (
                        <img
                          src={avatarPreview ?? profile.avatar_url!}
                          alt={profile.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : avatarLetter}
                    </div>
                  </div>
                )
              })()}

              {editMode && (
                <label style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28,
                  background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 8px rgba(0,242,255,0.5)',
                }}>
                  <Camera size={13} color="#050505" />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#666680', fontFamily: 'Orbitron, sans-serif' }}>USERNAME</span>
                      <span style={{ fontSize: '0.65rem', color: editUsername.length > LIMITS.USERNAME_MAX ? '#ff2079' : '#666680' }}>
                        {editUsername.length}/{LIMITS.USERNAME_MAX}
                      </span>
                    </div>
                    <input
                      maxLength={LIMITS.USERNAME_MAX}
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(0,242,255,0.3)',
                        borderRadius: 8, color: '#e0e0e0',
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '1rem', fontWeight: 700,
                        outline: 'none', width: '100%', maxWidth: 300,
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#666680', fontFamily: 'Orbitron, sans-serif' }}>BIO</span>
                      <span style={{ fontSize: '0.65rem', color: editBio.length > LIMITS.BIO_MAX ? '#ff2079' : '#666680' }}>
                        {editBio.length}/{LIMITS.BIO_MAX}
                      </span>
                    </div>
                    <textarea
                      maxLength={LIMITS.BIO_MAX}
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      placeholder="Sua bio..."
                      rows={2}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, color: '#e0e0e0',
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                        outline: 'none', resize: 'vertical', width: '100%', maxWidth: 400,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={editLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                        border: 'none', borderRadius: 8,
                        color: '#050505', fontFamily: 'Orbitron, sans-serif',
                        fontSize: '0.68rem', fontWeight: 700,
                        cursor: editLoading ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.08em',
                      }}
                    >
                      <Check size={13} /> {editLoading ? 'SALVANDO...' : 'SALVAR'}
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setAvatarFile(null); setAvatarPreview(null) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, color: '#666680',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                        cursor: 'pointer', letterSpacing: '0.08em',
                      }}
                    >
                      <X size={13} /> CANCELAR
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <h1 style={{ margin: 0, padding: 0 }}>
                      <EffectRenderer
                        username={profile.username}
                        effect={equipped.effect ?? null}
                        size="lg"
                      />
                    </h1>

                    {/* Rank e Level */}
                    {authorLevelInfo.rank === 'CYBER GOD' ? (
                      <CyberGodBadge size="md" />
                    ) : (
                      <div style={{
                        background: `${authorLevelInfo.color}15`,
                        border: `1px solid ${authorLevelInfo.color}40`,
                        borderRadius: 100, padding: '0.35rem 0.8rem',
                        color: authorLevelInfo.color, fontSize: '0.65rem',
                        fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
                        textShadow: `0 0 8px ${authorLevelInfo.glow}`,
                        letterSpacing: '0.05em',
                      }}>
                        {authorLevelInfo.rank} • NV {authorLevelInfo.level}
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.625rem',
                    marginTop: '0.75rem',
                  }}>
                    {equipped.title?.text && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,119,0,0.07))',
                        border: '1px solid rgba(255,215,0,0.4)',
                        borderRadius: 8,
                        padding: '0.35rem 0.875rem',
                        alignSelf: 'flex-start',
                        boxShadow: '0 0 16px rgba(255,215,0,0.12)',
                        maxWidth: '280px',
                      }}>
                        <span style={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>👑</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                          <span style={{
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: '0.78rem', fontWeight: 900,
                            color: '#ffd700', letterSpacing: '0.05em', lineHeight: 1.2,
                            textShadow: '0 0 10px rgba(255,215,0,0.4)',
                            whiteSpace: 'nowrap',
                          }}>
                            {equipped.title.text}
                          </span>
                          <span style={{
                            fontSize: '0.5rem', color: '#886600',
                            fontFamily: 'Orbitron, sans-serif',
                            letterSpacing: '0.1em', lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}>
                            TÍTULO LENDÁRIO
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BADGE E BOOST INDICATORS */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {/* Badge do usuário — pequeno, pill simples */}
                      {equipped.badge && (
                        <div style={{
                          marginTop: equipped.title?.text ? '0.25rem' : '0',
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: 'rgba(255,215,0,0.08)',
                          border: '1px solid rgba(255,215,0,0.3)',
                          borderRadius: 100, padding: '0.15rem 0.6rem',
                          fontSize: '0.6rem', fontFamily: 'Orbitron, sans-serif',
                          color: '#ffd700', letterSpacing: '0.08em',
                        }}>
                          🏅 {equipped.raw?.badge?.item_name ?? 'BADGE'}
                        </div>
                      )}

                      {/* Boost indicador */}
                      {equipped.boost?.type === 'focus' && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          background: 'rgba(255,32,121,0.1)',
                          border: '1px solid rgba(255,32,121,0.3)',
                          borderRadius: 6, padding: '0.2rem 0.625rem',
                          fontSize: '0.6rem', fontFamily: 'Orbitron, sans-serif',
                          color: '#ff2079', letterSpacing: '0.06em', marginTop: '0.25rem',
                        }}>
                          👁️ CRIADOR EM DESTAQUE
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* XP Bar */}
                  {(() => {
                    const li = authorLevelInfo
                    return (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.875rem 1rem',
                        background: profileTheme.card,
                        border: `1px solid ${profileTheme.border}`,
                        borderRadius: 10,
                        maxWidth: 400,
                        marginBottom: '1rem',
                      }}>
                        {/* Rank + nível */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {li.rank === 'CYBER GOD' ? (
                              <CyberGodBadge size="sm" />
                            ) : (
                              <span style={{
                                fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', fontWeight: 700,
                                color: li.color, letterSpacing: '0.08em',
                                textShadow: `0 0 10px ${li.glow}`,
                              }}>
                                {li.rank}
                              </span>
                            )}
                            <span style={{
                              background: `${li.rank === 'CYBER GOD' ? 'rgba(255,215,0,0.15)' : li.color + '20'}`,
                              border: `1px solid ${li.rank === 'CYBER GOD' ? 'rgba(255,215,0,0.4)' : li.color + '50'}`,
                              borderRadius: 100, padding: '0.1rem 0.5rem',
                              fontSize: '0.62rem', fontFamily: 'Orbitron, sans-serif',
                              color: li.rank === 'CYBER GOD' ? '#ffd700' : li.color,
                            }}>
                              NV {li.level}{li.prestige > 0 ? ` ✦P${li.prestige}` : ''}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#666680', fontFamily: 'Orbitron, sans-serif' }}>
                            {(profile.xp ?? 0).toLocaleString('pt-BR')} XP
                          </span>
                        </div>

                        {/* Barra de progresso */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: '0.4rem' }}>
                          <div style={{
                            height: '100%',
                            width: `${li.progress}%`,
                            background: li.rank === 'CYBER GOD'
                              ? 'linear-gradient(90deg, #00f2ff, #bc13fe, #ff2079, #ffd700)'
                              : equipped.color?.gradient
                              ? `linear-gradient(90deg, ${equipped.color.gradient[0]}, ${equipped.color.gradient[1]})`
                              : equipped.color?.hex
                              ? `linear-gradient(90deg, ${equipped.color.hex}, ${equipped.color.hex}88)`
                              : `linear-gradient(90deg, ${li.color}, ${li.color}88)`,
                            borderRadius: 4,
                            boxShadow: `0 0 8px ${equipped.color?.hex ?? li.glow}`,
                            transition: 'width 0.8s ease',
                          }} />
                        </div>

                        {/* Texto de progresso — CORRIGIDO */}
                        {li.level < 100 ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.62rem', color: '#444466', fontFamily: 'Orbitron, sans-serif', margin: 0 }}>
                              {li.xpIntoLevel.toLocaleString('pt-BR')} / {li.xpNeededForNext.toLocaleString('pt-BR')} XP neste nível
                            </p>
                            <p style={{ fontSize: '0.62rem', color: '#333350', fontFamily: 'Orbitron, sans-serif', margin: 0 }}>
                              faltam {li.xpToNextLevel.toLocaleString('pt-BR')} XP → NV {li.level + 1}
                            </p>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.62rem', color: '#ffd700', fontFamily: 'Orbitron, sans-serif', margin: 0, textAlign: 'center' }}>
                            ✦ NÍVEL MÁXIMO ATINGIDO {li.prestige > 0 ? `— PRESTIGE ${li.prestige}` : ''}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {profile.bio && (
                    <p style={{ color: '#888899', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: 500 }}>
                      {profile.bio}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#444466', fontSize: '0.72rem' }}>
                      <Calendar size={12} />
                      Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00f2ff', fontSize: '0.72rem', fontFamily: 'Orbitron, sans-serif' }}>
                      <Star size={12} />
                      {reviews.length} reviews
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#bc13fe', fontSize: '0.72rem', fontFamily: 'Orbitron, sans-serif' }}>
                      👥 {friends.length} amigos
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
              {isOwner ? (
                !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, color: '#e0e0e0',
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                      cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f2ff'; e.currentTarget.style.color = '#00f2ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e0e0e0' }}
                  >
                    <Edit3 size={13} /> EDITAR PERFIL
                  </button>
                )
              ) : user && (
                <>
                  {friendStatus === 'none' && (
                    <button onClick={handleAddFriend} style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(0,242,255,0.1)',
                      border: '1px solid rgba(0,242,255,0.4)',
                      borderRadius: 8, color: '#00f2ff',
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                      cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}>
                      <UserPlus size={13} /> ADICIONAR
                    </button>
                  )}
                  {friendStatus === 'pending_sent' && (
                    <button disabled style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, color: '#666680',
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                      cursor: 'not-allowed', letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>
                      <Clock size={13} /> PENDENTE
                    </button>
                  )}
                  {friendStatus === 'pending_received' && (
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button onClick={handleAcceptFriend} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.4)',
                        borderRadius: 8, color: '#00ff9d',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}><Check size={12} /> ACEITAR</button>
                      <button onClick={handleRemoveFriend} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255,32,121,0.1)', border: '1px solid rgba(255,32,121,0.4)',
                        borderRadius: 8, color: '#ff2079',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}><X size={12} /> RECUSAR</button>
                    </div>
                  )}
                  {friendStatus === 'accepted' && (
                    <button
                      onClick={handleRemoveFriend}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.3)',
                        borderRadius: 8, color: '#00ff9d',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                        cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,32,121,0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,32,121,0.3)'
                        e.currentTarget.style.color = '#ff2079'
                        e.currentTarget.innerHTML = 'REMOVER'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(0,255,157,0.08)'
                        e.currentTarget.style.borderColor = 'rgba(0,255,157,0.3)'
                        e.currentTarget.style.color = '#00ff9d'
                        e.currentTarget.innerHTML = '✓ AMIGOS'
                      }}
                    >
                      ✓ AMIGOS
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Card unificado: Lootboxes / Inventário / Amigos */}
        {isOwner && profile?.id && (
          <ProfileInventory
            userId={profile.id}
            isOwner={isOwner}
            friends={friends}
            onProfileUpdate={() => {
              loadProfile()
              loadFriends(profile.id)
              loadEquipped(profile.id)
            }}
          />
        )}

        {/* Reviews grid */}
        <div style={{ marginTop: '2.5rem' }}>
          {reviews.length > 0 && (
            <div style={{
              display: 'flex', gap: '0.5rem',
              overflowX: 'auto', paddingBottom: '0.5rem',
              marginBottom: '1.25rem', scrollbarWidth: 'none',
            }}>
              <button
                onClick={() => setProfileCategoryFilter('all')}
                className={`category-pill${profileCategoryFilter === 'all' ? ' active' : ''}`}
              >
                🌐 TODAS
              </button>
              {Array.from(
                new Map(
                  reviews
                    .filter(r => r.categories)
                    .map(r => [(r.categories as any).id, r.categories])
                ).values()
              ).map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setProfileCategoryFilter(cat.id)}
                  className={`category-pill${profileCategoryFilter === cat.id ? ' active' : ''}`}
                >
                  {cat.icon} {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          <h3 style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem',
            color: '#00f2ff', letterSpacing: '0.12em', marginBottom: '1.25rem',
          }}>
            REVIEWS ({profileCategoryFilter === 'all' ? reviews.length : reviews.filter(r => r.category_id === profileCategoryFilter).length}{profileCategoryFilter !== 'all' ? ` de ${reviews.length}` : ''})
          </h3>

          {reviews.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: '#0d0d18',
              border: '1px dashed rgba(255,255,255,0.06)',
              borderRadius: 12,
            }}>
              <p style={{ color: '#333350', fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem' }}>
                {isOwner ? 'Você ainda não publicou nenhuma review.' : 'Nenhuma review ainda.'}
              </p>
              {isOwner && (
                <button
                  className="btn-cyber"
                  onClick={() => setModalOpen(true)}
                  style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  + CRIAR PRIMEIRA REVIEW
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}>
              {(profileCategoryFilter === 'all' ? reviews : reviews.filter(r => r.category_id === profileCategoryFilter)).map((review, i) => (
                <div key={review.id} style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                  <ReviewCard
                    review={review}
                    onLikeToggle={handleLikeToggle}
                    onClone={r => { setCloneSource(r); setModalOpen(true) }}
                    currentUserId={user?.id}
                    currentUserEquipped={loggedInEquipped}
                    ownerTheme={profileTheme}
                    onDelete={isOwner ? handleDeleteReview : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ReviewModal
          onClose={() => { setModalOpen(false); setCloneSource(null) }}
          onSuccess={() => {
            setModalOpen(false)
            setCloneSource(null)
            if (profile?.id) loadReviews(profile.id)
          }}
          categories={categories}
          cloneSource={cloneSource}
        />
      )}
    </div>
  )
}
