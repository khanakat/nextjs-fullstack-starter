/**
 * API retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

/**
 * Default retry condition - retry on network errors and 5xx/429 status codes
 */
const defaultRetryCondition = (error: any): boolean => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Rate limiting
  if (error.status === 429) {
    return true;
  }
  
  // Server errors
  if (error.status >= 500) {
    return true;
  }
  
  return false;
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  backoffFactor: number
): number => {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Fetch with retry and exponential backoff
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<ApiResponse<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
    onRetry
  } = retryOptions;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If response is ok, return success
      if (response.ok) {
        const data = await response.json();
        return {
          data,
          status: response.status,
          ok: true
        };
      }
      
      // Create error object for non-ok responses
      const errorData = await response.json().catch(() => ({}));
      const error = {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        ...errorData
      };
      
      // Check if we should retry
      if (attempt < maxRetries && retryCondition(error)) {
        const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
        
        onRetry?.(attempt + 1, error);
        
        // For 429 (rate limit), respect Retry-After header if present
        if (error.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const retryDelay = parseInt(retryAfter) * 1000; // Convert to ms
            await sleep(Math.min(retryDelay, maxDelay));
            continue;
          }
        }
        
        await sleep(delay);
        continue;
      }
      
      // Return error response if no more retries
      return {
        error: error.message,
        status: response.status,
        ok: false
      };
      
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < maxRetries && retryCondition(error)) {
        const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
        
        onRetry?.(attempt + 1, error);
        await sleep(delay);
        continue;
      }
      
      // Return error if no more retries
      return {
        error: error.message || 'Network error',
        status: 0,
        ok: false
      };
    }
  }

  // This should never be reached, but just in case
  return {
    error: lastError?.message || 'Unknown error',
    status: 0,
    ok: false
  };
}

/**
 * Specialized retry function for scheduled reports API
 */
export async function fetchScheduledReportsWithRetry<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return fetchWithRetry<T>(url, options, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2,
    onRetry: (attempt, error) => {
      console.log(`Retrying scheduled reports API call (attempt ${attempt}):`, error.message || error);
    },
    retryCondition: (error) => {
      // Retry on network errors, rate limits, and server errors
      return defaultRetryCondition(error) || 
             (error.status >= 500 && error.status < 600) ||
             error.status === 429;
    }
  });
}

/**
 * Hook for using retry logic in React components
 */
export function useApiRetry() {
  const retryFetch = async <T = any>(
    url: string,
    options: RequestInit = {},
    retryOptions?: RetryOptions
  ): Promise<T> => {
    const result = await fetchWithRetry<T>(url, options, retryOptions);
    
    if (!result.ok) {
      throw new Error(result.error || 'API request failed');
    }
    
    return result.data!;
  };

  return { retryFetch };
}