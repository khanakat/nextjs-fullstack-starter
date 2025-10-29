/**
 * Componentes de Lazy Loading para optimización de performance
 *
 * Implementa diferentes estrategias de carga diferida:
 * - Lazy Component: Carga componentes bajo demanda
 * - Intersection Observer: Carga cuando entra en viewport
 * - Progressive Loading: Carga progresiva de contenido
 * - Image Lazy Loading: Carga diferida de imágenes
 */

import React, {
  Suspense,
  lazy,
  useState,
  useEffect,
  useRef,
  ComponentType,
  ReactNode,
} from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
// import { Spinner } from "@/components/ui/spinner";

// Tipos
interface LazyComponentProps {
  fallback?: ReactNode;
  error?: ReactNode;
  delay?: number;
}

interface IntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface LazyImageProps {
  src: string;
  alt: string;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

/**
 * Hook para Intersection Observer
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && options.triggerOnce !== false) {
          setHasIntersected(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "50px",
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.triggerOnce]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected:
      options.triggerOnce !== false ? hasIntersected : isIntersecting,
  };
}

/**
 * Componente para carga diferida basada en viewport
 */
interface LazyLoadProps extends IntersectionObserverOptions {
  children: ReactNode;
  fallback?: ReactNode;
  height?: string | number;
  className?: string;
}

export function LazyLoad({
  children,
  fallback,
  height = 200,
  className,
  ...observerOptions
}: LazyLoadProps) {
  const { elementRef, hasIntersected } =
    useIntersectionObserver(observerOptions);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ minHeight: typeof height === "number" ? `${height}px` : height }}
    >
      {hasIntersected
        ? children
        : fallback || <Skeleton className="w-full h-full" />}
    </div>
  );
}

/**
 * HOC para lazy loading de componentes
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyComponentProps = {},
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  return function LazyLoadedComponent(props: P) {
    const [showComponent, setShowComponent] = useState(!options.delay);

    useEffect(() => {
      if (options.delay) {
        const timer = setTimeout(() => {
          setShowComponent(true);
        }, options.delay);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, []);

    if (!showComponent) {
      return options.fallback || <Skeleton className="w-full h-32" />;
    }

    return (
      <Suspense
        fallback={options.fallback || <Skeleton className="w-full h-32" />}
      >
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Componente de imagen con lazy loading
 */
export function LazyImage({
  src,
  alt,
  blurDataURL,
  onLoad,
  onError,
  className,
  width,
  height,
  fill = true,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { elementRef, hasIntersected } = useIntersectionObserver({
    triggerOnce: true,
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {hasIntersected && !hasError ? (
        <>
          {/* Placeholder mientras carga */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse">
              {blurDataURL && (
                <Image
                  src={blurDataURL}
                  alt=""
                  fill
                  className="object-cover opacity-50 blur-sm"
                />
              )}
            </div>
          )}

          {/* Imagen principal */}
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } ${className || ""}`}
          />
        </>
      ) : hasError ? (
        <div className="flex items-center justify-center bg-gray-100 text-gray-500">
          <span>Failed to load image</span>
        </div>
      ) : (
        <Skeleton className="w-full h-full" />
      )}
    </div>
  );
}

/**
 * Componente para carga progresiva de listas
 */
interface ProgressiveListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  batchSize?: number;
  loadDelay?: number;
  fallback?: ReactNode;
  className?: string;
}

export function ProgressiveList<T>({
  items,
  renderItem,
  batchSize = 10,
  loadDelay = 100,
  fallback,
  className,
}: ProgressiveListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    if (visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
      }, loadDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visibleCount, items.length, batchSize, loadDelay]);

  return (
    <div className={className}>
      {items.slice(0, visibleCount).map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}

      {visibleCount < items.length && (
        <div className="flex justify-center py-4">
          {fallback || <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para lazy loading de módulos dinámicos
 */
interface DynamicModuleProps {
  moduleLoader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactNode;
  error?: ReactNode;
  props?: any;
}

export function DynamicModule({
  moduleLoader,
  fallback,
  error,
  props = {},
}: DynamicModuleProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    moduleLoader()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load module:", err);
        setHasError(true);
        setIsLoading(false);
      });
  }, [moduleLoader]);

  if (isLoading) {
    return fallback || <Skeleton className="w-full h-32" />;
  }

  if (hasError) {
    return (
      error || <div className="text-red-500">Failed to load component</div>
    );
  }

  if (!Component) {
    return null;
  }

  return <Component {...props} />;
}

/**
 * Hook para lazy loading de datos
 */
interface UseLazyDataOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useLazyData<T>(
  dataLoader: () => Promise<T>,
  options: UseLazyDataOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: options.threshold,
    rootMargin: options.rootMargin,
    triggerOnce: true,
  });

  useEffect(() => {
    if (hasIntersected && options.enabled !== false && !data && !isLoading) {
      setIsLoading(true);
      setError(null);

      dataLoader()
        .then((result) => {
          setData(result);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasIntersected, options.enabled, data, isLoading, dataLoader]);

  return {
    elementRef,
    data,
    isLoading,
    error,
    hasIntersected,
  };
}

/**
 * Componente para lazy loading de contenido con skeleton
 */
interface LazyContentProps {
  children: ReactNode;
  skeleton?: ReactNode;
  delay?: number;
  className?: string;
}

export function LazyContent({
  children,
  skeleton,
  delay = 0,
  className,
}: LazyContentProps) {
  const [showContent, setShowContent] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [delay]);

  return (
    <div className={className}>
      {showContent
        ? children
        : skeleton || <Skeleton className="w-full h-20" />}
    </div>
  );
}

// Utilidades para crear componentes lazy
export const LazyUtils = {
  /**
   * Crea un componente lazy con configuración personalizada
   */
  createLazyComponent<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: ReactNode,
  ) {
    const LazyComponent = lazy(importFn);

    return function LazyWrapper(props: P) {
      return (
        <Suspense fallback={fallback || <Skeleton className="w-full h-32" />}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      );
    };
  },

  /**
   * Crea un hook para lazy loading de datos con cache
   */
  createLazyDataHook<T>(
    key: string,
    dataLoader: () => Promise<T>,
    cacheTime = 5 * 60 * 1000, // 5 minutos
  ) {
    const cache = new Map<string, { data: T; timestamp: number }>();

    return function useLazyDataWithCache() {
      const [data, setData] = useState<T | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<Error | null>(null);

      const loadData = async () => {
        // Verificar cache
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          setData(cached.data);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const result = await dataLoader();
          cache.set(key, { data: result, timestamp: Date.now() });
          setData(result);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      };

      return { data, isLoading, error, loadData };
    };
  },
};
