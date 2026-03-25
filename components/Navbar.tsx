'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Zap, Search, Bell, Menu, X, User, LogOut, Plus, Check, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import UserSearch from './UserSearch'

export default function Navbar({ onNewReview }: { onNewReview?: () => void }) {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(5,5,5,0.95)' : '#050505',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: '1.5rem' }}>
          
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/icon.png" alt="CyberReview" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span
              className="neon-flicker"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CYBER<span style={{ letterSpacing: '0.15em' }}> </span>REVIEW
            </span>
          </Link>

          {/* Search bar — desktop (User & Global) */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <UserSearch />
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            {loading ? (
              <div style={{
                width: 80, height: 32,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                animation: 'shimmer 1.5s infinite linear',
                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                backgroundSize: '400px 100%',
              }} />
            ) : user ? (
              <>
                {/* Nova Review button */}
                {onNewReview && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNewReview(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#050505',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0,242,255,0.5)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Plus size={14} />
                    NOVA REVIEW
                  </button>
                )}

                <PendingBadge userId={user.id} />

                {/* Avatar dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '0.375rem 0.625rem',
                      cursor: 'pointer',
                      color: '#e0e0e0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: 'Orbitron, sans-serif',
                      color: '#050505',
                      overflow: 'hidden',
                    }}>
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (profile?.username?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()
                      }
                    </div>
                    <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.username ?? user.email?.split('@')[0]}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: '#111118',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '0.5rem',
                      minWidth: 160,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      zIndex: 200,
                    }}>
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          color: '#e0e0e0',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
                      >
                        <User size={14} color="#00f2ff" /> Meu Perfil
                      </Link>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          color: '#ff2079',
                          fontSize: '0.85rem',
                          background: 'transparent',
                          border: 'none',
                          width: '100%',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,32,121,0.08)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                      >
                        <LogOut size={14} /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/auth">
                <button style={{
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#050505',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}>ENTRAR</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function PendingBadge({ userId }: { userId: string }) {
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [lootboxCount, setLootboxCount]     = useState(0)
  const [open, setOpen]   = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'lootboxes'>('lootboxes')

  useEffect(() => {
    if (!userId) return

    // ── Carga inicial ──────────────────────────────────────
    const loadFriends = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('*, profiles!friendships_requester_id_fkey(*)')
        .eq('addressee_id', userId)
        .eq('status', 'pending')
      if (data) setFriendRequests(data)
    }

    const loadLootboxes = async () => {
      const { count } = await supabase
        .from('lootboxes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'unopened')
      if (count !== null) setLootboxCount(count)
    }

    loadFriends()
    loadLootboxes()

    // ── Listener Realtime para lootboxes ──────────────────
    const lootChannel = supabase
      .channel(`pending-loot-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lootboxes', filter: `user_id=eq.${userId}` },
        () => setLootboxCount(prev => prev + 1)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lootboxes', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.status === 'opened') {
            setLootboxCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    // ── Listener Realtime para amizades ───────────────────
    const friendChannel = supabase
      .channel(`pending-friends-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` },
        () => loadFriends()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(lootChannel)
      supabase.removeChannel(friendChannel)
    }
  }, [userId])

  const totalCount = friendRequests.length + lootboxCount
  if (totalCount === 0) return null

  const handleAccept = async (id: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    setFriendRequests(prev => prev.filter(r => r.id !== id))
  }

  const handleDecline = async (id: string) => {
    await supabase.from('friendships').delete().eq('id', id)
    setFriendRequests(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          background: lootboxCount > 0 ? 'rgba(255,215,0,0.1)' : 'rgba(188,19,254,0.1)',
          border: `1px solid ${lootboxCount > 0 ? 'rgba(255,215,0,0.4)' : 'rgba(188,19,254,0.4)'}`,
          borderRadius: 8, padding: '0.4rem 0.6rem',
          cursor: 'pointer',
          color: lootboxCount > 0 ? '#ffd700' : '#bc13fe',
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.7rem', fontFamily: 'Orbitron, sans-serif',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={14} />
        <span style={{
          background: lootboxCount > 0 ? '#ffd700' : '#bc13fe',
          color: '#050505', fontSize: '0.6rem', fontWeight: 700,
          width: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {totalCount}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '0.75rem',
            minWidth: 280, maxWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            zIndex: 300,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {([
              { id: 'lootboxes' as const, label: 'LOOTBOXES', count: lootboxCount,          color: '#ffd700' },
              { id: 'friends'   as const, label: 'AMIZADES',  count: friendRequests.length,  color: '#bc13fe' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '0.35rem',
                  background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? tab.color + '50' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  color: activeTab === tab.id ? tab.color : '#444466',
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                  letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>

          {/* Lootboxes */}
          {activeTab === 'lootboxes' && (
            lootboxCount === 0 ? (
              <p style={{ color: '#444466', fontSize: '0.78rem', textAlign: 'center', padding: '0.5rem' }}>
                Nenhuma lootbox disponível
              </p>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎁</div>
                <p style={{
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem',
                  color: '#ffd700', letterSpacing: '0.08em', marginBottom: '0.75rem',
                }}>
                  {lootboxCount} LOOTBOX{lootboxCount > 1 ? 'ES' : ''} DISPONÍVEL{lootboxCount > 1 ? 'IS' : ''}!
                </p>
                
                <Link
                  href={`/profile/${userId}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,119,0,0.2))',
                    border: '1px solid rgba(255,215,0,0.5)',
                    borderRadius: 8, color: '#ffd700',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                    letterSpacing: '0.08em', textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 0 16px rgba(255,215,0,0.2)',
                  }}
                >
                  IR PARA O PERFIL → ABRIR
                </Link>
              </div>
            )
          )}

          {/* Pedidos de amizade */}
          {activeTab === 'friends' && (
            friendRequests.length === 0 ? (
              <p style={{ color: '#444466', fontSize: '0.78rem', textAlign: 'center', padding: '0.5rem' }}>
                Nenhum pedido pendente
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {friendRequests.map(req => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#e0e0e0' }}>
                      @{req.profiles?.username ?? 'usuário'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => handleAccept(req.id)}
                        style={{
                          background: 'rgba(0,255,157,0.1)',
                          border: '1px solid rgba(0,255,157,0.4)',
                          borderRadius: 6, padding: '0.25rem 0.5rem',
                          color: '#00ff9d', fontSize: '0.65rem',
                          cursor: 'pointer', fontFamily: 'Orbitron, sans-serif',
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        style={{
                          background: 'rgba(255,32,121,0.1)',
                          border: '1px solid rgba(255,32,121,0.4)',
                          borderRadius: 6, padding: '0.25rem 0.5rem',
                          color: '#ff2079', fontSize: '0.65rem',
                          cursor: 'pointer', fontFamily: 'Orbitron, sans-serif',
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

