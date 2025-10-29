/**
 * Tests for TypeScript Utility Helpers
 * 
 */

import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isDate,
  isValidEmail,
  isValidUrl,
  isValidUUID,
  safeParseInt,
  safeParseFloat,
  safeParseBoolean,
  safeParseDate,
  debounce,
  throttle,
  deepEqual,
  deepClone,
  formatBytes,
  formatNumber,
  formatCurrency,
  slugify,
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
} from "@/lib/utils/type-helpers";

describe("Type Guards", () => {
  describe("isString", () => {
    it("should return true for strings", () => {
      expect(isString("hello")).toBe(true);
      expect(isString("")).toBe(true);
    });

    it("should return false for non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("should return true for valid numbers", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("should return false for invalid numbers", () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("should return true for booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it("should return false for non-booleans", () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean("true")).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe("isObject", () => {
    it("should return true for plain objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
    });

    it("should return false for non-objects", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject("string")).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray({})).toBe(false);
      expect(isArray("string")).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe("isDate", () => {
    it("should return true for valid dates", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date("2023-01-01"))).toBe(true);
    });

    it("should return false for invalid dates", () => {
      expect(isDate(new Date("invalid"))).toBe(false);
      expect(isDate("2023-01-01")).toBe(false);
      expect(isDate(null)).toBe(false);
    });
  });
});

describe("Validators", () => {
  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
      expect(isValidUrl("ftp://files.example.com")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("example.com")).toBe(false);
      expect(isValidUrl(123)).toBe(false);
    });
  });

  describe("isValidUUID", () => {
    it("should return true for valid UUIDs", () => {
      expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should return false for invalid UUIDs", () => {
      expect(isValidUUID("not-a-uuid")).toBe(false);
      expect(isValidUUID("123e4567-e89b-12d3-a456")).toBe(false);
      expect(isValidUUID(123)).toBe(false);
    });
  });
});

describe("Safe Parsers", () => {
  describe("safeParseInt", () => {
    it("should parse valid integers", () => {
      expect(safeParseInt("123")).toBe(123);
      expect(safeParseInt(123.7)).toBe(123);
      expect(safeParseInt("123.7")).toBe(123);
    });

    it("should return default value for invalid input", () => {
      expect(safeParseInt("not-a-number")).toBe(0);
      expect(safeParseInt("not-a-number", 42)).toBe(42);
      expect(safeParseInt(null)).toBe(0);
    });
  });

  describe("safeParseFloat", () => {
    it("should parse valid floats", () => {
      expect(safeParseFloat("123.45")).toBe(123.45);
      expect(safeParseFloat(123.45)).toBe(123.45);
    });

    it("should return default value for invalid input", () => {
      expect(safeParseFloat("not-a-number")).toBe(0);
      expect(safeParseFloat("not-a-number", 3.14)).toBe(3.14);
    });
  });

  describe("safeParseBoolean", () => {
    it("should parse valid boolean strings", () => {
      expect(safeParseBoolean("true")).toBe(true);
      expect(safeParseBoolean("false")).toBe(false);
      expect(safeParseBoolean("1")).toBe(true);
      expect(safeParseBoolean("0")).toBe(false);
      expect(safeParseBoolean("yes")).toBe(true);
      expect(safeParseBoolean("no")).toBe(false);
    });

    it("should handle boolean values", () => {
      expect(safeParseBoolean(true)).toBe(true);
      expect(safeParseBoolean(false)).toBe(false);
    });

    it("should handle numbers", () => {
      expect(safeParseBoolean(1)).toBe(true);
      expect(safeParseBoolean(0)).toBe(false);
      expect(safeParseBoolean(42)).toBe(true);
    });

    it("should return default for invalid input", () => {
      expect(safeParseBoolean("invalid")).toBe(false);
      expect(safeParseBoolean("invalid", true)).toBe(true);
    });
  });

  describe("safeParseDate", () => {
    it("should parse valid date strings", () => {
      const result = safeParseDate("2023-01-01");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it("should handle Date objects", () => {
      const date = new Date("2023-01-01");
      expect(safeParseDate(date)).toBe(date);
    });

    it("should return default for invalid input", () => {
      expect(safeParseDate("invalid-date")).toBeUndefined();
      const defaultDate = new Date("2023-01-01");
      expect(safeParseDate("invalid-date", defaultDate)).toBe(defaultDate);
    });
  });
});

describe("Performance Utilities", () => {
  describe("debounce", () => {
    jest.useFakeTimers();

    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("arg3");
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe("throttle", () => {
    jest.useFakeTimers();

    it("should throttle function calls", () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn("arg1");
      throttledFn("arg2");
      throttledFn("arg3");

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("arg1");

      jest.advanceTimersByTime(100);

      throttledFn("arg4");
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith("arg4");
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});

describe("Object Utilities", () => {
  describe("deepEqual", () => {
    it("should return true for equal objects", () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    });

    it("should return false for different objects", () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it("should handle primitive values", () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual("hello", "hello")).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(1, 2)).toBe(false);
    });
  });

  describe("deepClone", () => {
    it("should create deep copies of objects", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it("should handle arrays", () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it("should handle primitive values", () => {
      expect(deepClone(1)).toBe(1);
      expect(deepClone("hello")).toBe("hello");
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });
  });
});

describe("String Utilities", () => {
  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("HELLO")).toBe("Hello");
      expect(capitalize("hELLO")).toBe("Hello");
    });
  });

  describe("camelCase", () => {
    it("should convert to camelCase", () => {
      expect(camelCase("hello world")).toBe("helloWorld");
      expect(camelCase("Hello World")).toBe("helloWorld");
      expect(camelCase("hello-world")).toBe("helloWorld");
    });
  });

  describe("kebabCase", () => {
    it("should convert to kebab-case", () => {
      expect(kebabCase("helloWorld")).toBe("hello-world");
      expect(kebabCase("HelloWorld")).toBe("hello-world");
      expect(kebabCase("hello world")).toBe("hello-world");
    });
  });

  describe("snakeCase", () => {
    it("should convert to snake_case", () => {
      expect(snakeCase("helloWorld")).toBe("hello_world");
      expect(snakeCase("HelloWorld")).toBe("hello_world");
      expect(snakeCase("hello world")).toBe("hello_world");
    });
  });

  describe("slugify", () => {
    it("should create URL-friendly slugs", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify("  Hello   World  ")).toBe("hello-world");
      expect(slugify("Hello@World#Test")).toBe("helloworldtest");
    });
  });
});

describe("Format Utilities", () => {
  describe("formatBytes", () => {
    it("should format bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("should handle decimals", () => {
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
      expect(formatBytes(1536, 0)).toBe("2 KB");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with locale", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
      expect(formatNumber(1234567, "de-DE")).toBe("1.234.567");
    });
  });

  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/\$1,234\.56/);
    });

    it("should handle different currencies", () => {
      const result = formatCurrency(1234.56, "EUR", "de-DE");
      expect(result).toMatch(/1\.234,56\s*€/);
    });
  });
});
