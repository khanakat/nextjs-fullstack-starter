/**
 * Sistema de Cache Estratégico
 *
 * Implementa múltiples estrategias de caching para optimizar performance:
 * - Memory Cache: Para datos frecuentemente accedidos
 * - Redis Cache: Para datos compartidos entre instancias
 * - Query Cache: Para resultados de base de datos
 * - Static Cache: Para contenido estático
 */

// import { LRUCache } from "lru-cache"; // Commented out due to missing types

// Configuración de cache en memoria
// const memoryCache = new LRUCache<string, any>({
//   max: 1000, // Máximo 1000 entradas
//   ttl: 1000 * 60 * 15, // 15 minutos TTL por defecto
//   allowStale: false,
//   updateAgeOnGet: false,
//   updateAgeOnHas: false,
// });

// Simple in-memory cache implementation as fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

// Tipos para configuración de cache
export interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  tags?: string[]; // Tags para invalidación
  revalidate?: number; // Tiempo de revalidación
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

/**
 * Cache Manager principal
 */
export class CacheManager {
  private static instance: CacheManager;
  private memCache = memoryCache;
  private redisClient: any = null; // Se inicializa si Redis está disponible

  private constructor() {
    this.initializeRedis();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        const { createClient } = await import("redis");
        this.redisClient = createClient({
          url: process.env.REDIS_URL,
        });
        await this.redisClient.connect();
        console.log("Redis cache initialized");
      }
    } catch (error) {
      console.warn("Redis not available, using memory cache only:", error);
    }
  }

  /**
   * Obtiene un valor del cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Intentar primero memory cache
      const memResult = this.memCache.get(key);
      if (memResult && memResult.expires > Date.now()) {
        return memResult.data as T;
      } else if (memResult) {
        // Remove expired entry
        this.memCache.delete(key);
      }

      // Si no está en memoria, intentar Redis
      if (this.redisClient) {
        const redisResult = await this.redisClient.get(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);
          // Guardar en memory cache para próximas consultas
          this.memCache.set(key, { 
            data: parsed.data, 
            expires: Date.now() + (parsed.ttl || 900000) // 15 min default
          });
          return parsed.data as T;
        }
      }

      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Guarda un valor en el cache
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || 1000 * 60 * 15; // 15 minutos por defecto
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
    };

    try {
      // Guardar en memory cache
      this.memCache.set(key, { data: value, expires: Date.now() + ttl });

      // Guardar en Redis si está disponible
      if (this.redisClient) {
        await this.redisClient.setEx(
          key,
          Math.floor(ttl / 1000),
          JSON.stringify(entry),
        );
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Elimina una clave del cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.memCache.delete(key);
      if (this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  /**
   * Invalida cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Para memory cache, necesitamos iterar
      for (const [key, value] of this.memCache.entries()) {
        if (value && typeof value === "object" && value.data && value.data.tags) {
          if (tags.some((tag) => value.data.tags.includes(tag))) {
            this.memCache.delete(key);
          }
        }
      }

      // Para Redis, usamos un patrón más complejo
      if (this.redisClient) {
        const keys = await this.redisClient.keys("*");
        for (const key of keys) {
          const value = await this.redisClient.get(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed.tags && tags.some((tag) => parsed.tags.includes(tag))) {
              await this.redisClient.del(key);
            }
          }
        }
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    try {
      this.memCache.clear();
      if (this.redisClient) {
        await this.redisClient.flushAll();
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return {
      memory: {
        size: this.memCache.size,
        // max: this.memCache.max, // Not available in Map
        // calculatedSize: this.memCache.calculatedSize, // Not available in Map
      },
      redis: {
        connected: !!this.redisClient?.isReady,
      },
    };
  }
}

// Instancia singleton
export const cacheManager = CacheManager.getInstance();

/**
 * Decorador para cachear resultados de funciones
 */
export function cached<T extends (...args: any[]) => any>(
  options: CacheOptions & {
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {},
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const keyGen =
        options.keyGenerator ||
        ((...args) =>
          `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`);
      const cacheKey = keyGen(...args);

      // Intentar obtener del cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Ejecutar método original
      const result = await method.apply(this, args);

      // Guardar en cache
      await cacheManager.set(cacheKey, result, options);

      return result;
    };
  };
}

/**
 * Utilidades de cache para casos comunes
 */
export const CacheUtils = {
  /**
   * Cache para queries de base de datos
   */
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await queryFn();
    await cacheManager.set(key, result, {
      ttl: 1000 * 60 * 5, // 5 minutos por defecto para queries
      ...options,
    });

    return result;
  },

  /**
   * Cache para APIs externas
   */
  async cacheApiCall<T>(
    key: string,
    apiFn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await apiFn();
    await cacheManager.set(key, result, {
      ttl: 1000 * 60 * 30, // 30 minutos por defecto para APIs
      ...options,
    });

    return result;
  },

  /**
   * Cache para cálculos costosos
   */
  async cacheComputation<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await computeFn();
    await cacheManager.set(key, result, {
      ttl: 1000 * 60 * 60, // 1 hora por defecto para cálculos
      ...options,
    });

    return result;
  },

  /**
   * Genera claves de cache consistentes
   */
  generateKey(prefix: string, ...parts: (string | number | object)[]): string {
    const keyParts = parts.map((part) =>
      typeof part === "object" ? JSON.stringify(part) : String(part),
    );
    return `${prefix}:${keyParts.join(":")}`;
  },
};

// Exportar instancia por defecto
export default cacheManager;
