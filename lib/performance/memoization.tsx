/**
 * Memoization System for Performance Optimization
 *
 * Implements different memoization strategies:
 * - React.memo for components
 * - useMemo for expensive calculations
 * - useCallback for functions
 * - Custom memoization with cache
 */

import React, {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  ComponentType,
  ReactNode,
} from "react";

// Types for memoization configuration
interface MemoOptions {
  maxAge?: number; // Lifetime in milliseconds
  maxSize?: number; // Maximum cache size
  keyGenerator?: (...args: any[]) => string;
}

interface MemoizedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  clear: () => void;
  size: () => number;
}

/**
 * Custom LRU Cache for memoization
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Eliminar el más antiguo
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memoización avanzada para funciones
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoOptions = {},
): MemoizedFunction<T> {
  const cache = new LRUCache<
    string,
    { value: ReturnType<T>; timestamp: number }
  >(options.maxSize || 100);

  const keyGenerator =
    options.keyGenerator || ((...args) => JSON.stringify(args));
  const maxAge = options.maxAge || Infinity;

  const memoizedFn = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as MemoizedFunction<T>;

  memoizedFn.clear = () => cache.clear();
  memoizedFn.size = () => cache.size();

  return memoizedFn;
}

/**
 * Hook para memoización de cálculos costosos con dependencias
 */
export function useExpensiveCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList,
  options: {
    debounce?: number;
    cache?: boolean;
    cacheKey?: string;
  } = {},
): T {
  const [result, setResult] = useState<T | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef(new Map<string, T>());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCalculation = useMemo(() => {
    if (options.cache && options.cacheKey) {
      const cached = cacheRef.current.get(options.cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const calculated = calculation();

    if (options.cache && options.cacheKey) {
      cacheRef.current.set(options.cacheKey, calculated);
    }

    return calculated;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculation, options.cache, options.cacheKey])

  useEffect(() => {
    if (options.debounce) {
      setIsCalculating(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setResult(memoizedCalculation);
        setIsCalculating(false);
      }, options.debounce);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      setResult(memoizedCalculation);
    }
  }, [memoizedCalculation, options.debounce]);

  return result ?? memoizedCalculation;
}

/**
 * Hook para memoización de funciones de callback
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    deps,
  );
}

/**
 * HOC para memoización de componentes con comparación personalizada
 */
export function withMemoization<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean,
) {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Hook para memoización de arrays y objetos complejos
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !areArraysEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Utilidad para comparar arrays profundamente
 */
function areArraysEqual(
  a: React.DependencyList,
  b: React.DependencyList,
): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }

  return true;
}

/**
 * Hook para memoización de queries con invalidación
 */
export function useMemoizedQuery<T, P extends any[]>(
  queryFn: (...params: P) => Promise<T>,
  params: P,
  options: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
  } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(
    new Map<
      string,
      {
        data: T;
        timestamp: number;
        staleTimestamp: number;
      }
    >(),
  );

  const cacheKey = useMemo(() => JSON.stringify(params), [params]);
  const staleTime = options.staleTime || 5 * 60 * 1000; // 5 minutes
  const cacheTime = options.cacheTime || 10 * 60 * 1000; // 10 minutes

  const executeQuery = useCallback(async () => {
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();

    // If there's cached data and it's not stale, use it
    if (cached && now - cached.staleTimestamp < staleTime) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn(...params);

      // Save to cache
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: now,
        staleTimestamp: now + staleTime,
      });

      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFn, cacheKey, staleTime, params]);

  useEffect(() => {
    if (options.enabled !== false) {
      executeQuery();
    }
  }, [executeQuery, options.enabled, params]);

  // Separate effect to clean expired cache
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of cacheRef.current.entries()) {
        if (now - value.timestamp > cacheTime) {
          cacheRef.current.delete(key);
        }
      }
    }, cacheTime);

    return () => clearInterval(cleanup);
  }, [cacheTime]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    if (options.enabled !== false) {
      executeQuery();
    }
  }, [cacheKey, executeQuery, options.enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: executeQuery,
    invalidate,
  };
}

/**
 * Componente memoizado para listas grandes
 */
interface MemoizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
}

export const MemoizedList = memo(
  <T,>({
    items,
    renderItem,
    keyExtractor,
    className,
  }: MemoizedListProps<T>) => {
    const memoizedItems = useMemo(() => {
      return items.map((item, index) => ({
        key: keyExtractor(item, index),
        element: renderItem(item, index),
      }));
    }, [items, renderItem, keyExtractor]);

    return (
      <div className={className}>
        {memoizedItems.map(({ key, element }) => (
          <div key={key}>{element}</div>
        ))}
      </div>
    );
  },
) as <T>(props: MemoizedListProps<T>) => JSX.Element;

/**
 * Hook para memoización de filtros y búsquedas
 */
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  searchQuery: string,
  options: {
    debounce?: number;
    caseSensitive?: boolean;
  } = {},
) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, options.debounce || 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, options.debounce]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;

    const query = options.caseSensitive
      ? debouncedQuery
      : debouncedQuery.toLowerCase();

    return items.filter((item) => filterFn(item, query));
  }, [items, filterFn, debouncedQuery, options.caseSensitive]);

  return {
    filteredItems,
    isFiltering: searchQuery !== debouncedQuery,
  };
}

/**
 * Utilidades de memoización
 */
export const MemoUtils = {
  /**
   * Comparador shallow para React.memo
   */
  shallowEqual<T extends object>(prevProps: T, nextProps: T): boolean {
    const keys1 = Object.keys(prevProps) as (keyof T)[];
    const keys2 = Object.keys(nextProps) as (keyof T)[];

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (prevProps[key] !== nextProps[key]) return false;
    }

    return true;
  },

  /**
   * Comparador profundo para objetos complejos
   */
  deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === "object") {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => this.deepEqual(item, b[index]));
      }

      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(
        (key) => keysB.includes(key) && this.deepEqual(a[key], b[key]),
      );
    }

    return false;
  },

  /**
   * Crea un comparador personalizado para props específicas
   */
  createPropsComparator<T extends object>(propsToCompare: (keyof T)[]) {
    return (prevProps: T, nextProps: T): boolean => {
      return propsToCompare.every((prop) =>
        Object.is(prevProps[prop], nextProps[prop]),
      );
    };
  },

  /**
   * Memoización con TTL (Time To Live)
   */
  memoizeWithTTL<T extends (...args: any[]) => any>(
    fn: T,
    ttl: number = 5 * 60 * 1000, // 5 minutes by default
  ): T {
    return memoize(fn, { maxAge: ttl }) as T;
  },
};
