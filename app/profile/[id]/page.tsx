import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProfileClient from './ProfileClient'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('profiles')
    .select('username, bio, avatar_url, xp, level')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Perfil não encontrado' }

  return {
    title: `@${data.username}`,
    description: data.bio ?? `Perfil de @${data.username} no CyberReview — Nível ${data.level}`,
    openGraph: {
      type: 'profile',
      title: `@${data.username} | CyberReview`,
      description: data.bio ?? `Veja as reviews de @${data.username}`,
      images: data.avatar_url ? [{ url: data.avatar_url }] : [{ url: '/og-image.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${data.username} | CyberReview`,
      description: data.bio ?? `Perfil de @${data.username} no CyberReview — Nível ${data.level}`,
      images: data.avatar_url ? [data.avatar_url] : ['/og-image.png'],
    },
  }
}

export default function ProfilePage() {
  return <ProfileClient />
}
