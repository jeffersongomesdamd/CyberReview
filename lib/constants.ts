// ─── LIMITES DA APLICAÇÃO ───────────────────────────────────────
export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  CATEGORY_NAME_MIN: 2,
  CATEGORY_NAME_MAX: 25,
  REVIEW_TITLE_MIN: 2,
  REVIEW_TITLE_MAX: 80,
  REVIEW_DESCRIPTION_MAX: 1000,
  ATTRIBUTE_LABEL_MAX: 40,
  ATTRIBUTE_COUNT_MAX: 15,
  ATTRIBUTE_COUNT_MIN: 1,
  COMMENT_MIN: 1,
  COMMENT_MAX: 500,
  BIO_MAX: 200,
  IMAGE_MAX_MB: 5,
  REVIEWS_PER_PAGE: 12,
  FRIENDS_PREVIEW: 8,
}

// ─── XP POR AÇÃO ────────────────────────────────────────────────
export const XP_VALUES = {
  CREATE_REVIEW: 50,
  FIRST_REVIEW_BONUS: 100,
  RECEIVE_LIKE: 5,
  RECEIVE_CLONE: 20,
  RECEIVE_COMMENT: 3,
  SEND_COMMENT: 2,
  FRIEND_ADDED: 10,
  DAILY_LOGIN: 5,
}

// ─── FÓRMULA DE XP ──────────────────────────────────────────────
// XP total necessário para ATINGIR o nível N: 50 * N²
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * (level - 1) * (level - 1)
}

export function getLevelFromXp(xp: number): number {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1
  return Math.min(level, 100)
}

export function getXpProgress(xp: number, prestige = 0): {
  level: number
  xpIntoLevel: number
  xpNeededForNext: number
  progress: number
  prestige: number
} {
  const level = getLevelFromXp(xp)
  
  if (level >= 100) {
    return { level: 100, xpIntoLevel: xp, xpNeededForNext: 0, progress: 100, prestige }
  }

  const xpCurrentLevel = xpRequiredForLevel(level)
  const xpNextLevel = xpRequiredForLevel(level + 1)
  const xpIntoLevel = xp - xpCurrentLevel
  const xpNeededForNext = xpNextLevel - xpCurrentLevel
  const progress = Math.min(100, (xpIntoLevel / xpNeededForNext) * 100)

  return { level, xpIntoLevel, xpNeededForNext, progress, prestige }
}

export const XP_FOR_PRESTIGE = xpRequiredForLevel(100)

// ─── TIERS DE RANK ──────────────────────────────────────────────
export const RANK_TIERS = [
  { minLevel: 1,  maxLevel: 10,  rank: 'INICIANTE',    color: '#888899', glow: 'rgba(136,136,153,0.4)',  gradient: ['#888899','#666680'] },
  { minLevel: 11, maxLevel: 20,  rank: 'OBSERVADOR',   color: '#00d4ff', glow: 'rgba(0,212,255,0.4)',   gradient: ['#00d4ff','#0099cc'] },
  { minLevel: 21, maxLevel: 30,  rank: 'ANALISTA',     color: '#00f2ff', glow: 'rgba(0,242,255,0.5)',   gradient: ['#00f2ff','#00aadd'] },
  { minLevel: 31, maxLevel: 40,  rank: 'CRÍTICO',      color: '#00ff9d', glow: 'rgba(0,255,157,0.5)',   gradient: ['#00ff9d','#00cc7a'] },
  { minLevel: 41, maxLevel: 50,  rank: 'CURADOR',      color: '#7dff00', glow: 'rgba(125,255,0,0.5)',   gradient: ['#7dff00','#55cc00'] },
  { minLevel: 51, maxLevel: 60,  rank: 'ESPECIALISTA', color: '#bc13fe', glow: 'rgba(188,19,254,0.5)',  gradient: ['#bc13fe','#8800cc'] },
  { minLevel: 61, maxLevel: 70,  rank: 'VISIONÁRIO',   color: '#ff7700', glow: 'rgba(255,119,0,0.5)',   gradient: ['#ff7700','#cc5500'] },
  { minLevel: 71, maxLevel: 80,  rank: 'MESTRE',       color: '#ff2079', glow: 'rgba(255,32,121,0.5)',  gradient: ['#ff2079','#cc0055'] },
  { minLevel: 81, maxLevel: 90,  rank: 'ÉLITE',        color: '#ffd700', glow: 'rgba(255,215,0,0.6)',   gradient: ['#ffd700','#ffaa00'] },
  { minLevel: 91, maxLevel: 99,  rank: 'LENDÁRIO',     color: '#ff6ef7', glow: 'rgba(255,110,247,0.6)', gradient: ['#ff6ef7','#bc13fe'] },
  { minLevel: 100,maxLevel: 100, rank: 'CYBER GOD',    color: 'ANIMATED', glow: 'rgba(255,255,255,0.8)', gradient: ['#00f2ff','#bc13fe','#ff2079','#ffd700'] },
]

export function getRankTier(level: number) {
  return RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) ?? RANK_TIERS[0]
}

export function getLevelInfo(xp: number, prestige = 0) {
  const progressData = getXpProgress(xp, prestige)
  const tier = getRankTier(progressData.level)
  const nextTier = RANK_TIERS.find(t => t.minLevel > progressData.level) ?? null
  
  return {
    ...tier,
    ...progressData,
    xp,
    nextTier,
    xpToNextLevel: progressData.xpNeededForNext - progressData.xpIntoLevel,
  }
}

// ─── RECOMPENSAS POR NÍVEL ──────────────────────────────────────
export type RewardType = 'lootbox' | 'color' | 'frame' | 'emoji' | 'theme' | 'effect' | 'title' | 'badge' | 'boost'
export type LootboxRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface LevelReward {
  level: number
  rewards: Array<{
    type: RewardType
    label: string
    description: string
    rarity?: LootboxRarity
    icon: string
  }>
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 5,  rewards: [{ type: 'color',   icon: '🎨', label: 'Cor de Perfil',        description: 'Desbloqueie cores para seu perfil',          rarity: 'common'  }, { type: 'badge', icon: '🔓', label: 'Upload de Avatar', description: 'Agora você pode fazer upload de avatar', rarity: 'common' }] },
  { level: 10, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox Comum',         description: '1 drop aleatório',                            rarity: 'common'  }] },
  { level: 15, rewards: [{ type: 'color',   icon: '🌈', label: 'Gradiente de Perfil',   description: 'Cores em gradiente para seu perfil',          rarity: 'rare'    }] },
  { level: 20, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox (chance raro)', description: 'Chance aumentada de item raro',               rarity: 'rare'    }] },
  { level: 25, rewards: [{ type: 'frame',   icon: '🖼️', label: 'Moldura de Avatar',     description: 'Moldura simples para seu avatar',             rarity: 'rare'    }] },
  { level: 30, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox',               description: '1 drop aleatório',                            rarity: 'rare'    }] },
  { level: 35, rewards: [{ type: 'emoji',   icon: '😊', label: 'Emoji Exclusivo',        description: 'Emoji especial para usar em reviews',        rarity: 'rare'    }] },
  { level: 40, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox (raro garantido)', description: 'Item raro garantido no drop',             rarity: 'rare'    }] },
  { level: 45, rewards: [{ type: 'effect',  icon: '✨', label: 'Efeito de Hover',        description: 'Animação leve no seu perfil',                 rarity: 'epic'    }] },
  { level: 50, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox + Selo',         description: 'Loot + Selo especial visível em reviews',    rarity: 'epic'    }, { type: 'badge', icon: '🏅', label: 'Selo de Curador', description: 'Aparece em todas suas reviews', rarity: 'epic' }] },
  { level: 55, rewards: [{ type: 'theme',   icon: '🎨', label: 'Tema Dark+',             description: 'Variação do tema escuro',                     rarity: 'epic'    }] },
  { level: 60, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox (chance épico)', description: 'Chance aumentada de item épico',             rarity: 'epic'    }] },
  { level: 65, rewards: [{ type: 'effect',  icon: '✨', label: 'Glow no Nome',           description: 'Seu nome brilha no feed e perfil',            rarity: 'epic'    }] },
  { level: 70, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox',               description: '1 drop aleatório',                            rarity: 'epic'    }] },
  { level: 75, rewards: [{ type: 'theme',   icon: '💜', label: 'Tema Neon Premium',      description: 'Tema neon/cyber exclusivo',                   rarity: 'epic'    }] },
  { level: 80, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox (épico garantido)', description: 'Item épico garantido',                   rarity: 'epic'    }] },
  { level: 85, rewards: [{ type: 'boost',   icon: '🔥', label: 'Destaque em Reviews',    description: 'Suas reviews aparecem com destaque visual',  rarity: 'epic'    }] },
  { level: 90, rewards: [{ type: 'lootbox', icon: '🎁', label: 'Lootbox',               description: '1 drop aleatório',                            rarity: 'legendary' }] },
  { level: 95, rewards: [{ type: 'effect',  icon: '💫', label: 'Partículas no Perfil',   description: 'Partículas animadas no seu perfil',          rarity: 'legendary' }] },
  { level: 100,rewards: [{ type: 'title',   icon: '👑', label: 'Título Customizável',    description: 'Escolha seu próprio título',                  rarity: 'legendary' }, { type: 'boost', icon: '🌐', label: 'Destaque Global', description: 'Apareça em destaque no feed global', rarity: 'legendary' }, { type: 'lootbox', icon: '💎', label: 'Lootbox LENDÁRIA', description: 'Drop lendário garantido', rarity: 'legendary' }] },
]

export function getRewardForLevel(level: number): LevelReward | null {
  return LEVEL_REWARDS.find(r => r.level === level) ?? null
}

// ─── LOOTBOX ────────────────────────────────────────────────────
export type LootboxRarityKey = 'common' | 'rare' | 'epic' | 'legendary'

export const LOOTBOX_ODDS: Record<LootboxRarityKey, number> = {
  common:    0.60,
  rare:      0.25,
  epic:      0.10,
  legendary: 0.05,
}

export const RARITY_COLORS: Record<LootboxRarityKey, { color: string; glow: string; label: string }> = {
  common:    { color: '#888899', glow: 'rgba(136,136,153,0.5)', label: 'COMUM'    },
  rare:      { color: '#00f2ff', glow: 'rgba(0,242,255,0.6)',   label: 'RARA'     },
  epic:      { color: '#bc13fe', glow: 'rgba(188,19,254,0.7)',  label: 'ÉPICA'    },
  legendary: { color: '#ffd700', glow: 'rgba(255,215,0,0.8)',   label: 'LENDÁRIA' },
}

export function rollLootbox(guaranteedRarity?: LootboxRarityKey): LootboxRarityKey {
  if (guaranteedRarity) return guaranteedRarity
  const roll = Math.random()
  if (roll < LOOTBOX_ODDS.legendary) return 'legendary'
  if (roll < LOOTBOX_ODDS.legendary + LOOTBOX_ODDS.epic) return 'epic'
  if (roll < LOOTBOX_ODDS.legendary + LOOTBOX_ODDS.epic + LOOTBOX_ODDS.rare) return 'rare'
  return 'common'
}
