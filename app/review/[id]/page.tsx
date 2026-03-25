import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ReviewClient from './ReviewClient'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('reviews')
    .select('title, description, image_url, profiles(username), categories(name)')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Review não encontrada' }

  const author = (data.profiles as any)?.username
  const category = (data.categories as any)?.name

  return {
    title: data.title,
    description: data.description ?? `Review de ${data.title} por @${author} — ${category}`,
    openGraph: {
      title: `${data.title} | CyberReview`,
      description: data.description ?? `Review por @${author}`,
      images: data.image_url
        ? [{ url: data.image_url, width: 1200, height: 630 }]
        : [{ url: '/og-image.png' }],
    },
  }
}

export default function ReviewPage() {
  return <ReviewClient />
}
