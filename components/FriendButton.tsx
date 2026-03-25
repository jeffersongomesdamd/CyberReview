'use client'

import React, { useState } from 'react'
import { UserPlus, UserCheck, UserX, Clock, Check, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { 
  useFriendStatus, 
  useSendFriendRequest, 
  useAcceptFriendRequest, 
  useRemoveFriend 
} from '@/lib/hooks/useFriends'

interface FriendButtonProps {
  targetUserId: string
}

const FriendButton: React.FC<FriendButtonProps> = ({ targetUserId }) => {
  const { user } = useAuth()
  const { data: status, isLoading } = useFriendStatus(targetUserId, user?.id)
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const removeFriend = useRemoveFriend()
  
  const [isHovered, setIsHovered] = useState(false)

  if (!user || user.id === targetUserId || isLoading) return null

  if (status === 'none') {
    return (
      <button
        onClick={() => sendRequest.mutate({ requesterId: user.id, addresseeId: targetUserId })}
        disabled={sendRequest.isPending}
        className="flex items-center gap-2 px-4 py-2 border border-neon-blue text-neon-blue rounded-xl hover:bg-neon-blue/10 transition-all font-bold text-sm"
      >
        <UserPlus className="w-4 h-4" /> ADICIONAR AMIGO
      </button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-muted-foreground rounded-xl font-bold text-sm cursor-default"
      >
        <Clock className="w-4 h-4" /> SOLICITAÇÃO ENVIADA
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => acceptRequest.mutate({ requesterId: targetUserId, addresseeId: user.id })}
          disabled={acceptRequest.isPending}
          className="flex items-center gap-1 px-3 py-2 bg-neon-green/20 border border-neon-green text-neon-green rounded-xl hover:bg-neon-green/30 transition-all font-bold text-xs"
        >
          <Check className="w-4 h-4" /> ACEITAR
        </button>
        <button
          onClick={() => removeFriend.mutate({ userId: targetUserId, currentUserId: user.id })}
          disabled={removeFriend.isPending}
          className="flex items-center gap-1 px-3 py-2 bg-neon-pink/20 border border-neon-pink text-neon-pink rounded-xl hover:bg-neon-pink/30 transition-all font-bold text-xs"
        >
          <X className="w-4 h-4" /> RECUSAR
        </button>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (confirm('Remover amigo?')) {
            removeFriend.mutate({ userId: targetUserId, currentUserId: user.id })
          }
        }}
        disabled={removeFriend.isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
          isHovered 
            ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-glow-pink' 
            : 'bg-neon-green/10 border-neon-green text-neon-green'
        }`}
      >
        {isHovered ? (
          <>
            <UserX className="w-4 h-4" /> REMOVER AMIGO
          </>
        ) : (
          <>
            <UserCheck className="w-4 h-4" /> AMIGOS
          </>
        )}
      </button>
    )
  }

  return null
}

export default FriendButton
