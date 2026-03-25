'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Friendship, FriendStatus } from '@/lib/types'
import { toast } from 'react-hot-toast'

export const useFriendStatus = (userId: string, currentUserId: string | undefined) => {
  return useQuery({
    queryKey: ['friend-status', userId, currentUserId],
    queryFn: async () => {
      if (!currentUserId || userId === currentUserId) return 'none' as FriendStatus

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
        .maybeSingle()

      if (error) throw error
      if (!data) return 'none' as FriendStatus
      if (data.status === 'accepted') return 'accepted' as FriendStatus
      if (data.requester_id === currentUserId) return 'pending_sent' as FriendStatus
      return 'pending_received' as FriendStatus
    },
    enabled: !!currentUserId && !!userId
  })
}

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friend-status', variables.addresseeId] })
      toast.success('Solicitação de amizade enviada!')
    }
  })
}

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .match({ requester_id: requesterId, addressee_id: addresseeId })
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friend-status', variables.requesterId] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Solicitação aceita!')
    }
  })
}

export const useRemoveFriend = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, currentUserId }: { userId: string; currentUserId: string }) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friend-status', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Amizade removida.')
    }
  })
}

export const useFriends = (userId: string) => {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester:requester_id (id, username, avatar_url),
          addressee:addressee_id (id, username, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

      if (error) throw error

      return data.map((f: any) =>
        f.requester.id === userId ? f.addressee : f.requester
      )
    },
    enabled: !!userId
  })
}

export const usePendingRequests = (userId?: string) => {
  return useQuery({
    queryKey: ['pending-requests', userId],
    queryFn: async () => {
      if (!userId) return 0

      const { data, error } = await supabase
        .from('friendships')
        .select('id')
        .eq('addressee_id', userId)
        .eq('status', 'pending')

      if (error) throw error

      return data.length
    },
    enabled: !!userId
  })
}
