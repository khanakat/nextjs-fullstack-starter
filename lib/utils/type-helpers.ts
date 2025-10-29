/**
 * TypeScript Utility Helpers
 *
 * Utility functions for working with TypeScript types,
 * runtime type validation and data transformations.
 */

// Type guards avanzados
export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === "function";
};

export const isPromise = <T>(value: unknown): value is Promise<T> => {
  return (
    value instanceof Promise ||
    (isObject(value) &&
      isFunction((value as any).then) &&
      isFunction((value as any).catch))
  );
};

// Validadores de estructura
export const hasProperty = <
  T extends Record<string, unknown>,
  K extends string,
>(
  obj: T,
  key: K,
): obj is T & Record<K, unknown> => {
  return key in obj;
};

export const hasRequiredProperties = <T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): boolean => {
  return keys.every(
    (key) => key in obj && obj[key] !== undefined && obj[key] !== null,
  );
};

export const isValidEmail = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isValidUUID = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Data transformers
export const safeParseInt = (value: unknown, defaultValue = 0): number => {
  if (isNumber(value)) return Math.floor(value);
  if (isString(value)) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const safeParseFloat = (value: unknown, defaultValue = 0): number => {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const safeParseBoolean = (
  value: unknown,
  defaultValue = false,
): boolean => {
  if (isBoolean(value)) return value;
  if (isString(value)) {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (isNumber(value)) {
    return value !== 0;
  }
  return defaultValue;
};

export const safeParseDate = (
  value: unknown,
  defaultValue?: Date,
): Date | undefined => {
  if (isDate(value)) return value;
  if (isString(value) || isNumber(value)) {
    const parsed = new Date(value);
    return isDate(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

// Array utilities
export const ensureArray = <T>(value: T | T[]): T[] => {
  return isArray(value) ? value : [value];
};

export const uniqueBy = <T, K extends keyof T>(array: T[], key: K): T[] => {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K,
): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
};

export const sortBy = <T>(
  array: T[],
  keyOrFn: keyof T | ((item: T) => any),
  direction: "asc" | "desc" = "asc",
): T[] => {
  const getValue = isFunction(keyOrFn) ? keyOrFn : (item: T) => item[keyOrFn];

  return [...array].sort((a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

// Object utilities
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const cloned = {} as T;
    Object.keys(obj).forEach((key) => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  return obj;
};

export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
};

export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((acc, item) => {
    return acc.concat(isArray(item) ? flatten(item) : item);
  }, []);
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
};

export const snakeCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
};

export const truncate = (
  str: string,
  length: number,
  suffix = "...",
): string => {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Validation utilities
export const createValidator = <T>(
  schema: Record<keyof T, (value: any) => boolean | string>,
) => {
  return (
    data: Partial<T>,
  ): { isValid: boolean; errors: Record<keyof T, string> } => {
    const errors = {} as Record<keyof T, string>;
    let isValid = true;

    Object.keys(schema).forEach((key) => {
      const validator = schema[key as keyof T];
      const value = data[key as keyof T];
      const result = validator(value);

      if (typeof result === "string") {
        errors[key as keyof T] = result;
        isValid = false;
      } else if (!result) {
        errors[key as keyof T] = `Invalid ${String(key)}`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string,
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Error handling utilities
export const safeAsync = async <T>(
  promise: Promise<T>,
): Promise<[T | null, Error | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Format utilities
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const formatNumber = (num: number, locale = "en-US"): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatCurrency = (
  amount: number,
  currency = "USD",
  locale = "en-US",
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatRelativeTime = (date: Date, locale = "en-US"): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count >= 1) {
      return rtf.format(
        diffInSeconds < 0 ? -count : count,
        interval.label as Intl.RelativeTimeFormatUnit,
      );
    }
  }

  return rtf.format(0, "second");
};

// Export all utilities as default object
const typeHelpers = {
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isDate,
  isFunction,
  isPromise,

  // Validators
  hasProperty,
  hasRequiredProperties,
  isValidEmail,
  isValidUrl,
  isValidUUID,

  // Parsers
  safeParseInt,
  safeParseFloat,
  safeParseBoolean,
  safeParseDate,

  // Array utilities
  ensureArray,
  uniqueBy,
  groupBy,
  sortBy,
  flatten,

  // Object utilities
  pick,
  omit,
  deepClone,
  deepEqual,

  // String utilities
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  truncate,
  slugify,

  // Validation
  createValidator,

  // Performance
  debounce,
  throttle,
  memoize,

  // Error handling
  safeAsync,
  retry,

  // Formatting
  formatBytes,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
};

export default typeHelpers;
