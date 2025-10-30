import { logger } from "@/lib/logger";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: Error) => {
      // Default retry condition - retry on network errors, timeouts, and 5xx errors
      const retryableErrors = [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
      ];
      
      const errorMessage = error.message.toLowerCase();
      const isNetworkError = retryableErrors.some(err => 
        errorMessage.includes(err.toLowerCase())
      );
      
      // Check for HTTP 5xx errors
      const is5xxError = /5\d{2}/.test(error.message);
      
      // Check for rate limiting (429)
      const isRateLimited = error.message.includes('429');
      
      return isNetworkError || is5xxError || isRateLimited;
    },
  };

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error = new Error('Unknown error');
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      attempt++;
      
      try {
        logger.debug(`Executing function (attempt ${attempt}/${config.maxAttempts})`, "retry", {
          context,
          attempt,
          maxAttempts: config.maxAttempts,
        });

        const result = await fn();
        
        const totalTime = Date.now() - startTime;
        logger.info("Function executed successfully", "retry", {
          context,
          attempts: attempt,
          totalTime,
          success: true,
        });

        return {
          success: true,
          result,
          attempts: attempt,
          totalTime,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn(`Function execution failed (attempt ${attempt}/${config.maxAttempts})`, "retry", {
          context,
          attempt,
          maxAttempts: config.maxAttempts,
          error: lastError.message,
          stack: lastError.stack,
        });

        // Check if we should retry
        if (attempt >= config.maxAttempts || !config.retryCondition?.(lastError)) {
          break;
        }

        // Call onRetry callback if provided
        config.onRetry?.(lastError, attempt);

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        
        logger.debug(`Waiting ${delay}ms before retry`, "retry", {
          context,
          attempt,
          delay,
        });

        await this.sleep(delay);
      }
    }

    // Max attempts reached or non-retryable error
    const totalTime = Date.now() - startTime;
    
    logger.error("Function execution failed after all retry attempts", "retry", {
      context,
      attempts: attempt,
      totalTime,
      finalError: lastError.message,
      stack: lastError.stack,
    });

    // Call onMaxAttemptsReached callback if provided
    config.onMaxAttemptsReached?.(lastError);

    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalTime,
    };
  }

  /**
   * Execute multiple functions with retry logic in parallel
   */
  static async executeParallel<T>(
    functions: Array<() => Promise<T>>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): Promise<Array<RetryResult<T>>> {
    logger.info(`Executing ${functions.length} functions in parallel with retry`, "retry", {
      context,
      functionCount: functions.length,
    });

    const promises = functions.map((fn, index) =>
      this.execute(fn, options, `${context}_${index}`)
    );

    return Promise.all(promises);
  }

  /**
   * Execute multiple functions with retry logic in sequence
   */
  static async executeSequential<T>(
    functions: Array<() => Promise<T>>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): Promise<Array<RetryResult<T>>> {
    logger.info(`Executing ${functions.length} functions sequentially with retry`, "retry", {
      context,
      functionCount: functions.length,
    });

    const results: Array<RetryResult<T>> = [];

    for (let i = 0; i < functions.length; i++) {
      const result = await this.execute(functions[i], options, `${context}_${i}`);
      results.push(result);
      
      // Stop on first failure if configured
      if (!result.success && options.maxAttempts === 1) {
        break;
      }
    }

    return results;
  }

  /**
   * Create a retry wrapper for a function
   */
  static createRetryWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.execute(() => fn(...args), options, context);
      
      if (result.success) {
        return result.result!;
      } else {
        throw result.error!;
      }
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private static calculateDelay(attempt: number, config: RetryOptions): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter (±25% of the delay)
      const jitterRange = cappedDelay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Predefined retry configurations for common scenarios
export const RetryConfigs = {
  // Network operations (API calls, HTTP requests)
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: Error) => {
      const networkErrors = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
      const errorMessage = error.message.toLowerCase();
      const isNetworkError = networkErrors.some(err => errorMessage.includes(err.toLowerCase()));
      const is5xxError = /5\d{2}/.test(error.message);
      const isRateLimited = error.message.includes('429');
      return isNetworkError || is5xxError || isRateLimited;
    },
  },

  // Database operations
  database: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryCondition: (error: Error) => {
      const dbErrors = ['connection', 'timeout', 'deadlock', 'lock wait timeout'];
      const errorMessage = error.message.toLowerCase();
      return dbErrors.some(err => errorMessage.includes(err));
    },
  },

  // Email sending
  email: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: Error) => {
      const emailErrors = ['rate limit', 'temporary failure', '5', 'timeout'];
      const errorMessage = error.message.toLowerCase();
      return emailErrors.some(err => errorMessage.includes(err));
    },
  },

  // File operations
  file: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    jitter: false,
    retryCondition: (error: Error) => {
      const fileErrors = ['EBUSY', 'EMFILE', 'ENFILE', 'EACCES'];
      const errorMessage = error.message.toUpperCase();
      return fileErrors.some(err => errorMessage.includes(err));
    },
  },

  // Quick operations (minimal retry)
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: false,
  },

  // Critical operations (aggressive retry)
  critical: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
} as const;

// Helper functions for common retry patterns
export const withRetry = {
  network: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.network, context),
  
  database: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.database, context),
  
  email: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.email, context),
  
  file: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.file, context),
  
  quick: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.quick, context),
  
  critical: <T>(fn: () => Promise<T>, context?: string) =>
    RetryManager.execute(fn, RetryConfigs.critical, context),
};