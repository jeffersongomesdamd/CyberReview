'use client'

import React, { useState } from 'react'
import { useCreateCategory } from '@/lib/hooks/useCategories'
import { Plus, Check, X } from 'lucide-react'

const EMOJIS = ['🎮','🎬','📺','🎵','📚','⛩️','🚗','🍽️','📦','👤','📍','⚽','🏀','🎯','🎲','🎸','🍕','🌍','🏆','💻','💎','🔥','🕹️','📱']

interface CategoryManagerProps {
  onSuccess?: (categoryId: string) => void
  onCancel?: () => void
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏷️')
  const createCategory = useCreateCategory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const result = await createCategory.mutateAsync({ name, icon })
      if (onSuccess) onSuccess(result.id)
      setName('')
    } catch (err) {
      // Error handled in hook
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-black font-orbitron font-orbitron text-neon-blue">NOVA CATEGORIA</h4>
        {onCancel && (
          <button onClick={onCancel} className="text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground uppercase mb-1">Nome da Categoria</label>
          <input
            type="text"
            placeholder="Ex: Board Games"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus:border-neon-blue outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground uppercase mb-1">Ícone</label>
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-black/30 rounded-lg custom-scrollbar">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  icon === e ? 'bg-neon-blue/20 ring-1 ring-neon-blue scale-110' : 'hover:bg-white/5'
                }`}
                onClick={() => setIcon(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={createCategory.isPending}
          className="w-full btn-primary py-2 flex items-center justify-center gap-2 text-sm"
        >
          {createCategory.isPending ? 'CRIANDO...' : (
            <>
              <Check className="w-4 h-4" /> CRIAR CATEGORIA
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default CategoryManager
