import { Redis } from "ioredis";

export interface CacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultTTL: number;
  keyPrefix: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private redis?: Redis;
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;

    if (config.redis) {
      try {
        // Check if we're in an environment that supports Redis
        const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge' ||
                             typeof window !== 'undefined';
        
        if (isEdgeRuntime) {
          console.warn("Redis not supported in Edge Runtime, using memory cache");
          return;
        }

        this.redis = new Redis({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db || 0,
          maxRetriesPerRequest: 3,
          lazyConnect: true, // Don't connect immediately
        });

        // Handle connection errors gracefully
        this.redis.on('error', (error) => {
          console.warn("Redis connection error, falling back to memory cache:", error);
          this.redis = undefined;
        });

      } catch (error) {
        console.warn(
          "Redis initialization failed, falling back to memory cache:",
          error,
        );
        this.redis = undefined;
      }
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    try {
      if (this.redis) {
        const cached = await this.redis.get(fullKey);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          if (Date.now() - entry.timestamp < entry.ttl * 1000) {
            return entry.data;
          }
          // Expired, remove it
          await this.redis.del(fullKey);
        }
      } else {
        // Memory cache fallback
        const entry = this.memoryCache.get(fullKey);
        if (entry && Date.now() - entry.timestamp < entry.ttl * 1000) {
          return entry.data as T;
        }
        if (entry) {
          this.memoryCache.delete(fullKey);
        }
      }
    } catch (error) {
      console.error("Cache get error:", error);
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const cacheTTL = ttl || this.config.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL,
    };

    try {
      if (this.redis) {
        await this.redis.setex(fullKey, cacheTTL, JSON.stringify(entry));
      } else {
        // Memory cache fallback
        this.memoryCache.set(fullKey, entry);

        // Clean up expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async del(key: string): Promise<void> {
    const fullKey = this.getKey(key);

    try {
      if (this.redis) {
        await this.redis.del(fullKey);
      } else {
        this.memoryCache.delete(fullKey);
      }
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (this.redis) {
        const searchPattern = pattern
          ? this.getKey(pattern)
          : `${this.config.keyPrefix}:*`;

        const keys = await this.redis.keys(searchPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        if (pattern) {
          const fullPattern = this.getKey(pattern);
          for (const key of this.memoryCache.keys()) {
            if (key.includes(fullPattern)) {
              this.memoryCache.delete(key);
            }
          }
        } else {
          this.memoryCache.clear();
        }
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    for (const key of keys) {
      const result = await this.get<T>(key);
      results.push(result);
    }

    return results;
  }

  async mset<T>(
    entries: Array<{ key: string; data: T; ttl?: number }>,
  ): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.data, entry.ttl);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl * 1000) {
        this.memoryCache.delete(key);
      }
    }
  }

  async getStats(): Promise<{
    type: "redis" | "memory";
    keys: number;
    memory?: string;
  }> {
    if (this.redis) {
      try {
        const info = await this.redis.info("memory");
        const keyCount = await this.redis.dbsize();
        const memoryMatch = info.match(/used_memory_human:(.+)/);

        return {
          type: "redis",
          keys: keyCount,
          memory: memoryMatch ? memoryMatch[1].trim() : "unknown",
        };
      } catch (error) {
        console.error("Redis stats error:", error);
      }
    }

    return {
      type: "memory",
      keys: this.memoryCache.size,
    };
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
let cacheService: CacheService;

export function getCacheService(): CacheService {
  if (!cacheService) {
    // Check if we're in Edge Runtime environment
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge' ||
                         typeof window !== 'undefined';
    
    cacheService = new CacheService({
      redis: (!isEdgeRuntime && process.env.REDIS_URL)
        ? {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0"),
          }
        : undefined,
      defaultTTL: 3600, // 1 hour
      keyPrefix: "nextjs-app",
    });
  }
  return cacheService;
}

// Cache decorators for common patterns
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttl: number = 3600,
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cache = getCacheService();
      const key = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache first
      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cache.set(key, result, ttl);

      return result;
    };
  };
}
