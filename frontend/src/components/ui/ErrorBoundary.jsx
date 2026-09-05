import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('WorkForge ErrorBoundary caught an unhandled error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface relative overflow-hidden text-text font-sans">
          {/* Ambient decorative glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-lg relative z-10 glass rounded-2xl border border-border p-8 shadow-card text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              An unexpected application error occurred. We have safely intercepted it to protect your session data.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-surface-card rounded-xl border border-white/5 text-left text-xs font-mono text-rose-300/90 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-card hover:bg-surface-hover text-text border border-border transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-text-muted" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
