'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 150)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grade de fundo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,242,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,242,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,32,121,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* 404 */}
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 'clamp(6rem, 20vw, 12rem)',
        fontWeight: 900,
        lineHeight: 1,
        marginBottom: '1rem',
        position: 'relative',
        color: '#ff2079',
        textShadow: '0 0 40px rgba(255,32,121,0.5)',
        filter: glitch
          ? 'drop-shadow(4px 0 0 #00f2ff) drop-shadow(-4px 0 0 #bc13fe)'
          : 'none',
        transition: 'filter 0.05s',
      }}>
        404
      </div>

      {/* Mensagem */}
      <h1 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
        fontWeight: 900,
        color: '#e0e0e0',
        letterSpacing: '0.1em',
        marginBottom: '0.75rem',
        textAlign: 'center',
      }}>
        SINAL PERDIDO
      </h1>

      <p style={{
        color: '#444466',
        fontSize: '0.9rem',
        textAlign: 'center',
        maxWidth: 400,
        lineHeight: 1.7,
        marginBottom: '2.5rem',
      }}>
        A página que você procura não existe ou foi movida para outra dimensão.
      </p>

      {/* Código de erro decorativo */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#333350',
        marginBottom: '2rem',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        <span style={{ color: '#00f2ff' }}>ERROR</span> :: PAGE_NOT_FOUND<br />
        <span style={{ color: '#bc13fe' }}>CODE</span> :: 0x404<br />
        <span style={{ color: '#ff2079' }}>STATUS</span> :: SIGNAL_LOST
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '0.75rem 1.75rem',
            background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
            border: 'none', borderRadius: 10,
            color: '#050505',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.8rem', fontWeight: 900,
            letterSpacing: '0.1em', cursor: 'pointer',
            boxShadow: '0 0 24px rgba(0,242,255,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 0 40px rgba(0,242,255,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 0 24px rgba(0,242,255,0.3)'
          }}
          >
            ← VOLTAR AO FEED
          </button>
        </Link>

        <Link href="/auth" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '0.75rem 1.75rem',
            background: 'transparent',
            border: '1px solid rgba(255,32,121,0.4)',
            borderRadius: 10, color: '#ff2079',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.8rem', letterSpacing: '0.1em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,32,121,0.08)'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(255,32,121,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
          >
            FAZER LOGIN
          </button>
        </Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
      `}</style>
    </div>
  )
}
