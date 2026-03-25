export type ThemeId = 'default' | 'dark-plus' | 'cyber-dark' | 'galaxy' | 'void' | 'neon-legendary' | 'dynamic-level'

export interface ThemeColors {
  bg: string
  surface: string
  card: string
  border: string
  primary: string
  secondary: string
  text: string
  muted: string
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  'default': {
    bg: '#050505', surface: '#0d0d0d', card: '#111118',
    border: 'rgba(255,255,255,0.07)', primary: '#00f2ff',
    secondary: '#bc13fe', text: '#e0e0e0', muted: '#666680',
  },
  // Dark+ — mais escuro e azulado, atmosfera fria
  'dark-plus': {
    bg: '#010108', surface: '#04040f', card: '#07071a',
    border: 'rgba(0,100,255,0.15)', primary: '#4488ff',
    secondary: '#0033cc', text: '#aabbdd', muted: '#334466',
  },
  // Cyber Dark — verde matrix / hacker
  'cyber-dark': {
    bg: '#000800', surface: '#001200', card: '#001a00',
    border: 'rgba(0,255,70,0.15)', primary: '#00ff46',
    secondary: '#00cc33', text: '#aaffbb', muted: '#336644',
  },
  // Galaxy — roxo profundo espacial
  'galaxy': {
    bg: '#040010', surface: '#0a0020', card: '#100030',
    border: 'rgba(150,50,255,0.2)', primary: '#aa44ff',
    secondary: '#ff44aa', text: '#e8d0ff', muted: '#8855aa',
  },
  // Void — preto absoluto com roxo
  'void': {
    bg: '#000000', surface: '#050505', card: '#0a0a0a',
    border: 'rgba(188,19,254,0.15)', primary: '#bc13fe',
    secondary: '#00f2ff', text: '#ddbbff', muted: '#554477',
  },
  // Neon Legendary — branco e dourado
  'neon-legendary': {
    bg: '#000510', surface: '#000d22', card: '#001033',
    border: 'rgba(0,242,255,0.25)', primary: '#00f2ff',
    secondary: '#ffd700', text: '#ffffff', muted: '#0099aa',
  },
  // Dynamic Level — muda via JS baseado no nível
  'dynamic-level': {
    bg: '#030308', surface: '#060612', card: '#0a0a18',
    border: 'rgba(0,242,255,0.1)', primary: '#00f2ff',
    secondary: '#bc13fe', text: '#e0e0e0', muted: '#666680',
  },
}

export const THEME_ID_MAP: Record<string, ThemeId> = {
  'dark-plus':       'dark-plus',       // agora é distinto
  'cyber-dark':      'cyber-dark',      // verde matrix
  'galaxy':          'galaxy',
  'void':            'void',
  'neon-legendary':  'neon-legendary',
  'neon':            'neon-legendary',
  'dynamic-level':   'dynamic-level',
}

export function getTheme(equipped: any, levelColor?: string): ThemeColors {
  const rawId = equipped?.theme?.theme ?? equipped?.theme?.id ?? 'default'
  const themeId = THEME_ID_MAP[rawId] ?? 'default'
  const base = THEMES[themeId] ?? THEMES['default']

  // Tema dinâmico usa a cor do nível do usuário
  if (themeId === 'dynamic-level' && levelColor) {
    // Tema dinâmico usa a cor exata do nível como primária
    // e deriva o bg da mesma cor mas muito escura
    return {
      ...base,
      primary:   levelColor,
      secondary: levelColor + 'aa',
      border:    levelColor + '30',
      // bg sutil mas perceptível
      surface:   `color-mix(in srgb, ${levelColor} 5%, #0d0d0d)`,
      card:      `color-mix(in srgb, ${levelColor} 8%, #111118)`,
    }
  }

  return base
}

export function getCardFrameStyle(frame: any): Record<string, string | undefined> {
  if (!frame?.style) return { border: '1px solid rgba(0,242,255,0.12)' }

  const c = frame.color ?? '#00f2ff'

  const styles: Record<string, Record<string, string | undefined>> = {
    'simple':      { border: `2px solid ${c}`, boxShadow: `0 0 16px ${c}40` },
    'dashed':      { border: `2px dashed ${c}`, boxShadow: `0 0 20px ${c}30, inset 0 0 20px ${c}08` },
    'double':      { border: `3px double ${c}`, boxShadow: `0 0 20px ${c}50, 0 0 40px ${c}20` },
    'glass':       { border: `2px dashed rgba(255,255,255,0.25)`, boxShadow: '0 0 20px rgba(255,255,255,0.08), inset 0 0 20px rgba(255,255,255,0.03)' },
    'plasma':      { border: `2px solid ${c}`, boxShadow: `0 0 25px ${c}60, 0 0 50px ${c}25`, animation: 'borderGlow 2s ease infinite' },
    // Obsidian — borda fina escura com brilho interno apenas
    'obsidian':    { border: `1px solid ${c}50`, boxShadow: `inset 0 0 40px ${c}12, 0 0 20px rgba(0,0,0,0.8)` },
    // Void — borda dupla animada, mais dramática que obsidian
    'void':        { border: `2px solid ${c}`, boxShadow: `0 0 30px ${c}50, 0 0 60px ${c}20, inset 0 0 30px ${c}08`, animation: 'borderGlow 3s ease infinite' },
    // Nebula — gradiente animado na borda com blur
    'nebula':      { border: `2px solid transparent`, boxShadow: `0 0 25px #bc13fe60, 0 0 50px #00f2ff30`, animation: 'borderGlow 2s linear infinite', outline: '1px solid rgba(188,19,254,0.3)', outlineOffset: '3px' },
    'gold':        { border: `2px solid ${c}`, boxShadow: `0 0 30px ${c}50, 0 0 60px ${c}20`, animation: 'goldPulse 3s ease infinite' },
    'holographic': { border: '2px solid transparent', boxShadow: '0 0 30px rgba(0,242,255,0.3), 0 0 30px rgba(188,19,254,0.3)', animation: 'borderGlow 3s linear infinite' },
    'legendary':   { border: '2px solid transparent', boxShadow: `0 0 40px ${c}50, 0 0 80px ${c}25, 0 0 120px ${c}10`, animation: 'legendaryPulse 4s ease infinite' },
    'spectral': {
      border: '2px solid rgba(0,242,255,0.5)',
      boxShadow: [
        '0 0 0 1px rgba(0,242,255,0.15)',
        '0 0 20px rgba(0,242,255,0.4)',
        '0 0 40px rgba(0,242,255,0.2)',
        '0 0 80px rgba(188,19,254,0.15)',
        'inset 0 0 20px rgba(0,242,255,0.04)',
      ].join(', '),
      animation: 'spectralGlow 3s ease infinite',
    },
    'singularity-frame': {
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: [
        '0 0 0 1px rgba(255,255,255,0.1)',
        '0 0 30px rgba(0,242,255,0.5)',
        '0 0 60px rgba(188,19,254,0.3)',
        '0 0 100px rgba(255,32,121,0.15)',
        'inset 0 0 40px rgba(0,0,0,0.5)',
      ].join(', '),
      animation: 'singularityFrame 6s linear infinite',
    },
    'basic-border':{ border: `2px solid ${c}60`, boxShadow: `0 0 10px ${c}20` },
  }

  return styles[frame.style] ?? { border: `2px solid ${c}` }
}

export function getAvatarFrameStyle(frame: any): React.CSSProperties {
  if (!frame?.style) return { border: 'none' }

  const base: React.CSSProperties = {
    position: 'absolute',
    inset: -2,
    borderRadius: '50%',
    zIndex: 3,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  }

  const c = frame.color ?? '#00f2ff'

  // Usar boxShadow ou border em vez de background preenchido para não tampar a foto
  if (frame.style === 'holographic') {
    return {
      ...base,
      border: `2px solid ${c}`,
      boxShadow: `0 0 8px ${c}, inset 0 0 4px #bc13fe`,
    }
  }

  if (frame.style === 'gold') {
    return {
      ...base,
      border: `2px solid ${c}`,
      boxShadow: `0 0 10px ${c}80`,
      animation: 'goldPulse 3s ease infinite',
    }
  }

  if (frame.style === 'obsidian') {
    return {
      ...base,
      border: `2px solid ${c}`,
      boxShadow: '0 0 12px rgba(0,0,0,0.6)',
    }
  }

  if (frame.style === 'plasma') {
    return {
      ...base,
      border: `2px solid ${c}`,
      boxShadow: `0 0 10px ${c}80`,
    }
  }

  if (frame.style === 'legendary') {
    return {
      ...base,
      border: `2.5px solid ${c}`,
      boxShadow: `0 0 15px ${c}99, inset 0 0 5px #ffffff`,
    }
  }

  if (frame.style === 'glass') {
    return {
      ...base,
      border: '1.5px solid rgba(255,255,255,0.4)',
      boxShadow: '0 0 8px rgba(255,255,255,0.1)',
    }
  }

  return {
    ...base,
    border: `2px solid ${frame.color ?? '#00f2ff'}`,
    boxShadow: frame.animated ? `0 0 10px ${frame.color ?? '#00f2ff'}` : 'none',
  }
}
