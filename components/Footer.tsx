'use client'

import { useState } from 'react'
import { Heart, Bug, Info, ExternalLink } from 'lucide-react'

function PixKey({ pixKey }: { pixKey: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '0.5rem 0.75rem',
      marginBottom: '0.5rem',
    }}>
      <span style={{
        flex: 1, fontFamily: 'monospace', fontSize: '0.72rem',
        color: '#888899', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {pixKey}
      </span>
      <button
        onClick={handleCopy}
        style={{
          background: copied ? 'rgba(0,255,157,0.1)' : 'rgba(0,242,255,0.08)',
          border: `1px solid ${copied ? 'rgba(0,255,157,0.4)' : 'rgba(0,242,255,0.3)'}`,
          borderRadius: 6, padding: '0.25rem 0.625rem',
          color: copied ? '#00ff9d' : '#00f2ff',
          fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem',
          letterSpacing: '0.06em', cursor: 'pointer',
          transition: 'all 0.2s', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? '✓ COPIADO' : 'COPIAR'}
      </button>
    </div>
  )
}

export default function Footer() {
  const [bugOpen, setBugOpen] = useState(false)
  const [bugText, setBugText] = useState('')
  const [bugSent, setBugSent] = useState(false)
  const [pixOpen, setPixOpen] = useState(false)

  const handleSendBug = () => {
    if (!bugText.trim()) return
    // Abre email com o report preenchido
    const subject = encodeURIComponent('[CyberReview] Bug Report')
    const body = encodeURIComponent(`DESCRIÇÃO DO BUG:\n${bugText}\n\nURL: ${window.location.href}\nData: ${new Date().toLocaleString('pt-BR')}`)
    window.open(`mailto:jeffersongomesdamd@gmail.com?subject=${subject}&body=${body}`)
    setBugSent(true)
    setTimeout(() => { setBugOpen(false); setBugSent(false); setBugText('') }, 2000)
  }

  return (
    <>
      <footer style={{
        marginTop: '4rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#0a0a12',
        padding: '2rem 1.5rem',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
          gap: '1.5rem',
        }}>

          {/* Logo */}
          <div>
            <p style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.08em', marginBottom: '0.25rem',
            }}>
              CYBER REVIEW
            </p>
            <p style={{ fontSize: '0.72rem', color: '#333350' }}>
              Ranqueie qualquer coisa
            </p>
          </div>

          {/* Links centrais */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

            {/* Sobre */}
            <button
              onClick={() => {
                document.getElementById('modal-sobre')?.classList.toggle('hidden')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: 'transparent', border: 'none',
                color: '#555570', fontSize: '0.75rem',
                fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00f2ff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555570')}
            >
              <Info size={13} /> SOBRE
            </button>

            {/* Report de bug */}
            <button
              onClick={() => setBugOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: 'transparent', border: 'none',
                color: '#555570', fontSize: '0.75rem',
                fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff2079')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555570')}
            >
              <Bug size={13} /> REPORTAR BUG
            </button>

            {/* Doação */}
            <button
              onClick={() => setPixOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 1rem',
                background: 'linear-gradient(135deg, rgba(255,32,121,0.15), rgba(188,19,254,0.1))',
                border: '1px solid rgba(255,32,121,0.35)',
                borderRadius: 8, color: '#ff2079',
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem',
                letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 16px rgba(255,32,121,0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,32,121,0.25), rgba(188,19,254,0.2))'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,32,121,0.15), rgba(188,19,254,0.1))'
              }}
            >
              <Heart size={13} fill="#ff2079" /> ☕ CAFÉ PRO DEV
            </button>
          </div>

          {/* Copyright */}
          <p style={{ fontSize: '0.68rem', color: '#222235', fontFamily: 'Inter, sans-serif' }}>
            © {new Date().getFullYear()} CyberReview
          </p>
        </div>
      </footer>

      {/* Modal Sobre */}
      <div
        id="modal-sobre"
        className="hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={() => document.getElementById('modal-sobre')?.classList.add('hidden')}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#0d0d18',
            border: '1px solid rgba(0,242,255,0.2)',
            borderRadius: 16, padding: '2rem',
            maxWidth: 460, width: '100%',
            boxShadow: '0 0 60px rgba(0,242,255,0.1)',
          }}
        >
          <h2 style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}>
            SOBRE O CYBERREVIEW
          </h2>
          <p style={{ color: '#888899', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            CyberReview é uma plataforma universal de reviews com estética cyberpunk.
            Ranqueie qualquer coisa — jogos, filmes, carros, pessoas — com atributos
            completamente customizáveis.
          </p>
          <p style={{ color: '#888899', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Clone reviews de outros usuários, ganhe XP, suba de nível e desbloqueie
            itens exclusivos através do sistema de lootboxes.
          </p>
          <div style={{
            padding: '0.875rem',
            background: 'rgba(0,242,255,0.04)',
            border: '1px solid rgba(0,242,255,0.15)',
            borderRadius: 10,
            fontSize: '0.75rem', color: '#444466',
            fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
          }}>
            Feito com ❤️ por um dev independente
          </div>
          <button
            onClick={() => document.getElementById('modal-sobre')?.classList.add('hidden')}
            style={{
              marginTop: '1.25rem', width: '100%', padding: '0.625rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#555570',
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            FECHAR
          </button>
        </div>
      </div>

      {/* Modal Report de Bug */}
      {bugOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setBugOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0d18',
              border: '1px solid rgba(255,32,121,0.25)',
              borderRadius: 16, padding: '2rem',
              maxWidth: 460, width: '100%',
              boxShadow: '0 0 60px rgba(255,32,121,0.08)',
            }}
          >
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '1rem',
              color: '#ff2079', marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Bug size={18} /> REPORTAR BUG
            </h2>
            <p style={{ color: '#555570', fontSize: '0.78rem', marginBottom: '1rem' }}>
              Descreva o problema com o máximo de detalhes possível.
            </p>

            {bugSent ? (
              <div style={{
                textAlign: 'center', padding: '1.5rem',
                color: '#00ff9d', fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem',
              }}>
                ✓ Obrigado pelo report!
              </div>
            ) : (
              <>
                <textarea
                  value={bugText}
                  onChange={e => setBugText(e.target.value)}
                  placeholder="Ex: Ao clicar em 'Ver' em qualquer review, aparece erro 404..."
                  rows={5}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, color: '#e0e0e0', padding: '0.75rem',
                    fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                    resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#ff2079')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleSendBug}
                    disabled={!bugText.trim()}
                    style={{
                      flex: 1, padding: '0.625rem',
                      background: bugText.trim()
                        ? 'rgba(255,32,121,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${bugText.trim() ? 'rgba(255,32,121,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8,
                      color: bugText.trim() ? '#ff2079' : '#333350',
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      cursor: bugText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Bug size={13} style={{ display: 'inline', marginRight: 6 }} />
                    ENVIAR REPORT
                  </button>
                  <button
                    onClick={() => setBugOpen(false)}
                    style={{
                      padding: '0.625rem 1rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, color: '#444466',
                      fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    CANCELAR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal PIX */}
      {pixOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setPixOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0d18',
              border: '1px solid rgba(255,32,121,0.25)',
              borderRadius: 20, padding: '2rem',
              maxWidth: 380, width: '100%',
              boxShadow: '0 0 60px rgba(255,32,121,0.1), 0 0 120px rgba(188,19,254,0.05)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Linha de acento topo */}
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
              background: 'linear-gradient(90deg, transparent, #ff2079, #bc13fe, transparent)',
              borderRadius: 2,
            }} />

            {/* Ícone */}
            <div style={{
              fontSize: '3rem', marginBottom: '0.75rem',
              filter: 'drop-shadow(0 0 12px rgba(255,32,121,0.5))',
            }}>
              ☕
            </div>

            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #ff2079, #bc13fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.08em', marginBottom: '0.375rem',
            }}>
              COMPRE UM CAFÉ
            </h2>

            <p style={{
              fontSize: '0.78rem', color: '#666680', lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}>
              Se o CyberReview te ajudou a descobrir algo incrível,
              considere pagar um café pro dev! ❤️
            </p>

            {/* QR Code */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12, padding: '1rem',
              marginBottom: '1.25rem',
              display: 'inline-block',
              boxShadow: '0 0 30px rgba(255,32,121,0.2)',
            }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://nubank.com.br/cobrar/qekhh/69bedd82-525d-4838-aa9d-84bcdbbac0cb"
                alt="QR Code PIX"
                width={200}
                height={200}
                style={{ display: 'block', borderRadius: 6 }}
              />
            </div>

            <p style={{
              fontSize: '0.65rem', color: '#444466',
              fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              ESCANEIE O QR CODE OU USE A CHAVE PIX
            </p>

            {/* Chave PIX com botão de copiar */}
            <PixKey pixKey="221fca2f-6b0c-4218-add2-efc26ec66396" />

            {/* Link direto */}
            <a
              href="https://nubank.com.br/cobrar/qekhh/69bedd82-525d-4838-aa9d-84bcdbbac0cb"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.375rem', marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'rgba(188,19,254,0.06)',
                border: '1px solid rgba(188,19,254,0.2)',
                borderRadius: 8, color: '#bc13fe',
                fontSize: '0.68rem', fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.08em', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(188,19,254,0.12)'
                el.style.boxShadow = '0 0 12px rgba(188,19,254,0.2)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(188,19,254,0.06)'
                el.style.boxShadow = 'none'
              }}
            >
              <ExternalLink size={12} /> ABRIR NO NUBANK
            </a>

            <button
              onClick={() => setPixOpen(false)}
              style={{
                marginTop: '1rem', width: '100%', padding: '0.5rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, color: '#333350',
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem',
                cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#666680')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333350')}
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      <style>{`.hidden { display: none !important; }`}</style>
    </>
  )
}
