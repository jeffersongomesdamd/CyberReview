import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f2ff',
          purple: '#bc13fe',
          pink: '#ff2079',
          green: '#00ff9d',
        },
        dark: {
          bg: '#050505',
          surface: '#0d0d0d',
          card: '#111118',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0,242,255,0.4), 0 0 40px rgba(0,242,255,0.1)',
        'glow-purple': '0 0 20px rgba(188,19,254,0.4), 0 0 40px rgba(188,19,254,0.1)',
        'glow-pink': '0 0 20px rgba(255,32,121,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00f2ff, #bc13fe)',
        'gradient-dark': 'linear-gradient(180deg, #0d0d0d 0%, #050505 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: '#00f2ff' },
          '50%': { borderColor: '#bc13fe' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,242,255,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(188,19,254,0.6)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        borderGlow: 'borderGlow 3s ease infinite',
        fadeIn: 'fadeIn 0.3s ease forwards',
        pulseGlow: 'pulseGlow 2s ease infinite',
      },
    },
  },
  plugins: [],
}

export default config
