/**
 * Structured logger utility for production-ready logging
 * Replaces console.log statements with proper logging levels and formatting
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, data } = entry;
    const contextStr = context ? `[${context}]` : "";
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    return true;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data || "");
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data || "");
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || "");
        break;
      case LogLevel.ERROR:
        try {
          console.error(formattedMessage, entry.error || entry.data || "");
        } catch {
          // Some mocked environments may throw on console.error with non-Error values
          console.error(formattedMessage);
        }
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.logToConsole(entry);
  }

  info(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.logToConsole(entry);
  }

  warn(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.logToConsole(entry);
  }

  error(message: string, context?: string | any, error?: Error | any): void {
    // Handle both old and new signatures
    if (typeof context === "object" && context !== null && !error) {
      // New signature: error(message, data)
      const entry = this.createLogEntry(
        LogLevel.ERROR,
        message,
        undefined,
        context,
      );
      this.logToConsole(entry);
    } else {
      // Old signature: error(message, context, error)
      const isRealError = error instanceof Error;
      const dataParam = !isRealError && typeof error === "object" ? error : undefined;
      const entry = this.createLogEntry(
        LogLevel.ERROR,
        message,
        typeof context === "string" ? context : undefined,
        dataParam,
        isRealError ? error : undefined,
      );
      this.logToConsole(entry);
    }
  }

  // Convenience methods for common use cases
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, "API", data);
  }

  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = `API Response: ${method} ${url} - ${status}`;

    if (level === LogLevel.ERROR) {
      this.error(message, "API", data);
    } else {
      this.debug(message, "API", data);
    }
  }

  userAction(action: string, userId?: string, data?: any): void {
    this.info(`User Action: ${action}`, "USER", { userId, ...data });
  }

  performance(operation: string, duration: number, context?: string): void {
    this.debug(
      `Performance: ${operation} took ${duration}ms`,
      context || "PERF",
    );
  }

  // Error-specific logging methods
  clientError(message: string, error: any, context?: string): void {
    const errorData = {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      code: error?.code,
      severity: error?.severity,
      timestamp: error?.timestamp,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof window !== "undefined" ? navigator.userAgent : undefined,
    };

    this.error(`Client Error: ${message}`, context || "CLIENT", errorData);
  }

  apiError(message: string, context: string, error: any, data?: any): void {
    const errorData = {
      message: error?.message || "Unknown API error",
      status: error?.status || error?.response?.status,
      code: error?.code,
      stack: error?.stack,
      ...data,
    };

    this.error(`API Error: ${message}`, context || "API", errorData);
  }

  componentError(
    message: string,
    error: Error,
    componentName?: string,
    errorInfo?: any,
  ): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentName,
      componentStack: errorInfo?.componentStack,
      errorBoundary: errorInfo?.errorBoundary,
      props: errorInfo?.props,
      state: errorInfo?.state,
    };

    this.error(`Component Error: ${message}`, "COMPONENT", errorData);
  }

  validationError(
    message: string,
    errors: any[],
    field?: string,
    context?: string,
  ): void {
    const errorData = {
      field,
      errors,
      count: errors?.length || 0,
    };

    this.warn(
      `Validation Error: ${message}`,
      context || "VALIDATION",
      errorData,
    );
  }

  securityEvent(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    data?: any,
  ): void {
    const eventData = {
      severity,
      timestamp: new Date().toISOString(),
      ip: data?.ip,
      userAgent: data?.userAgent,
      userId: data?.userId,
      sessionId: data?.sessionId,
      ...data,
    };

    const level =
      severity === "critical" || severity === "high"
        ? LogLevel.ERROR
        : LogLevel.WARN;
    const entry = this.createLogEntry(
      level,
      `Security Event: ${event}`,
      "SECURITY",
      eventData,
    );
    this.logToConsole(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for easier imports
export default logger;
