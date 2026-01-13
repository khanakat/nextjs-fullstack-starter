/**
 * Base Domain Error class
 * All domain-specific errors should extend this class
 */
export abstract class DomainError extends Error {
  public readonly timestamp: Date;
  public readonly errorCode: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.errorCode = errorCode || this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}