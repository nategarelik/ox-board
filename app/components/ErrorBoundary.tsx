'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null
  private previousResetKeys: Array<string | number> = []

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    const errorCount = this.state.errorCount + 1

    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
      errorCount
    })

    if (onError) {
      onError(error, errorInfo)
    }

    // Auto-reset after 5 seconds if error persists
    if (errorCount < 3) {
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary()
      }, 5000)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError) {
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary()
      }

      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, idx) => key !== this.previousResetKeys[idx]
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }

    this.previousResetKeys = resetKeys || []
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    })
  }

  render() {
    const { hasError, error, errorCount } = this.state
    const { children, fallback, level = 'component' } = this.props

    if (hasError && error) {
      if (fallback) {
        return <>{fallback}</>
      }

      // Default error UI based on level
      switch (level) {
        case 'page':
          return (
            <div className="min-h-screen bg-ox-background flex items-center justify-center p-8">
              <div className="max-w-2xl w-full ox-surface p-8 rounded-lg">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ox-error/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-ox-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-4 text-ox-error">
                    System Error
                  </h1>
                  <p className="text-gray-400 mb-6">
                    Something went wrong. The application encountered an unexpected error.
                  </p>
                  <div className="bg-black/50 p-4 rounded-lg mb-6 text-left">
                    <p className="text-xs font-mono text-gray-500 mb-2">Error Details:</p>
                    <p className="text-sm font-mono text-ox-error break-all">
                      {error.message}
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={this.resetErrorBoundary}
                      className="ox-button px-6 py-2"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                  {errorCount > 1 && (
                    <p className="text-xs text-gray-500 mt-4">
                      Error occurred {errorCount} times
                    </p>
                  )}
                </div>
              </div>
            </div>
          )

        case 'section':
          return (
            <div className="ox-surface p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-ox-warning/20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ox-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display mb-2 text-ox-warning">
                    Section Error
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    This section failed to load properly.
                  </p>
                  <button
                    onClick={this.resetErrorBoundary}
                    className="text-sm ox-button px-4 py-1"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )

        case 'component':
        default:
          return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-ox-error/10 border border-ox-error/30 rounded">
              <svg className="w-4 h-4 text-ox-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-gray-400">Component Error</span>
              <button
                onClick={this.resetErrorBoundary}
                className="text-xs underline text-ox-primary hover:text-ox-accent"
              >
                Reset
              </button>
            </div>
          )
      }
    }

    return children
  }
}

// Specific error boundaries for different parts of the app
export function DJErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      onError={(error) => {
        console.error('DJ Component Error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function CameraErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-ox-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-display mb-2 text-ox-error">Camera Error</h3>
            <p className="text-gray-400 text-sm mb-4">Failed to initialize camera feed</p>
            <button
              onClick={() => window.location.reload()}
              className="ox-button text-sm px-4 py-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
      onError={(error) => {
        console.error('Camera Error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function AudioErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      resetOnPropsChange
      onError={(error) => {
        console.error('Audio System Error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}