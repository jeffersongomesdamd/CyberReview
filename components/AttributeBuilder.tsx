'use client'

import React from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Attribute } from '@/lib/types'
import { useAttributeTemplates } from '@/lib/hooks/useCategories'

interface AttributeBuilderProps {
  categoryId: string | null
  attributes: Attribute[]
  onChange: (attributes: Attribute[]) => void
}

const AttributeBuilder: React.FC<AttributeBuilderProps> = ({ categoryId, attributes, onChange }) => {
  const { data: templates } = useAttributeTemplates(categoryId)

  const addAttribute = (label: string = '', value: number = 5) => {
    if (attributes.length >= 20) return
    onChange([...attributes, { label, value }])
  }

  const removeAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index))
  }

  const updateAttribute = (index: number, field: keyof Attribute, value: any) => {
    const newAttrs = [...attributes]
    newAttrs[index] = { ...newAttrs[index], [field]: value }
    onChange(newAttrs)
  }

  const moveAttribute = (from: number, to: number) => {
    if (to < 0 || to >= attributes.length) return
    const newAttrs = [...attributes]
    const [moved] = newAttrs.splice(from, 1)
    newAttrs.splice(to, 0, moved)
    onChange(newAttrs)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs text-muted-foreground uppercase">Atributos Dinâmicos</label>
        <span className="text-xs text-muted-foreground">{attributes.length}/20</span>
      </div>

      <div className="space-y-2">
        {attributes.map((attr, index) => (
          <div 
            key={index} 
            className="group flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl hover:border-white/20 transition-all"
          >
            <div className="flex flex-col gap-1">
               <button 
                type="button"
                onClick={() => moveAttribute(index, index - 1)}
                className="text-muted-foreground hover:text-white transition-colors"
                disabled={index === 0}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome do Atributo (ex: Gráficos)"
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-sm focus:border-neon-blue outline-none transition-all"
                  value={attr.label}
                  onChange={(e) => updateAttribute(index, 'label', e.target.value)}
                  list={`templates-${index}`}
                />
                <datalist id={`templates-${index}`}>
                  {templates?.map(t => (
                    <option key={t.id} value={t.label} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  className="flex-1 accent-neon-blue h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', parseInt(e.target.value))}
                />
                <span className={`w-8 text-center font-black font-orbitron ${
                  attr.value >= 8 ? 'text-neon-green' : attr.value >= 5 ? 'text-neon-blue' : 'text-neon-pink'
                }`}>
                  {attr.value}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeAttribute(index)}
              className="p-2 text-muted-foreground hover:text-neon-pink transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {attributes.length < 20 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addAttribute()}
            className="flex items-center gap-2 text-xs font-bold text-neon-blue hover:text-white transition-colors border border-neon-blue/20 hover:border-neon-blue px-3 py-2 rounded-lg bg-neon-blue/5"
          >
            <Plus className="w-4 h-4" /> ADICIONAR ATRIBUTO
          </button>

          {templates && templates.length > 0 && attributes.length === 0 && (
            <div className="flex gap-2 flex-wrap">
              {templates.slice(0, 3).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addAttribute(t.label)}
                  className="text-xs text-muted-foreground hover:text-white transition-colors border border-white/10 px-2 py-1 rounded-lg"
                >
                  + {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AttributeBuilder
