'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { RARITY_COLORS, LootboxRarityKey } from '@/lib/constants'
import CyberGodBadge from './CyberGodBadge'
import EffectRenderer from './EffectRenderer'
import { getTheme, ThemeColors } from '@/lib/themeUtils'
import toast from 'react-hot-toast'
import LootboxOpener from './LootboxOpener'

interface InventoryItem {
  id: string
  user_id: string
  item_type: string
  item_value: {
    item_id: string
    item_name: string
    item_icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    description: string | null
    value: Record<string, any>
  }
  is_equipped: boolean
  acquired_at: string
}

interface Lootbox {
  id: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  status: 'unopened' | 'opened'
  acquired_at: string
}

interface Props {
  userId: string
  isOwner: boolean
  friends?: any[]
  onProfileUpdate?: () => void
}

const RARITY_LABELS_PT: Record<string, string> = {
  common:    'COMUM',
  rare:      'RARO',
  epic:      'ÉPICO',
  legendary: 'LENDÁRIO',
}

const TYPE_ORDER = [
  'color', 'frame', 'effect', 'theme', 'badge',
  'title', 'profile_banner', 'review_style', 'reaction_effect', 'emoji', 'boost'
]

const TYPE_SECTION_LABELS: Record<string, string> = {
  color:           '🎨 Cores de Perfil',
  frame:           '🖼️ Molduras',
  effect:          '✨ Efeitos',
  theme:           '💜 Temas',
  badge:           '🏅 Badges',
  title:           '👑 Títulos',
  profile_banner:  '🖥️ Banners de Perfil',
  review_style:    '📝 Estilos de Review',
  reaction_effect: '💥 Efeitos de Reação',
  emoji:           '😊 Emojis de Reação',
  boost:           '🔥 Boosts',
}

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

export default function ProfileInventory({ userId, isOwner, friends, onProfileUpdate }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [lootboxes, setLootboxes] = useState<Lootbox[]>([])
  const [activeTab, setActiveTab] = useState<'lootboxes' | 'inventory' | 'friends'>('lootboxes')
  const [openingBox, setOpeningBox] = useState<{ id: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' } | null>(null)
  const [lastDrop, setLastDrop] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [userId])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadInventory(), loadLootboxes()])
    setLoading(false)
  }

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('id, user_id, item_type, item_value, is_equipped, acquired_at')
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false })

    if (error) { return }

    // Normalizar item_value: sempre converter para objeto
    const normalized = (data ?? []).map(row => ({
      ...row,
      item_value: typeof row.item_value === 'string'
        ? JSON.parse(row.item_value)
        : row.item_value ?? {},
    }))

    setInventory(normalized as InventoryItem[])
  }

  const loadLootboxes = async () => {
    const { data } = await supabase
      .from('lootboxes')
      .select('id, rarity, status, acquired_at')
      .eq('user_id', userId)
      .eq('status', 'unopened')
      .order('acquired_at', { ascending: false })
    if (data) setLootboxes(data as Lootbox[])
  }

  const handleOpenLootbox = (boxId: string, rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    if (!isOwner) return
    setOpeningBox({ id: boxId, rarity })
  }

  const handleEquip = async (inventoryId: string, currentlyEquipped: boolean) => {
    if (!isOwner) return

    // Usa a função do banco que garante 1 item por tipo
    const { data, error } = await supabase.rpc('equip_item', {
      p_inventory_id: inventoryId,
      p_user_id: userId,
    })


    if (error || (data as any)?.error) {
      toast.error(error?.message ?? (data as any)?.error ?? 'Erro ao equipar')
      return
    }

    const nowEquipped: boolean = (data as any).equipped

    // Atualizar estado local:
    // Se equipou → desequipa todos do mesmo tipo e equipa este
    // Se desequipou → só desmarca este
    setInventory(prev => {
      const clicked = prev.find(i => i.id === inventoryId)
      if (!clicked) return prev

      return prev.map(item => {
        if (item.id === inventoryId) {
          return { ...item, is_equipped: nowEquipped }
        }
        // Desequipa outros do mesmo tipo se este foi equipado
        if (nowEquipped && item.item_type === clicked.item_type) {
          return { ...item, is_equipped: false }
        }
        return item
      })
    })

    onProfileUpdate?.()

    toast.success(
      nowEquipped ? '✓ Item equipado!' : 'Item removido',
      { style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' } }
    )
  }

  const unopenedCount = lootboxes.length
  const totalItems = inventory.length

  if (loading) {
    return (
      <div style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  // Visitantes não veem inventário de outros (mesmo se tiver itens — privacidade)
  if (!isOwner) return null

  return (
    <div style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginTop: '1.5rem' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'lootboxes' as const, label: 'LOOTBOXES',  count: unopenedCount, color: '#ffd700' },
          { id: 'inventory' as const, label: 'INVENTÁRIO', count: totalItems,    color: '#bc13fe' },
          { id: 'friends'   as const, label: 'AMIGOS',     count: friends?.length ?? 0, color: '#00f2ff' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '0.875rem',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? tab.color : 'transparent'}`,
              color: activeTab === tab.id ? tab.color : '#444466',
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
              letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: `${tab.color}25`, border: `1px solid ${tab.color}60`,
                borderRadius: 100, padding: '0.05rem 0.4rem',
                fontSize: '0.6rem', color: tab.color,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* Último drop */}
        {lastDrop && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: `${RARITY_COLORS[lastDrop.rarity as LootboxRarityKey].color}10`,
            border: `1px solid ${RARITY_COLORS[lastDrop.rarity as LootboxRarityKey].color}40`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
                color: RARITY_COLORS[lastDrop.rarity as LootboxRarityKey].color,
                marginBottom: '0.2rem', letterSpacing: '0.1em',
              }}>
                🎁 ÚLTIMO DROP
              </p>
              <p style={{ fontSize: '0.82rem', color: '#e0e0e0' }}>{lastDrop.name}</p>
            </div>
            <button
              onClick={() => setLastDrop(null)}
              style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tab: Lootboxes */}
        {activeTab === 'lootboxes' && (
          lootboxes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#333350' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</p>
              <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                {isOwner ? 'Nenhuma lootbox disponível' : 'Sem lootboxes'}
              </p>
              {isOwner && (
                <p style={{ fontSize: '0.72rem', color: '#2a2a40', marginTop: '0.5rem' }}>
                  Ganhe lootboxes atingindo múltiplos de 10 níveis
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {lootboxes.map(box => {
                const r = RARITY_COLORS[box.rarity]
                const isOpening = openingBox?.id === box.id
                return (
                  <div key={box.id} style={{
                    background: `${r.color}10`,
                    border: `1px solid ${r.color}40`,
                    borderRadius: 12,
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.625rem',
                  }}>
                    {/* Ícone animado */}
                    <div style={{
                      fontSize: '2.8rem',
                      display: 'inline-block',
                      animation: isOpening ? 'spin 0.5s linear infinite' : 'float 2s ease-in-out infinite',
                    }}>
                      🎁
                    </div>

                    {/* Raridade */}
                    <span style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.62rem',
                      color: r.color,
                      letterSpacing: '0.12em',
                      textShadow: `0 0 8px ${r.glow}`,
                    }}>
                      {r.label}
                    </span>

                    {/* Data */}
                    <span style={{ fontSize: '0.65rem', color: '#444466' }}>
                      {new Date(box.acquired_at).toLocaleDateString('pt-BR')}
                    </span>

                    {/* Botão ABRIR */}
                    <button
                      onClick={() => handleOpenLootbox(box.id, box.rarity)}
                      disabled={openingBox !== null}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0',
                        background: isOpening
                          ? 'rgba(255,255,255,0.04)'
                          : `linear-gradient(135deg, ${r.color}30, ${r.color}15)`,
                        border: `1px solid ${r.color}60`,
                        borderRadius: 8,
                        color: isOpening ? '#444466' : r.color,
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '0.68rem',
                        letterSpacing: '0.1em',
                        cursor: openingBox !== null ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isOpening ? 'none' : `0 0 12px ${r.glow}`,
                      }}
                      onMouseEnter={e => {
                        if (!openingBox) {
                          e.currentTarget.style.boxShadow = `0 0 20px ${r.glow}`
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = isOpening ? 'none' : `0 0 12px ${r.glow}`
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {isOpening ? 'ABRINDO...' : '🎲 ABRIR'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Tab: Inventário */}
        {activeTab === 'inventory' && (() => {
          if (inventory.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#333350' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎒</p>
                <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                  Inventário vazio
                </p>
              </div>
            )
          }

          // Agrupar inventário por tipo:
          const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 }

          const groupedInventory = TYPE_ORDER.reduce((acc, type) => {
            const items = inventory
              .filter(i => i.item_type === type)
              .sort((a, b) => {
                const rarA = RARITY_ORDER[a.item_value?.rarity as keyof typeof RARITY_ORDER] ?? 4
                const rarB = RARITY_ORDER[b.item_value?.rarity as keyof typeof RARITY_ORDER] ?? 4
                // Equipados primeiro, depois por raridade
                if (a.is_equipped !== b.is_equipped) return a.is_equipped ? -1 : 1
                return rarA - rarB
              })
            if (items.length > 0) acc[type] = items
            return acc
          }, {} as Record<string, InventoryItem[]>)

          return Object.entries(groupedInventory).map(([type, items]) => (
            <div key={type} style={{ marginBottom: '1.25rem' }}>
              {/* Header da seção */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '0.625rem',
                paddingBottom: '0.375rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.62rem',
                  color: '#555570', letterSpacing: '0.1em',
                }}>
                  {TYPE_SECTION_LABELS[type] ?? type.toUpperCase()}
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 100, padding: '0.05rem 0.4rem',
                  fontSize: '0.6rem', color: '#444466',
                }}>
                  {items.length}
                </span>
                {/* Indicador de equipado na seção */}
                {items.some(i => i.is_equipped) && (
                  <span style={{
                    fontSize: '0.55rem', color: '#00ff9d',
                    fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
                    marginLeft: 'auto',
                  }}>
                    ● EQUIPADO
                  </span>
                )}
              </div>

              {/* Grid de itens da seção */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '0.625rem',
              }}>
                {items.map(invItem => {
                  const item = invItem.item_value
                  if (!item || !item.item_name) return null

                  const rarityKey = (['common','rare','epic','legendary'].includes(item.rarity)
                    ? item.rarity : 'common') as 'common'|'rare'|'epic'|'legendary'
                  const r = RARITY_COLORS[rarityKey]
                  const displayIcon = item.item_icon && item.item_icon !== '🎁'
                    ? item.item_icon
                    : TYPE_ICONS[invItem.item_type] ?? '🎁'

                  return (
                    <div
                      key={invItem.id}
                      onClick={() => isOwner && handleEquip(invItem.id, invItem.is_equipped)}
                      title={item.description ?? item.item_name}
                      style={{
                        background: invItem.is_equipped ? `${r.color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${invItem.is_equipped ? r.color + '70' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, padding: '0.75rem 0.5rem',
                        textAlign: 'center', transition: 'all 0.2s',
                        cursor: isOwner ? 'pointer' : 'default',
                        position: 'relative',
                        boxShadow: invItem.is_equipped ? `0 0 12px ${r.glow}` : 'none',
                      }}
                      onMouseEnter={e => {
                        if (isOwner) {
                          e.currentTarget.style.borderColor = `${r.color}50`
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.background = `${r.color}10`
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = invItem.is_equipped
                          ? `${r.color}70` : 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = invItem.is_equipped
                          ? `${r.color}15` : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      {/* Indicador equipado */}
                      {invItem.is_equipped && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 7, height: 7, borderRadius: '50%',
                          background: r.color, boxShadow: `0 0 6px ${r.color}`,
                        }} />
                      )}

                      <div style={{
                        fontSize: '1.6rem', marginBottom: '0.3rem',
                        filter: invItem.is_equipped ? `drop-shadow(0 0 8px ${r.color})` : 'none',
                      }}>
                        {displayIcon}
                      </div>

                      <p style={{
                        fontSize: '0.6rem', color: invItem.is_equipped ? '#e0e0e0' : '#888899',
                        lineHeight: 1.3, marginBottom: '0.2rem',
                        fontFamily: 'Inter, sans-serif',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.item_name}
                      </p>

                      {item.description && (
                        <p style={{
                          fontSize: '0.52rem',
                          color: '#444466',
                          marginTop: '0.15rem',
                          lineHeight: 1.3,
                          fontFamily: 'Inter, sans-serif',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {item.description}
                        </p>
                      )}

                      <p style={{
                        fontFamily: 'Orbitron, sans-serif', fontSize: '0.5rem',
                        color: r.color, letterSpacing: '0.06em',
                        textShadow: invItem.is_equipped ? `0 0 6px ${r.glow}` : 'none',
                        marginTop: '0.2rem',
                      }}>
                        {RARITY_LABELS_PT[rarityKey]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        })()}

        {/* Tab: Amigos */}
        {activeTab === 'friends' && (
          <div>
            {!friends || friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#333350' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</p>
                <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                  Nenhum amigo ainda
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                {friends.map((f: any) => (
                  <Link key={f.id} href={`/profile/${f.username}`} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 100, textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,242,255,0.4)'
                    e.currentTarget.style.background = 'rgba(0,242,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, color: '#050505', overflow: 'hidden',
                    }}>
                      {f.avatar_url
                        ? <img src={f.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : f.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <EffectRenderer
                        username={f.username}
                        effect={f.effect}
                        size="sm"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      {openingBox && (
        <LootboxOpener
          lootboxId={openingBox.id}
          lootboxRarity={openingBox.rarity}
          userId={userId}
          onClose={() => {
            setOpeningBox(null)
            // Recarrega dados sem refresh de página
            Promise.all([loadLootboxes(), loadInventory()]).then(() => {
              onProfileUpdate?.()
            })
          }}
          onResult={(item) => {
            setLastDrop(item)
          }}
        />
      )}
    </div>
  )
}
