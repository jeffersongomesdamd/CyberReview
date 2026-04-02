// DICA: Para desativar confirmação de e-mail em dev:
// Supabase Dashboard → Authentication → Settings → desativar "Enable email confirmations"
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { LIMITS } from '@/lib/constants'

import { supabase } from '@/lib/supabaseClient'

export default function AuthClient() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (tab === 'signup') {
      if (form.username.trim().length < LIMITS.USERNAME_MIN) { setError(`Username deve ter no mínimo ${LIMITS.USERNAME_MIN} caracteres.`); return }
      if (form.username.trim().length > LIMITS.USERNAME_MAX) { setError(`Username muito longo (máx. ${LIMITS.USERNAME_MAX} caracteres).`); return }
      if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) { setError('Username só pode conter letras, números, _, . e -'); return }

      // Verificar se username já existe:
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', form.username.trim())
        .maybeSingle()

      if (existing) {
        setError('Este nickname já está em uso. Escolha outro.')
        setLoading(false)
        return
      }

      if (form.password !== form.confirmPassword) { setError('As senhas não coincidem.'); return }
      if (form.password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return }
    }

    setLoading(true)
    try {
      if (tab === 'signin') {
        await signIn(form.email, form.password)
        toast.success('Bem-vindo de volta!', { style: { background: '#111118', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)' } })
        router.push('/')
      } else {
        await signUp(form.email, form.password, form.username)
        setSignupSuccess(true)
        toast.success('Conta criada! Verifique seu e-mail.', { 
          style: { background: '#111118', color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)' },
          duration: 6000
        })
      }
    } catch (err: any) {
      const msg: string = err?.message ?? ''

      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique seus dados.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).')
      } else if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Tente fazer login.')
      } else if (msg.includes('Password should be')) {
        setError('A senha deve ter no mínimo 6 caracteres.')
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Erro de conexão. Verifique sua internet.')
      } else if (msg) {
        setError(`Erro: ${msg}`)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float1 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(188,19,254,0.07) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float2 10s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,242,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,242,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '2.5rem',
        background: '#0d0d18',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        position: 'relative',
        zIndex: 10,
        margin: '2rem',
      }}>
        {signupSuccess ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(0,255,157,0.1)',
              border: '1px solid rgba(0,255,157,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#00ff9d',
            }}>
              <Mail size={32} />
            </div>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '1.25rem', marginBottom: '1rem' }}>
              CONTA CRIADA!
            </h2>
            <p style={{ color: '#8888aa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Enviamos um link de confirmação para <strong style={{ color: '#00f2ff' }}>{form.email}</strong>.<br/><br/>
              Por favor, verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar seu perfil.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false)
                setTab('signin')
              }}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                border: 'none',
                borderRadius: 12,
                color: '#050505',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              VOLTAR PARA LOGIN
            </button>
          </div>
        ) : (
          <>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: 2,
              background: 'linear-gradient(90deg, transparent, #00f2ff, #bc13fe, transparent)',
              borderRadius: 2,
            }} />

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,242,255,0.15), rgba(188,19,254,0.15))',
                border: '1px solid rgba(0,242,255,0.3)',
                marginBottom: '1rem',
                boxShadow: '0 0 24px rgba(0,242,255,0.2)',
              }}>
                <Zap size={26} fill="#bc13fe" color="#bc13fe" />
              </div>
              <h1 style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '1.75rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
                marginBottom: '0.375rem',
              }}>
                CYBERLOGIN
              </h1>
              <p style={{ color: '#666680', fontSize: '0.8rem' }}>
                Acesse a rede neural do CyberReview
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              padding: 4,
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {(['signin', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError('') }}
                  style={{
                    padding: '0.6rem',
                    borderRadius: 7,
                    border: 'none',
                    background: tab === t
                      ? 'linear-gradient(135deg, rgba(0,242,255,0.2), rgba(188,19,254,0.2))'
                      : 'transparent',
                    color: tab === t ? '#e0e0e0' : '#666680',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: tab === t ? '0 0 12px rgba(0,242,255,0.15)' : 'none',
                    borderColor: tab === t ? 'rgba(0,242,255,0.2)' : 'transparent',
                    borderStyle: 'solid',
                    borderWidth: 1,
                  }}
                >
                  {t === 'signin' ? 'ENTRAR' : 'CADASTRAR'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Username (signup only) */}
              {tab === 'signup' && (
                <div style={{ animation: 'slideDown 0.3s ease forwards' }}>
                  <label style={{ fontSize: '0.72rem', color: '#666680', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                    USERNAME
                  </label>
                  <InputField
                    icon={<User size={15} color="#666680" />}
                    type="text"
                    placeholder="seu_username"
                    value={form.username}
                    onChange={update('username')}
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#666680', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                  E-MAIL
                </label>
                <InputField
                  icon={<Mail size={15} color="#666680" />}
                  type="email"
                  placeholder="name@matrix.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#666680', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                  SENHA
                </label>
                <InputField
                  icon={<Lock size={15} color="#666680" />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update('password')}
                  required
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444466', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#00f2ff')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#444466')}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {/* Confirm Password (signup only) */}
              {tab === 'signup' && (
                <div style={{ animation: 'slideDown 0.3s ease forwards' }}>
                  <label style={{ fontSize: '0.72rem', color: '#666680', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                    CONFIRMAR SENHA
                  </label>
                  <InputField
                    icon={<Lock size={15} color="#666680" />}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    required
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  background: 'rgba(255,32,121,0.08)',
                  border: '1px solid rgba(255,32,121,0.3)',
                  borderRadius: 8,
                  color: '#ff2079',
                  fontSize: '0.78rem',
                  animation: 'slideDown 0.2s ease',
                }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.8rem',
                  background: loading
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #00f2ff, #bc13fe)',
                  border: 'none',
                  borderRadius: 10,
                  color: loading ? '#666680' : '#050505',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 0 24px rgba(0,242,255,0.3), 0 0 48px rgba(188,19,254,0.15)',
                  transform: 'translateY(0)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    const el = e.currentTarget
                    el.style.transform = 'translateY(-2px)'
                    el.style.boxShadow = '0 0 32px rgba(0,242,255,0.5), 0 0 64px rgba(188,19,254,0.25)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = loading ? 'none' : '0 0 24px rgba(0,242,255,0.3)'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#00f2ff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    PROCESSANDO...
                  </span>
                ) : tab === 'signin' ? 'ENTRAR NA REDE' : 'CRIAR CONTA'}
              </button>
            </form>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#444466' }}>
              {tab === 'signin' ? 'Novo por aqui? ' : 'Já tem conta? '}
              <button
                onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#00f2ff', fontSize: '0.78rem',
                  fontFamily: 'Inter, sans-serif',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(0,242,255,0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.textShadow = '0 0 8px rgba(0,242,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.textShadow = 'none')}
              >
                {tab === 'signin' ? 'Crie uma conta' : 'Faça login'}
              </button>
            </p>

            {/* Back to feed */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/" style={{
                color: '#333350',
                fontSize: '0.72rem',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#666680')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333350')}
              >
                ← VOLTAR PARA O FEED
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Keyframes injected */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 30px) scale(1.08); }
        }
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/* ── Reusable input with icon ── */
interface InputFieldProps {
  icon: React.ReactNode
  rightElement?: React.ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

function InputField({ icon, rightElement, type, placeholder, value, onChange, required }: InputFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${focused ? '#00f2ff' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10,
      padding: '0.625rem 0.875rem',
      transition: 'all 0.2s ease',
      boxShadow: focused ? '0 0 0 3px rgba(0,242,255,0.1), 0 0 16px rgba(0,242,255,0.15)' : 'none',
    }}>
      {icon}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#e0e0e0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
        }}
      />
      {rightElement}
    </div>
  )
}
