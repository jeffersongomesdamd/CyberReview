'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Category, AttributeTemplate } from '@/lib/types'
import { toast } from 'react-hot-toast'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Category[]
    }
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCategory: { name: string; icon: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select()
        .single()
      
      if (error) throw error
      return data as Category
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], (old: Category[] | undefined) => {
        return old ? [...old, data].sort((a, b) => a.name.localeCompare(b.name)) : [data]
      })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar categoria: ${error.message}`)
    }
  })
}

export const useAttributeTemplates = (categoryId: string | null) => {
  return useQuery({
    queryKey: ['attribute-templates', categoryId],
    queryFn: async () => {
      if (!categoryId) return []
      const { data, error } = await supabase
        .from('attribute_templates')
        .select('*')
        .eq('category_id', categoryId)
      
      if (error) throw error
      return data as AttributeTemplate[]
    },
    enabled: !!categoryId
  })
}
