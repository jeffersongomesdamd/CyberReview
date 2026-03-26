import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cyberreview-one.vercel.app'),
  title: {
    default: 'CyberReview — Ranqueie Qualquer Coisa',
    template: '%s | CyberReview',
  },
  description: 'Plataforma universal de reviews com estética cyberpunk. Ranqueie jogos, filmes, carros e qualquer coisa com atributos customizáveis.',
  keywords: ['review', 'ranqueamento', 'cyberpunk', 'avaliação', 'gaming'],
  authors: [{ name: 'CyberReview' }],
  creator: 'CyberReview',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'CyberReview',
    title: 'CyberReview — Ranqueie Qualquer Coisa',
    description: 'Plataforma universal de reviews com estética cyberpunk.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CyberReview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CyberReview',
    description: 'Ranqueie qualquer coisa com estética cyberpunk.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${orbitron.variable} font-sans`}>
        <Providers>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0d0d0d',
                  color: '#e0e0e0',
                  border: '1px solid rgba(255,255,255,0.1)',
                },
              }}
            />
            <main>
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
