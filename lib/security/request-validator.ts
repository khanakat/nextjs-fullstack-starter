import { NextRequest } from "next/server";
import { z } from "zod";

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitizedData?: any;
}

export interface RequestValidationConfig {
  maxBodySize?: number;
  allowedMethods?: string[];
  requiredHeaders?: string[];
  sanitizeInput?: boolean;
  validateJSON?: boolean;
  customValidators?: Array<(req: NextRequest) => ValidationResult>;
}

const DEFAULT_CONFIG: RequestValidationConfig = {
  maxBodySize: 10 * 1024 * 1024, // 10MB
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  requiredHeaders: [],
  sanitizeInput: true,
  validateJSON: true,
  customValidators: [],
};

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  uuid: z.string().uuid(),
  url: z.string().url().max(2048),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  ipAddress: z.string().ip(),
  dateString: z.string().datetime(),
  positiveInteger: z.number().int().positive(),
  nonEmptyString: z.string().min(1).max(1000),
  safeHtml: z.string().max(10000),
};

// Input sanitization functions
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
      return parsed.toString();
    } catch {
      return "";
    }
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      if (typeof value === "string") {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
    }
    return sanitized;
  }
}

// Request validation class
export class RequestValidator {
  private config: RequestValidationConfig;

  constructor(config: Partial<RequestValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async validateRequest(req: NextRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate HTTP method
    if (
      this.config.allowedMethods &&
      !this.config.allowedMethods.includes(req.method)
    ) {
      errors.push(`Method ${req.method} not allowed`);
    }

    // Validate required headers
    if (this.config.requiredHeaders) {
      for (const header of this.config.requiredHeaders) {
        if (!req.headers.get(header)) {
          errors.push(`Required header ${header} is missing`);
        }
      }
    }

    // Validate content length
    const contentLength = req.headers.get("content-length");
    if (contentLength && this.config.maxBodySize) {
      const size = parseInt(contentLength, 10);
      if (size > this.config.maxBodySize) {
        errors.push(
          `Request body too large: ${size} bytes (max: ${this.config.maxBodySize})`,
        );
      }
    }

    // Validate JSON content type for POST/PUT/PATCH
    if (
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      this.config.validateJSON
    ) {
      const contentType = req.headers.get("content-type");
      if (
        contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data")
      ) {
        errors.push(
          "Invalid content type. Expected application/json or multipart/form-data",
        );
      }
    }

    // Run custom validators
    if (this.config.customValidators) {
      for (const validator of this.config.customValidators) {
        const result = validator(req);
        if (!result.isValid && result.errors) {
          errors.push(...result.errors);
        }
      }
    }

    // Validate and sanitize request body
    let sanitizedData: any = null;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      try {
        const body = await req.json();
        if (this.config.sanitizeInput) {
          sanitizedData = InputSanitizer.sanitizeObject(body);
        } else {
          sanitizedData = body;
        }
      } catch (error) {
        if (req.headers.get("content-type")?.includes("application/json")) {
          errors.push("Invalid JSON in request body");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitizedData,
    };
  }

  validateSchema<T>(data: unknown, schema: z.ZodSchema<T>): ValidationResult {
    try {
      const result = schema.parse(data);
      return {
        isValid: true,
        sanitizedData: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`,
          ),
        };
      }
      return {
        isValid: false,
        errors: ["Validation failed"],
      };
    }
  }
}

// Predefined validators for common use cases
export const VALIDATORS = {
  api: new RequestValidator({
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    maxBodySize: 10 * 1024 * 1024, // 10MB
    validateJSON: true,
    sanitizeInput: true,
  }),

  upload: new RequestValidator({
    allowedMethods: ["POST"],
    maxBodySize: 100 * 1024 * 1024, // 100MB
    validateJSON: false,
    sanitizeInput: false,
  }),

  webhook: new RequestValidator({
    allowedMethods: ["POST"],
    maxBodySize: 1 * 1024 * 1024, // 1MB
    validateJSON: true,
    sanitizeInput: false,
    requiredHeaders: ["user-agent"],
  }),

  public: new RequestValidator({
    allowedMethods: ["GET"],
    maxBodySize: 0,
    validateJSON: false,
    sanitizeInput: true,
  }),
};

export const validators = VALIDATORS;

// Security validation helpers
export function validateIPAddress(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function validateUserAgent(userAgent: string): boolean {
  // Basic user agent validation - should contain browser/version info
  const validUserAgentRegex = /^[a-zA-Z0-9\s\(\)\/\.\-_,;:]+$/;
  return (
    validUserAgentRegex.test(userAgent) &&
    userAgent.length > 10 &&
    userAgent.length < 500
  );
}

export function detectSuspiciousPatterns(input: string): string[] {
  const suspiciousPatterns = [
    { pattern: /<script/i, description: "Potential XSS attempt" },
    { pattern: /javascript:/i, description: "JavaScript protocol detected" },
    { pattern: /on\w+\s*=/i, description: "Event handler detected" },
    { pattern: /union\s+select/i, description: "Potential SQL injection" },
    { pattern: /drop\s+table/i, description: "Potential SQL injection" },
    { pattern: /\.\.\/|\.\.\\/, description: "Path traversal attempt" },
    { pattern: /eval\s*\(/i, description: "Code evaluation attempt" },
    { pattern: /exec\s*\(/i, description: "Code execution attempt" },
  ];

  const detected: string[] = [];
  for (const { pattern, description } of suspiciousPatterns) {
    if (pattern.test(input)) {
      detected.push(description);
    }
  }
  return detected;
}
