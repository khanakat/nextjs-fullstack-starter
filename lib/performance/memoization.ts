import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { getCacheService } from "@/lib/cache/cache-service";

// Simple in-memory cache for function results
class MemoryCache<T = any> {
  private cache = new Map<
    string,
    { value: T; timestamp: number; ttl: number }
  >();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl = 300000): void {
    // 5 minutes default
    // Clean up if cache is too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache();

// Memoization decorator for class methods
export function memoize<T extends (...args: any[]) => any>(
  ttl: number = 300000, // 5 minutes default
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const key = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = memoryCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = originalMethod.apply(this, args);
      memoryCache.set(key, result, ttl);

      return result;
    };
  };
}

// Async memoization decorator
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  ttl: number = 300000,
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const pendingPromises = new Map<string, Promise<any>>();

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = memoryCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Check if there's already a pending promise for this key
      if (pendingPromises.has(key)) {
        return pendingPromises.get(key);
      }

      // Execute method and cache result
      const promise = originalMethod.apply(this, args);
      pendingPromises.set(key, promise);

      try {
        const result = await promise;
        memoryCache.set(key, result, ttl);
        return result;
      } finally {
        pendingPromises.delete(key);
      }
    };
  };
}

// React hook for memoizing expensive calculations
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  ttl?: number,
): T {
  const keyRef = useRef<string>("");

  return useMemo(() => {
    if (ttl) {
      const key = `useMemoizedValue:${JSON.stringify(deps)}`;
      keyRef.current = key;

      const cached = memoryCache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = factory();
      memoryCache.set(key, result, ttl);
      return result;
    }

    return factory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory, ttl, ...deps]);
}

// React hook for memoizing async operations
export function useMemoizedAsync<T>(
  asyncFactory: () => Promise<T>,
  deps: React.DependencyList,
  ttl: number = 300000,
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const keyRef = useRef<string>("");

  const fetchData = useCallback(async (force = false) => {
    const key = `useMemoizedAsync:${JSON.stringify(deps)}`;
    keyRef.current = key;

    if (!force) {
      const cached = memoryCache.get(key);
      if (cached !== null) {
        setData(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFactory();
      memoryCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFactory, ttl, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for memoizing callback functions with cache
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  ttl: number = 300000,
): T {
  const memoizedCallback = useCallback((...args: Parameters<T>) => {
    const key = `useMemoizedCallback:${JSON.stringify(args)}:${JSON.stringify(deps)}`;

    const cached = memoryCache.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = callback(...args);
    memoryCache.set(key, result, ttl);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ttl, ...deps]) as T;

  return memoizedCallback;
}

// Persistent memoization using Redis/cache service
export function usePersistentMemo<T>(
  key: string,
  factory: () => Promise<T>,
  deps: React.DependencyList,
  ttl: number = 3600, // 1 hour default
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const cache = getCacheService();

  const fetchData = useCallback(
    async (force = false) => {
      const cacheKey = `persistent_memo:${key}:${JSON.stringify(deps)}`;

      if (!force) {
        try {
          const cached = await cache.get<T>(cacheKey);
          if (cached !== null) {
            setData(cached);
            return;
          }
        } catch (err) {
          console.warn("Cache read error:", err);
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await factory();
        await cache.set(cacheKey, result, ttl);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, cache, factory, ttl, ...deps],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Utility to clear all memoization caches
export function clearMemoizationCache(): void {
  memoryCache.clear();
}

// Utility to get cache statistics
export function getMemoizationStats(): {
  memoryCache: { size: number; maxSize: number };
} {
  return {
    memoryCache: {
      size: memoryCache.size(),
      maxSize: 1000, // hardcoded for now
    },
  };
}

// Higher-order component for memoizing component props
export function withMemoizedProps<P extends object>(
  Component: React.ComponentType<P>,
  propsSelector?: (props: P) => Partial<P>,
) {
  return React.memo(Component, (prevProps, nextProps) => {
    const prevSelected = propsSelector ? propsSelector(prevProps) : prevProps;
    const nextSelected = propsSelector ? propsSelector(nextProps) : nextProps;

    return JSON.stringify(prevSelected) === JSON.stringify(nextSelected);
  });
}

// Debounced memoization for frequently changing values
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  delay: number = 300,
): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(() =>
    factory(),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(factory());
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory, delay, ...deps]);

  return debouncedValue;
}
