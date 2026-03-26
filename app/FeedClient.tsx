'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/hooks/useAuth'
import { Review, Category } from '@/lib/types'
import ReviewCard from '@/components/ReviewCard'
import ReviewModal from '@/components/ReviewModal'
import SkeletonCard from '@/components/SkeletonCard'
import Navbar from '@/components/Navbar'
import { Plus, Heart, Clock, Shuffle, Users, User } from 'lucide-react'
import { useEquippedItems } from '@/lib/hooks/useEquippedItems'

const PAGE_SIZE = 12

export default function FeedClient() {
  const { user } = useAuth()
  const { equipped: currentUserEquipped } = useEquippedItems(user?.id ?? null)
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''

  const [reviews, setReviews] = useState<Review[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'liked' | 'cloned'>('latest')
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [myReviewsOnly, setMyReviewsOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [cloneSource, setCloneSource] = useState<Review | null>(null)

  const [totalReviews, setTotalReviews] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*', { count: 'estimated', head: true })
      .then(({ count }) => { if (count !== null) setTotalReviews(count) })
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollCategories = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' })
    }
  }

  // Usar ref para evitar problema de stale closure
  const fetchingRef = useRef(false)

  // Busca categorias uma vez
  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data, error }) => {
      if (error) { /**/ }
      if (data) setCategories(data)
    })
  }, [])

  // Função de busca principal — sem useCallback para evitar stale closures
  const doFetch = async (opts: {
    reset: boolean
    cat: string
    sort: string
    friends: boolean
    mine: boolean
    search: string
    pg: number
    userId: string | undefined
  }) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    opts.reset ? setLoading(true) : setLoadingMore(true)

    try {
      // Monta a query base
      let query = supabase
        .from('reviews')
        .select(`
          id,
          author_id,
          category_id,
          title,
          description,
          image_url,
          attributes,
          cloned_from,
          clone_count,
          like_count,
          created_at,
          profiles!reviews_author_id_fkey (id, username, avatar_url, xp, review_count),
          categories (id, name, icon)
        `)

      // Filtro de categoria
      if (opts.cat !== 'all') {
        query = query.eq('category_id', opts.cat)
      }

      // Filtro de busca por título
      if (opts.search.trim()) {
        query = query.ilike('title', `%${opts.search.trim()}%`)
      }

      // Filtro meus reviews
      if (opts.mine && opts.userId) {
        query = query.eq('author_id', opts.userId)
      } else if (opts.friends && opts.userId) {
        // Filtro de amigos
        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${opts.userId},addressee_id.eq.${opts.userId}`)

        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map(f =>
            f.requester_id === opts.userId ? f.addressee_id : f.requester_id
          )
          query = query.in('author_id', [...friendIds, opts.userId])
        } else {
          // Sem amigos: retorna lista vazia imediatamente
          setReviews([])
          setHasMore(false)
          setLoading(false)
          setLoadingMore(false)
          fetchingRef.current = false
          return
        }
      }

      // Ordenação
      if (opts.sort === 'liked') {
        query = query.order('like_count', { ascending: false })
      } else if (opts.sort === 'cloned') {
        query = query.order('clone_count', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Paginação
      query = query.range(opts.pg * PAGE_SIZE, (opts.pg + 1) * PAGE_SIZE - 1)

      const { data, error } = await query

      if (error) {
        return
      }


      // Busca likes do usuário atual
      let likedSet = new Set<string>()
      if (opts.userId && data && data.length > 0) {
        const reviewIds = data.map(r => r.id)
        const { data: likeData } = await supabase
          .from('likes')
          .select('review_id')
          .eq('user_id', opts.userId)
          .in('review_id', reviewIds)
        likeData?.forEach(l => likedSet.add(l.review_id))
      }

      const enriched = ((data as any) ?? []).map((r: any) => ({
        ...r,
        profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
        categories: Array.isArray(r.categories) ? r.categories[0] : r.categories,
        is_liked: likedSet.has(r.id),
      })) as Review[]

      if (opts.reset) {
        setReviews(enriched)
      } else {
        setReviews(prev => [...prev, ...enriched])
      }

      setPage(opts.pg + 1)
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
    } catch (err) {
    } finally {
      setLoading(false)
      setLoadingMore(false)
      fetchingRef.current = false
    }
  }

  // Re-busca quando filtros mudam
  useEffect(() => {
    setReviews([])
    setPage(0)
    setHasMore(false)
    doFetch({
      reset: true,
      cat: selectedCategory,
      sort: sortBy,
      friends: friendsOnly,
      mine: myReviewsOnly,
      search: searchQuery,
      pg: 0,
      userId: user?.id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, friendsOnly, myReviewsOnly, searchQuery, user?.id])

  const handleLoadMore = () => {
    doFetch({
      reset: false,
      cat: selectedCategory,
      sort: sortBy,
      friends: friendsOnly,
      mine: myReviewsOnly,
      search: searchQuery,
      pg: page,
      userId: user?.id,
    })
  }

  // Chamado após criar review com sucesso
  const handleReviewCreated = () => {
    setModalOpen(false)
    setCloneSource(null)
    // Reseta tudo e re-busca do zero
    setReviews([])
    setPage(0)
    setHasMore(false)
    // Timeout garante que o estado foi limpo antes de buscar
    setTimeout(() => {
      doFetch({
        reset: true,
        cat: selectedCategory,
        sort: sortBy,
        friends: friendsOnly,
        mine: myReviewsOnly,
        search: searchQuery,
        pg: 0,
        userId: user?.id,
      })
    }, 300)
  }

  const handleLikeToggle = async (reviewId: string, isLiked: boolean) => {
    if (!user) return
    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? { ...r, is_liked: !isLiked, like_count: r.like_count + (isLiked ? -1 : 1) }
        : r
    ))
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', reviewId)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, review_id: reviewId })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <Navbar onNewReview={user ? () => setModalOpen(true) : undefined} />

      {/* Stats bar */}
      <div style={{
        background: 'rgba(0,242,255,0.02)',
        borderBottom: '1px solid rgba(0,242,255,0.07)',
        padding: '0.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#00f2ff', textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>
              {totalReviews !== null ? totalReviews : '—'}
            </span>
            <span style={{ color: '#333350', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>REVIEWS TOTAIS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#bc13fe', textShadow: '0 0 10px rgba(188,19,254,0.5)' }}>
              {categories.length}
            </span>
            <span style={{ color: '#333350', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>CATEGORIAS</span>
          </div>
          <OnlineCounter />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Título */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.2rem',
          }}>
            EXPLORAR FEED
          </h1>
          <p style={{ color: '#444466', fontSize: '0.82rem' }}>
            Descubra e ranqueie qualquer coisa
          </p>
        </div>

        {/* Filtro de categorias */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          
          {/* Fade esquerda */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 8,
            width: 48, zIndex: 5, pointerEvents: 'none',
            background: 'linear-gradient(to right, #050505 30%, transparent)',
          }} />

          {/* Fade direita */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 8,
            width: 48, zIndex: 5, pointerEvents: 'none',
            background: 'linear-gradient(to left, #050505 30%, transparent)',
          }} />

          {/* Botão scroll esquerda */}
          <button
            onClick={() => scrollCategories('left')}
            style={{
              position: 'absolute', left: 4, top: '50%',
              transform: 'translateY(-60%)', // acima do scrollbar
              zIndex: 10,
              width: 24, height: 24,
              background: 'rgba(0,242,255,0.12)',
              border: '1px solid rgba(0,242,255,0.3)',
              borderRadius: '50%',
              color: '#00f2ff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', lineHeight: 1,
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,242,255,0.25)'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,242,255,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,242,255,0.12)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >‹</button>

          {/* Lista de pills */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              paddingTop: '0.25rem',
              paddingLeft: '2.5rem',  // espaço para o botão esquerdo
              paddingRight: '2.5rem', // espaço para o botão direito
              scrollbarWidth: 'none',
              msOverflowStyle: 'none' as any,
              WebkitOverflowScrolling: 'touch' as any,
            }}
          >
            <button
              className={`category-pill${selectedCategory === 'all' ? ' active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              🌐 TODOS
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-pill${selectedCategory === cat.id ? ' active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Botão scroll direita */}
          <button
            onClick={() => scrollCategories('right')}
            style={{
              position: 'absolute', right: 4, top: '50%',
              transform: 'translateY(-60%)',
              zIndex: 10,
              width: 24, height: 24,
              background: 'rgba(0,242,255,0.12)',
              border: '1px solid rgba(0,242,255,0.3)',
              borderRadius: '50%',
              color: '#00f2ff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', lineHeight: 1,
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,242,255,0.25)'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,242,255,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,242,255,0.12)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >›</button>
        </div>

        {/* Sort + Friends */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {([
            { v: 'latest', label: 'RECENTES', icon: <Clock size={12} /> },
            { v: 'liked', label: 'MAIS CURTIDOS', icon: <Heart size={12} /> },
            { v: 'cloned', label: 'MAIS CLONADOS', icon: <Shuffle size={12} /> },
          ] as const).map(opt => (
            <button
              key={opt.v}
              onClick={() => setSortBy(opt.v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.875rem',
                borderRadius: 6,
                border: `1px solid ${sortBy === opt.v ? '#00f2ff' : 'rgba(255,255,255,0.08)'}`,
                background: sortBy === opt.v ? 'rgba(0,242,255,0.08)' : 'transparent',
                color: sortBy === opt.v ? '#00f2ff' : '#555570',
                fontSize: '0.68rem',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}

          {user && (
            <>
              <button
                onClick={() => {
                  setMyReviewsOnly(!myReviewsOnly)
                  if (!myReviewsOnly) setFriendsOnly(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.875rem',
                  borderRadius: 6,
                  border: `1px solid ${myReviewsOnly ? '#ff2079' : 'rgba(255,255,255,0.08)'}`,
                  background: myReviewsOnly ? 'rgba(255,32,121,0.08)' : 'transparent',
                  color: myReviewsOnly ? '#ff2079' : '#555570',
                  fontSize: '0.68rem',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <User size={12} /> MEUS REVIEWS
              </button>
              <button
                onClick={() => {
                  setFriendsOnly(!friendsOnly)
                  if (!friendsOnly) setMyReviewsOnly(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.875rem',
                  borderRadius: 6,
                  border: `1px solid ${friendsOnly ? '#bc13fe' : 'rgba(255,255,255,0.08)'}`,
                  background: friendsOnly ? 'rgba(188,19,254,0.08)' : 'transparent',
                  color: friendsOnly ? '#bc13fe' : '#555570',
                  fontSize: '0.68rem',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Users size={12} /> SÓ AMIGOS
              </button>
            </>
          )}
        </div>

        {/* Grid de reviews */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,242,255,0.04)',
              border: '1px solid rgba(0,242,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem',
            }}>🔍</div>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: '#e0e0e0' }}>
              NENHUMA REVIEW ENCONTRADA
            </h2>
            <p style={{ color: '#444466', fontSize: '0.82rem', maxWidth: 340, lineHeight: 1.7 }}>
              {user
                ? 'Seja o pioneiro e publique a primeira review!'
                : 'Faça login para publicar a primeira review!'}
            </p>
            {user && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                  border: 'none', borderRadius: 8,
                  color: '#050505', fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0,242,255,0.3)',
                }}
              >
                <Plus size={15} /> NOVA REVIEW
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {reviews.map((review, i) => (
                <div
                  key={review.id}
                  style={{ animation: 'fadeIn 0.35s ease forwards', animationDelay: `${Math.min(i * 0.05, 0.4)}s`, opacity: 0 }}
                >
                  <ReviewCard
                    review={review}
                    onLikeToggle={handleLikeToggle}
                    onClone={r => { setCloneSource(r); setModalOpen(true) }}
                    currentUserId={user?.id}
                    currentUserEquipped={currentUserEquipped}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '0.6rem 2rem',
                    background: 'transparent',
                    border: '1px solid rgba(0,242,255,0.3)',
                    borderRadius: 8,
                    color: '#00f2ff',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <ReviewModal
          onClose={() => { setModalOpen(false); setCloneSource(null) }}
          onSuccess={handleReviewCreated}
          categories={categories}
          cloneSource={cloneSource ?? undefined}
        />
      )}
    </div>
  )
}

function OnlineCounter() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: Math.random().toString(36).slice(2) } }
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 6px #00ff9d', animation: 'neonPulse 2s ease infinite' }} />
      <span style={{ color: '#00ff9d', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
        {count} ONLINE
      </span>
    </div>
  )
}
