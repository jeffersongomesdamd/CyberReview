'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Review, ReviewFormData, Attribute } from '@/lib/types'
import { toast } from 'react-hot-toast'

export const useReviews = (filters: { categoryId?: string; searchQuery?: string; authorId?: string }) => {
  return useInfiniteQuery({
    queryKey: ['reviews', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_author_id_fkey (*),
          categories:category_id (*),
          comments (count)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * 12, (pageParam + 1) * 12 - 1)

      if (filters.categoryId && filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId)
      }
      if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Review[]
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined
    }
  })
}

export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_author_id_fkey (*),
          categories:category_id (*),
          comments (count)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Review
    }
  })
}

export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: ReviewFormData & { author_id: string }) => {
      let image_url = null

      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop()
        const fileName = `${formData.author_id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, formData.image_file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName)
        
        image_url = publicUrl
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          author_id: formData.author_id,
          category_id: formData.category_id,
          title: formData.title,
          description: formData.description,
          image_url: image_url,
          attributes: formData.attributes,
          cloned_from: formData.cloned_from
        })
        .select()
        .single()
      
      if (error) throw error

      // Save new attributes as templates
      for (const attr of formData.attributes) {
        await supabase
          .from('attribute_templates')
          .upsert({ 
            category_id: formData.category_id, 
            label: attr.label,
            created_by: formData.author_id
          }, { onConflict: 'category_id, label' })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review publicada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(`Erro ao publicar review: ${error.message}`)
    }
  })
}

export const useLikeReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, userId, isLiked }: { reviewId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ user_id: userId, review_id: reviewId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, review_id: reviewId })
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review', variables.reviewId] })
    }
  })
}

export const useDeleteReview = () => {
    const queryClient = useQueryClient()
  
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('reviews')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reviews'] })
        toast.success('Review excluída.')
      }
    })
  }
