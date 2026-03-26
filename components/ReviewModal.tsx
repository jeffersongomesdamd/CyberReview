'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Category, Review, Attribute } from '@/lib/types'
import { X, Plus, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import ReviewCelebration from './ReviewCelebration'
import { LIMITS, XP_VALUES } from '@/lib/constants'

const RARITY_PT: Record<string, string> = {
  common: 'Comum', rare: 'Rara', epic: 'Épica', legendary: 'Lendária'
}

interface Props {
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
  cloneSource?: Review | null
  editSource?: Review | null
}

export default function ReviewModal({ onClose, onSuccess, categories, cloneSource, editSource }: Props) {
  const isEdit = !!editSource
  const isClone = !!cloneSource && !isEdit
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(editSource?.title ?? cloneSource?.title ?? '')
  const [categoryId, setCategoryId] = useState(editSource?.category_id ?? cloneSource?.category_id ?? '')
  const [description, setDescription] = useState(editSource?.description ?? '')
  const [attributes, setAttributes] = useState<Attribute[]>(
    editSource?.attributes ??
    (cloneSource ? cloneSource.attributes.map(a => ({ label: a.label, value: a.value })) : [{ label: '', value: 7 }])
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️')
  const [showNewCategory, setShowNewCategory] = useState(false)
  
  const [showCelebration, setShowCelebration] = useState(false)
  const [publishedTitle, setPublishedTitle] = useState('')
  const [xpGained, setXpGained] = useState(0)
  const [oldXp, setOldXp] = useState(0)
  const [newXp, setNewXp] = useState(0)
  
  const [allCategories, setAllCategories] = useState<Category[]>([])

  // Fetch categories locally to ensure the modal works even if parent doesn't provide them
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (data && data.length > 0) {
        setAllCategories(data)
      } else if (categories.length > 0) {
        setAllCategories(categories)
      }
    }
    fetchCategories()
  }, [categories])

  const emojiGroups = {
    'Entretenimento': ['🎮','🎬','📺','🎵','📚','⛩️','🎭','🎪','🎨','🎲','🃏','🎯','🎳','🎸','🥁','🎹','🎺','🎤','🎧','📽️'],
    'Comida & Lugares': ['🍕','🍔','🍣','🍜','🌮','🍷','🍺','🧋','☕','🍰','📍','🏖️','🏔️','🌆','🏛️','✈️','🚢','🏕️','🗺️','🌍'],
    'Esportes': ['⚽','🏀','🎾','🏈','⚾','🏊','🚴','🏋️','🥊','🏆','🥇','🎿','🏄','🧗','🤸','⛷️','🎽','🏓','🥋','🏹'],
    'Tecnologia': ['💻','📱','🖥️','⌨️','📷','🎙️','🔋','💾','📡','🛸','🤖','👾','🕹️','⌚','🔭','🔬','💡','⚡','🔧','🛠️'],
    'Social': ['👤','👥','🌟','💫','✨','🔥','💎','👑','🎖️','🏅','🎗️','❤️','💜','💙','💚','🧡','🤍','🖤','💯','🎁'],
    'Natureza & Animais': ['🐕','🐈','🦁','🐺','🦊','🐻','🌿','🌸','🍀','☀️','🌙','⭐','🌊','🌋','🌵','🦋','🐬','🦅','🌺','🍄'],
    'Outros': ['📦','🛒','🏠','🚗','🛵','🚀','🔑','💰','📊','📈','⚙️','🔐','📝','📌','🗓️','⏰','🎓','🏥','🏦','🔎'],
  }

  const addAttribute = () => setAttributes(prev => [...prev, { label: '', value: 7 }])
  const removeAttribute = (i: number) => setAttributes(prev => prev.filter((_, idx) => idx !== i))
  const updateAttr = (i: number, field: 'label' | 'value', val: string | number) =>
    setAttributes(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    if (newCategoryName.trim().length < LIMITS.CATEGORY_NAME_MIN) {
      toast.error(`Nome muito curto (mín. ${LIMITS.CATEGORY_NAME_MIN} caracteres)`)
      return
    }
    if (newCategoryName.trim().length > LIMITS.CATEGORY_NAME_MAX) {
      toast.error(`Nome muito longo (máx. ${LIMITS.CATEGORY_NAME_MAX} caracteres)`)
      return
    }
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-&]+$/.test(newCategoryName.trim())) {
      toast.error('Nome de categoria contém caracteres inválidos')
      return
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), icon: newCategoryIcon, created_by: user?.id })
      .select().single()
    if (error) { toast.error('Categoria já existe ou erro ao criar'); return }
    if (data) {
      setAllCategories(prev => [...prev, data])
      setCategoryId(data.id)
      setShowNewCategory(false)
      setNewCategoryName('')
      toast.success(`Categoria "${data.name}" criada!`, { style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' } })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Você precisa estar logado.')
      return
    }

    // Validações
    const validationErrors: string[] = []

    if (!title.trim()) validationErrors.push('Título obrigatório')
    else if (title.trim().length < LIMITS.REVIEW_TITLE_MIN) validationErrors.push(`Título muito curto (mín. ${LIMITS.REVIEW_TITLE_MIN} caracteres)`)
    else if (title.trim().length > LIMITS.REVIEW_TITLE_MAX) validationErrors.push(`Título muito longo (máx. ${LIMITS.REVIEW_TITLE_MAX} caracteres)`)

    if (!categoryId) validationErrors.push('Selecione uma categoria')

    if (description.length > LIMITS.REVIEW_DESCRIPTION_MAX) validationErrors.push(`Descrição muito longa (máx. ${LIMITS.REVIEW_DESCRIPTION_MAX} caracteres)`)

    const validAttrs = attributes.filter(a => a.label.trim())
    if (validAttrs.length < LIMITS.ATTRIBUTE_COUNT_MIN) validationErrors.push('Adicione pelo menos 1 atributo')
    if (validAttrs.some(a => a.label.length > LIMITS.ATTRIBUTE_LABEL_MAX)) validationErrors.push(`Nome de atributo muito longo (máx. ${LIMITS.ATTRIBUTE_LABEL_MAX} caracteres)`)

    if (validationErrors.length > 0) {
      validationErrors.forEach(e => toast.error(e, { style: { background: '#111118', color: '#ff2079', border: '1px solid rgba(255,32,121,0.3)' } }))
      return
    }

    setLoading(true)

    try {
      let imageUrl: string | null = null

      // Upload de imagem (separado do insert para isolar erros)
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(path, imageFile, { upsert: true })

        if (uploadError) {
          toast.error(`Erro no upload da imagem: ${uploadError.message}`)
          // Não retorna — continua sem imagem
        } else {
          const { data: urlData } = supabase.storage
            .from('review-images')
            .getPublicUrl(path)
          imageUrl = urlData.publicUrl
        }
      }

      if (isEdit && editSource) {
        const { error } = await supabase
          .from('reviews')
          .update({
            title: title.trim(),
            category_id: categoryId,
            description: description.trim() || null,
            image_url: imageUrl ?? editSource.image_url,
            attributes: validAttrs,
          })
          .eq('id', editSource.id)
          .select('id')

        if (error) throw error
        toast.success('Review atualizada!', { style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' } })
        onSuccess()
        return
      }

      // Monta o payload explicitamente
      const payload = {
        author_id: user.id,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        attributes: validAttrs,
        cloned_from: cloneSource?.id ?? null,
      }


      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select('id, title') // CRÍTICO: sem .select() o Supabase não retorna erro de RLS em alguns casos

      if (error) {
        // Traduz erros comuns do Supabase
        if (error.code === '42501') {
          toast.error('Sem permissão para publicar. Verifique se está logado.')
        } else if (error.code === '23503') {
          toast.error('Categoria inválida. Selecione novamente.')
        } else if (error.code === '23502') {
          toast.error(`Campo obrigatório faltando: ${error.message}`)
        } else if (error.message?.includes('anti_spam_cooldown')) {
          toast.error('Calma aí, hacker! Aguarde um pouco antes de publicar ou clonar.', { style: { background: '#111118', color: '#ffd700', border: '1px solid #ffd700' } })
        } else {
          toast.error(`Erro ao publicar: ${error.message}`)
        }
        return
      }

      

      // ─── XP ────────────────────────────────────────────────────────
      try {
        const { count: totalReviews } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)

        const isFirst = (totalReviews ?? 0) <= 1
        const xpAmount = isFirst
          ? XP_VALUES.CREATE_REVIEW + XP_VALUES.FIRST_REVIEW_BONUS
          : XP_VALUES.CREATE_REVIEW


        const { data: xpData, error: xpErr } = await supabase
          .rpc('add_xp', { p_user_id: user.id, p_amount: xpAmount })

        if (xpErr) {
          // Fallback: atualiza XP direto se RPC falhar
          const { data: curProfile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', user.id)
            .single()

          const curXp = curProfile?.xp ?? 0
          const newXpFallback = curXp + xpAmount
          const newLevelFallback = Math.min(Math.floor(Math.sqrt(newXpFallback / 50)) + 1, 100)
          await supabase
            .from('profiles')
            .update({ xp: newXpFallback, level: newLevelFallback })
            .eq('id', user.id)
        } else {

          if (xpData?.leveled_up) {
          }

          if (xpData?.lootbox_created) {
            const rarityLabel = RARITY_PT[xpData.lootbox_rarity as keyof typeof RARITY_PT] ?? xpData.lootbox_rarity?.toUpperCase()
            toast.success(`🎁 Lootbox ${rarityLabel} desbloqueada! Veja seu perfil.`, {
              style: {
                background: '#111118',
                color: '#ffd700',
                border: '1px solid rgba(255,215,0,0.4)',
              },
              duration: 5000,
            })
          }
        }

        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('xp, level, prestige')
          .eq('id', user.id)
          .single()

        const oldXpValue = profile?.xp ?? 0
        const newXpValue = freshProfile?.xp ?? oldXpValue + xpAmount


        setXpGained(xpAmount)
        setOldXp(oldXpValue)
        setNewXp(newXpValue)
        setPublishedTitle(title.trim())
        setShowCelebration(true)

        if (refreshProfile) await refreshProfile()

      } catch (xpCatchErr) {
        setXpGained(XP_VALUES.CREATE_REVIEW)
        setOldXp(profile?.xp ?? 0)
        setNewXp((profile?.xp ?? 0) + XP_VALUES.CREATE_REVIEW)
        setPublishedTitle(title.trim())
        setShowCelebration(true)
      }

    } catch (err: any) {
      toast.error(err.message ?? 'Erro inesperado ao publicar')
    } finally {
      setLoading(false)
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0d0d18',
          border: '1px solid rgba(0,242,255,0.2)',
          borderRadius: 16,
          boxShadow: '0 0 60px rgba(0,242,255,0.1), 0 0 120px rgba(188,19,254,0.06)',
          animation: 'cardAppear 0.3s ease forwards',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, background: '#0d0d18', zIndex: 10,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {isEdit ? '✏️ EDITAR REVIEW' : isClone ? '🔀 CLONAR REVIEW' : '✦ NOVA REVIEW'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,32,121,0.1)', border: '1px solid rgba(255,32,121,0.3)',
            borderRadius: 8, padding: '0.4rem', cursor: 'pointer', color: '#ff2079',
            display: 'flex', alignItems: 'center', transition: 'all 0.2s',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isClone && cloneSource && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(188,19,254,0.06)',
              border: '1px solid rgba(188,19,254,0.25)',
              borderRadius: 10,
              marginBottom: '0.5rem',
            }}>
              <p style={{ fontSize: '0.72rem', color: '#bc13fe', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                🔀 CLONANDO ESTRUTURA DE:
              </p>
              <p style={{ fontSize: '0.8rem', color: '#e0e0e0', marginBottom: '0.25rem' }}>{cloneSource.title}</p>
              <p style={{ fontSize: '0.7rem', color: '#666680' }}>
                As notas foram copiadas — edite para dar sua própria avaliação
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>TÍTULO</label>
              <span style={{ fontSize: '0.65rem', color: title.length > LIMITS.REVIEW_TITLE_MAX * 0.9 ? '#ff2079' : '#444466' }}>
                {title.length}/{LIMITS.REVIEW_TITLE_MAX}
              </span>
            </div>
            <input
              maxLength={LIMITS.REVIEW_TITLE_MAX}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome do que você está avaliando..."
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#00f2ff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,242,255,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>CATEGORIA</label>
            <select
              value={categoryId}
              onChange={e => {
                if (e.target.value === '__new__') setShowNewCategory(true)
                else { setCategoryId(e.target.value); setShowNewCategory(false) }
              }}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" disabled style={{ background: '#0d0d18' }}>Selecione uma categoria...</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#0d0d18' }}>
                  {cat.icon} {cat.name}
                </option>
              ))}
              <option value="__new__" style={{ background: '#0d0d18', color: '#bc13fe' }}>
                ✦ Criar nova categoria...
              </option>
            </select>

            {/* New category inline form */}
            {showNewCategory && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(188,19,254,0.05)',
                border: '1px solid rgba(188,19,254,0.2)',
                borderRadius: 10,
              }}>
                <p style={{ ...labelStyle, color: '#bc13fe', marginBottom: '0.75rem' }}>NOVA CATEGORIA</p>
                <input
                  maxLength={LIMITS.CATEGORY_NAME_MAX}
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nome da categoria..."
                  style={{ ...inputStyle, marginBottom: '0.75rem' }}
                />
                <div style={{ marginBottom: '0.75rem' }}>
                  {Object.entries(emojiGroups).map(([group, emojis]) => (
                    <div key={group} style={{ marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.6rem', color: '#444466', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                        {group.toUpperCase()}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {emojis.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setNewCategoryIcon(em)}
                            title={em}
                            style={{
                              width: 32, height: 32, fontSize: '1rem',
                              background: newCategoryIcon === em ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${newCategoryIcon === em ? '#00f2ff' : 'rgba(255,255,255,0.07)'}`,
                              borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseEnter={e => { if (newCategoryIcon !== em) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                            onMouseLeave={e => { if (newCategoryIcon !== em) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={handleCreateCategory} style={{
                    flex: 1, padding: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(188,19,254,0.3), rgba(0,242,255,0.2))',
                    border: '1px solid rgba(188,19,254,0.4)',
                    borderRadius: 8, color: '#e0e0e0',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem',
                    cursor: 'pointer', letterSpacing: '0.08em',
                  }}>
                    ✦ CRIAR CATEGORIA
                  </button>
                  <button type="button" onClick={() => setShowNewCategory(false)} style={{
                    padding: '0.5rem 0.75rem',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#666680', cursor: 'pointer',
                  }}>✕</button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>DESCRIÇÃO <span style={{ color: '#444466' }}>(opcional)</span></label>
              <span style={{ fontSize: '0.65rem', color: description.length > LIMITS.REVIEW_DESCRIPTION_MAX * 0.9 ? '#ff2079' : '#444466' }}>
                {description.length}/{LIMITS.REVIEW_DESCRIPTION_MAX}
              </span>
            </div>
            <textarea
              maxLength={LIMITS.REVIEW_DESCRIPTION_MAX}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Conte mais sobre o que está avaliando..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 80,
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Image upload */}
          <div>
            <label style={labelStyle}>IMAGEM <span style={{ color: '#444466' }}>(opcional, máx 5MB)</span></label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem',
              padding: '1.5rem',
              border: `2px dashed ${imagePreview ? 'rgba(0,242,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              cursor: 'pointer',
              background: imagePreview ? 'rgba(0,242,255,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ maxHeight: 160, borderRadius: 6, objectFit: 'cover', width: '100%' }} />
              ) : (
                <>
                  <Upload size={24} color="#444466" />
                  <span style={{ color: '#666680', fontSize: '0.78rem' }}>Clique ou arraste uma imagem</span>
                  <span style={{ color: '#333350', fontSize: '0.7rem' }}>JPG, PNG, WEBP</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Attributes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={labelStyle}>ATRIBUTOS DE AVALIAÇÃO</label>
              <button
                type="button"
                onClick={addAttribute}
                disabled={attributes.length >= LIMITS.ATTRIBUTE_COUNT_MAX}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: attributes.length >= LIMITS.ATTRIBUTE_COUNT_MAX ? 'rgba(255,255,255,0.05)' : 'rgba(0,242,255,0.08)', 
                  border: `1px solid ${attributes.length >= LIMITS.ATTRIBUTE_COUNT_MAX ? 'rgba(255,255,255,0.1)' : 'rgba(0,242,255,0.3)'}`,
                  borderRadius: 6, padding: '0.3rem 0.6rem',
                  color: attributes.length >= LIMITS.ATTRIBUTE_COUNT_MAX ? '#666680' : '#00f2ff', 
                  fontSize: '0.65rem',
                  fontFamily: 'Orbitron, sans-serif', 
                  cursor: attributes.length >= LIMITS.ATTRIBUTE_COUNT_MAX ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                <Plus size={12} /> ADICIONAR
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attributes.map((attr, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0.5rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}>
                  <input
                    maxLength={LIMITS.ATTRIBUTE_LABEL_MAX}
                    value={attr.label}
                    onChange={e => updateAttr(i, 'label', e.target.value)}
                    placeholder={`Atributo ${i + 1} (ex: Gráficos)`}
                    style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
                    <span style={{
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                      color: attr.value >= 8 ? '#00ff9d' : attr.value >= 5 ? '#00f2ff' : '#ff2079',
                      marginBottom: '0.2rem',
                    }}>
                      {attr.value}/10
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={attr.value}
                      onChange={e => updateAttr(i, 'value', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(i)}
                    disabled={attributes.length <= 1}
                    style={{
                      background: 'rgba(255,32,121,0.08)',
                      border: '1px solid rgba(255,32,121,0.2)',
                      borderRadius: 6, padding: '0.4rem',
                      color: attributes.length <= 1 ? '#333' : '#ff2079',
                      cursor: attributes.length <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.875rem',
              background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00f2ff, #bc13fe)',
              border: 'none', borderRadius: 10,
              color: loading ? '#666680' : '#050505',
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 0 24px rgba(0,242,255,0.3)',
            }}
          >
            {loading ? 'PUBLICANDO...' : isEdit ? '✏️ SALVAR ALTERAÇÕES' : isClone ? '🔀 PUBLICAR CLONE' : '✦ PUBLICAR REVIEW'}
          </button>
        </form>
      </div>
    </div>
    {showCelebration && (
      <ReviewCelebration
        reviewTitle={publishedTitle}
        xpGained={xpGained}
        newXp={newXp}
        oldXp={oldXp}
        onComplete={() => {
          setShowCelebration(false)
          onSuccess()
        }}
      />
    )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#666680',
  fontFamily: 'Orbitron, sans-serif',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: '0.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#e0e0e0',
  padding: '0.625rem 0.875rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
