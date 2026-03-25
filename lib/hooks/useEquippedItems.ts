import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface EquippedItems {
  color:           { hex?: string; gradient?: string[]; animated?: boolean } | null
  frame:           { style?: string; color?: string; animated?: boolean; particles?: boolean } | null
  effect:          { effect?: string; intensity?: string } | null
  theme:           { id?: string; theme?: string } | null
  badge:           { badge?: string } | null
  title:           { text?: string } | null
  profile_banner:  { style?: string } | null
  review_style:    { style?: string } | null
  reaction_effect: { effect?: string; color?: string; animated?: boolean } | null
  emoji:           { emoji?: string } | null
  boost:           { type?: string } | null
  raw: Record<string, any>
}

export const EMPTY_EQUIPPED: EquippedItems = {
  color: null, frame: null, effect: null, theme: null,
  badge: null, title: null, profile_banner: null,
  review_style: null, reaction_effect: null, emoji: null,
  boost: null,
  raw: {}
}

export async function fetchEquippedItems(userId: string): Promise<EquippedItems> {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('item_type, item_value')
    .eq('user_id', userId)
    .eq('is_equipped', true)

  if (error || !data) return EMPTY_EQUIPPED

  const result: EquippedItems = { ...EMPTY_EQUIPPED, raw: {} }

  data.forEach(row => {
    const val = typeof row.item_value === 'string'
      ? JSON.parse(row.item_value)
      : row.item_value
    if (!val) return

    // O campo 'value' dentro do item_value contém os atributos reais do item
    const itemValue = val.value ?? {}
    const type = row.item_type as keyof Omit<EquippedItems, 'raw'>

    if (type in result) {
      (result as any)[type] = itemValue
      result.raw[type] = val
    }
  })

  return result
}

export function useEquippedItems(userId: string | null) {
  const [equipped, setEquipped] = useState<EquippedItems>(EMPTY_EQUIPPED)
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const e = await fetchEquippedItems(userId)
    setEquipped(e)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()

    if (!userId) return

    // Listener em tempo real — qualquer mudança no inventário do usuário
    const channel = supabase
      .channel(`inventory:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${userId}`,
      }, () => {
        // Recarrega itens equipados automaticamente
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  return { equipped, loading, refresh: load }
}
