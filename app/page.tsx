import type { Metadata } from 'next'
import FeedClient from './FeedClient'

export const metadata: Metadata = {
  title: 'CyberReview — Ranqueie Qualquer Coisa',
  description: 'Explore reviews de jogos, filmes, carros e muito mais na plataforma CyberReview.',
}

export default function FeedPage() {
  return <FeedClient />
}
