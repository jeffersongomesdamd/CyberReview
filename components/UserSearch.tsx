'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { getLevelInfo } from '@/lib/constants'
import { Search, UserPlus, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserResult {
  type: 'user'
  id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
}

interface ReviewResult {
  type: 'review'
  id: string
  title: string
  authorUsername: string
}

interface FriendStatus {
  [userId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
}

export default function UserSearch() {
  const { user } = useAuth()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<(UserResult | ReviewResult)[]>([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<FriendStatus>({})
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const [profilesRes, reviewsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, avatar_url, xp, level')
          .ilike('username', `%${query.trim()}%`)
          .neq('id', user?.id ?? '')
          .limit(5),
        supabase
          .from('reviews')
          .select('id, title, profiles!reviews_author_id_fkey(username)')
          .ilike('title', `%${query.trim()}%`)
          .limit(5)
      ])

      const profilesData = (profilesRes.data ?? []).map(u => ({ ...u, type: 'user' as const }))
      const reviewsData = (reviewsRes.data ?? []).map((r: any) => ({
        type: 'review' as const,
        id: r.id,
        title: r.title,
        authorUsername: Array.isArray(r.profiles) ? r.profiles[0]?.username : r.profiles?.username ?? 'anônimo'
      }))

      setResults([...profilesData, ...reviewsData])
      const data = profilesRes.data

      // Buscar status de amizade para cada resultado
      if (data?.length && user) {
        const ids = data.map(u => u.id)
        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id, status')
          .or(
            ids.map(id =>
              `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`
            ).join(',')
          )

        const newStatuses: FriendStatus = {}
        ids.forEach(id => { newStatuses[id] = 'none' })

        friendships?.forEach(f => {
          const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
          if (f.status === 'accepted') newStatuses[otherId] = 'accepted'
          else if (f.requester_id === user.id) newStatuses[otherId] = 'pending_sent'
          else newStatuses[otherId] = 'pending_received'
        })

        setStatuses(newStatuses)
      }

      setLoading(false)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query, user])

  const handleAddFriend = async (targetId: string) => {
    if (!user) return
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: targetId })

    if (error) {
      toast.error('Erro ao enviar pedido')
      return
    }

    setStatuses(prev => ({ ...prev, [targetId]: 'pending_sent' }))
    toast.success('Pedido enviado!', {
      style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' }
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Input de busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '0.625rem 0.875rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#00f2ff'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,242,255,0.1)'
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      >
        <Search size={15} color="#666680" />
        <input
          type="text"
          placeholder="Buscar usuário ou review..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#e0e0e0', fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem', width: '100%',
          }}
        />
        {loading && (
          <div style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            border: '2px solid rgba(0,242,255,0.3)',
            borderTopColor: '#00f2ff',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#0d0d18',
          border: '1px solid rgba(0,242,255,0.2)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(0,242,255,0.08)',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          {results.map((item, i) => {
            if (item.type === 'review') {
              return (
                <div
                  key={`rev-${item.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < results.length - 1
                      ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <a href={`/review/${item.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '8px',
                      background: 'rgba(0,242,255,0.1)',
                      border: '1px solid rgba(0,242,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      📝
                    </div>
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/review/${item.id}`} style={{ textDecoration: 'none' }}>
                      <p style={{
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem',
                        color: '#00f2ff', margin: 0, letterSpacing: '0.04em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.title}
                      </p>
                    </a>
                    <p style={{
                      fontSize: '0.65rem', color: '#666680',
                      fontFamily: 'Inter, sans-serif',
                      margin: '0.1rem 0 0',
                    }}>
                      por @{item.authorUsername}
                    </p>
                  </div>
                </div>
              )
            }

            const u = item
            const levelInfo = getLevelInfo(u.xp ?? 0)
            const status = statuses[u.id] ?? 'none'

            return (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderBottom: i < results.length - 1
                    ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <a href={`/profile/${u.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#050505',
                    overflow: 'hidden',
                  }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : u.username[0]?.toUpperCase()
                    }
                  </div>
                </a>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={`/profile/${u.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem',
                      color: '#e0e0e0', margin: 0, letterSpacing: '0.04em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      @{u.username}
                    </p>
                  </a>
                  <p style={{
                    fontSize: '0.65rem', color: levelInfo.color,
                    fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
                    margin: '0.1rem 0 0',
                    textShadow: `0 0 6px ${levelInfo.glow}`,
                  }}>
                    {levelInfo.rank} · NV {levelInfo.level}
                  </p>
                </div>

                {/* Botão de amizade */}
                {user && (
                  <div style={{ flexShrink: 0 }}>
                    {status === 'none' && (
                      <button
                        onClick={() => handleAddFriend(u.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.35rem 0.75rem',
                          background: 'rgba(0,242,255,0.08)',
                          border: '1px solid rgba(0,242,255,0.35)',
                          borderRadius: 8, color: '#00f2ff',
                          fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                          letterSpacing: '0.08em', cursor: 'pointer',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(0,242,255,0.15)'
                          e.currentTarget.style.boxShadow = '0 0 10px rgba(0,242,255,0.2)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(0,242,255,0.08)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <UserPlus size={11} /> ADICIONAR
                      </button>
                    )}
                    {status === 'pending_sent' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, color: '#444466',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                        letterSpacing: '0.08em', whiteSpace: 'nowrap',
                      }}>
                        <Clock size={11} /> PENDENTE
                      </div>
                    )}
                    {status === 'pending_received' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(188,19,254,0.08)',
                        border: '1px solid rgba(188,19,254,0.35)',
                        borderRadius: 8, color: '#bc13fe',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                        letterSpacing: '0.08em', whiteSpace: 'nowrap',
                      }}>
                        TE ADICIONOU
                      </div>
                    )}
                    {status === 'accepted' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(0,255,157,0.08)',
                        border: '1px solid rgba(0,255,157,0.3)',
                        borderRadius: 8, color: '#00ff9d',
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                        letterSpacing: '0.08em', whiteSpace: 'nowrap',
                      }}>
                        <Check size={11} /> AMIGOS
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Nenhum resultado */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#0d0d18',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '1rem',
          textAlign: 'center', zIndex: 500,
        }}>
          <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', color: '#333350' }}>
            Nenhum resultado encontrado para "{query}"
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
