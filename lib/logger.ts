// Enhanced logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      userId: this.getCurrentUserId(),
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from Clerk or other auth provider
    if (typeof window !== 'undefined') {
      // This would be replaced with actual auth check
      return localStorage.getItem('user_id') || undefined
    }
    return undefined
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // In development, also log to console
    if (this.isDevelopment) {
      const { level, message, context, error } = entry
      const consoleMethod = console[level] || console.log
      
      if (context || error) {
        consoleMethod(message, { context, error })
      } else {
        consoleMethod(message)
      }
    }

    // In production, send critical errors to monitoring service
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToMonitoring(entry)
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    try {
      // Send to your monitoring service (Sentry, LogRocket, etc.)
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.addLog(this.createEntry('debug', message, context))
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.addLog(this.createEntry('info', message, context))
  }

  warn(message: string, context?: Record<string, any>) {
    this.addLog(this.createEntry('warn', message, context))
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.addLog(this.createEntry('error', message, context, error))
  }

  // Performance logging
  time(label: string) {
    if (this.isDevelopment && console.time) {
      console.time(label)
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment && console.timeEnd) {
      console.timeEnd(label)
    }
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // API interaction logging
  logApiCall(method: string, url: string, status?: number, duration?: number) {
    const level: LogLevel = status && status >= 400 ? 'error' : 'info'
    this.addLog(
      this.createEntry(level, `API ${method} ${url}`, {
        method,
        url,
        status,
        duration,
      })
    )
  }

  // User action logging
  logUserAction(action: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, context)
  }

  // Page view logging
  logPageView(path: string, title?: string) {
    this.info(`Page view: ${path}`, { path, title })
  }
}

// Export singleton instance
export const logger = new Logger()

// Performance monitoring utilities
export const performance = {
  // Measure function execution time
  measure: <T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T => {
    return ((...args) => {
      const label = name || fn.name || 'function'
      const start = Date.now()
      
      try {
        const result = fn(...args)
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = Date.now() - start
            logger.debug(`${label} completed in ${duration}ms`)
          })
        }
        
        const duration = Date.now() - start
        logger.debug(`${label} completed in ${duration}ms`)
        return result
      } catch (error) {
        const duration = Date.now() - start
        logger.error(`${label} failed after ${duration}ms`, error as Error)
        throw error
      }
    }) as T
  },

  // Mark performance milestones
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(name)
    }
    logger.debug(`Performance mark: ${name}`)
  },

  // Measure between marks
  measureBetween: (startMark: string, endMark: string, name?: string) => {
    if (typeof window !== 'undefined' && window.performance?.measure) {
      const measureName = name || `${startMark}-${endMark}`
      window.performance.measure(measureName, startMark, endMark)
      
      const entries = window.performance.getEntriesByName(measureName)
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        logger.debug(`Performance measure: ${measureName} = ${lastEntry.duration}ms`)
        return lastEntry.duration
      }
    }
    return 0
  },
}

// Error boundary utilities
export const errorUtils = {
  // Capture error details
  captureError: (error: Error, context?: Record<string, any>) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    }

    logger.error('Uncaught error', error, errorInfo)
    return errorInfo
  },

  // Create error report
  createErrorReport: (error: Error, context?: Record<string, any>) => {
    return {
      error: errorUtils.captureError(error, context),
      logs: logger.getLogs().slice(-10), // Last 10 log entries
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    }
  },
}

// Development tools
export const devTools = {
  // Log component renders
  logRender: (componentName: string, props?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Render: ${componentName}`, { props })
    }
  },

  // Debug helper
  debug: (label: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 Debug: ${label}`)
      console.log(data)
      console.trace()
      console.groupEnd()
    }
  },

  // Performance inspector
  inspectPerformance: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = window.performance.getEntriesByType('paint')
      
      logger.info('Performance metrics', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      })
    }
  },
}

// Global error handlers (call this in your main app file)
export const setupGlobalErrorHandlers = () => {
  if (typeof window !== 'undefined') {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', event.reason)
      event.preventDefault() // Prevent console logging
    })

    // Catch global errors
    window.addEventListener('error', (event) => {
      logger.error('Global error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })
  }
}