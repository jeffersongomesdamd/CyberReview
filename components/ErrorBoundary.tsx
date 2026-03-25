'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-dark-surface border border-white/10 rounded-2xl">
          <div className="w-16 h-16 bg-neon-pink/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-neon-pink" />
          </div>
          <h2 className="text-2xl font-black font-orbitron mb-4 text-white">SISTEMA COMPROMETIDO</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Ocorreu um erro inesperado na matriz. Nossa equipe de hackers já foi notificada.
          </p>
          <div className="bg-black/50 p-4 rounded-lg mb-8 text-left font-mono text-xs text-neon-pink border border-neon-pink/20 w-full overflow-auto">
            {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-neon-pink hover:bg-neon-pink/80 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-glow-pink"
          >
            <RefreshCcw className="w-4 h-4" /> REINICIAR MATRIZ
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
