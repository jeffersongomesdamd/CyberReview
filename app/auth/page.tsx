import type { Metadata } from 'next'
import AuthClient from './AuthClient'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Faça login ou crie sua conta no CyberReview.',
}

export default function AuthPage() {
  return <AuthClient />
}
