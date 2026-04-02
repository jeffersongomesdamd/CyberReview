export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  xp: number
  level: number
  prestige: number
  review_count: number
  profile_color: string
  profile_theme: string
  profile_effect: string
  custom_title: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  created_by: string | null
  created_at: string
}

export interface AttributeTemplate {
  id: string
  category_id: string
  label: string
}

export interface Attribute {
  label: string
  value: number // 0–10
}

export interface Review {
  id: string
  author_id: string
  category_id: string | null
  title: string
  description: string | null
  image_url: string | null
  attributes: Attribute[]
  cloned_from: string | null
  clone_count: number
  like_count: number
  comment_count: number
  created_at: string
  // Campos de JOIN — o Supabase retorna objeto, não array
  profiles: Profile | null        // era profiles?: Profile
  categories: Category | null     // era categories?: Category
  is_liked?: boolean
}

export interface Comment {
  id: string
  review_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  profiles?: Profile
}

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export interface ReviewFormData {
  title: string
  category_id: string
  description: string
  image_file: File | null
  attributes: Attribute[]
  cloned_from?: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: 'level_up' | 'lootbox' | 'reward' | 'like' | 'comment' | 'friend' | 'system'
  title: string
  message: string | null
  metadata: Record<string, any>
  is_read: boolean
  created_at: string
}

export interface Lootbox {
  id: string
  user_id: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  status: 'unopened' | 'opened'
  acquired_at: string
  opened_at?: string | null
}

export interface Item {
  id: string
  name: string
  type: 'color' | 'theme' | 'emoji' | 'effect' | 'frame' | 'badge' | 'title' | 'boost'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  value: Record<string, any>
}
