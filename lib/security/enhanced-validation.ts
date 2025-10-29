/**
 * Enhanced Security Validation
 *
 * Mejoras adicionales para el sistema de validación de seguridad:
 * - Validación de entrada más robusta
 * - Detección de patrones maliciosos
 * - Sanitización avanzada
 * - Validación de archivos mejorada
 */

import { z } from "zod";
// import DOMPurify from "isomorphic-dompurify"; // Commented out as not available
import { NextRequest } from "next/server";

// Patrones maliciosos comunes
const MALICIOUS_PATTERNS = {
  SQL_INJECTION: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  ],
  XSS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ],
  PATH_TRAVERSAL: [/\.\.\//g, /\.\.\\/g, /%2e%2e%2f/gi, /%252e%252e%252f/gi],
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|curl|wget)\b/i,
  ],
  LDAP_INJECTION: [/[()=*!&|]/, /\x00/],
};

// Tipos de archivos permitidos por categoría
const ALLOWED_FILE_TYPES = {
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  documents: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  spreadsheets: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ],
  code: ["text/javascript", "text/css", "application/json", "text/html"],
};

// Límites de tamaño por tipo de archivo (en bytes)
const FILE_SIZE_LIMITS = {
  images: 10 * 1024 * 1024, // 10MB
  documents: 50 * 1024 * 1024, // 50MB
  spreadsheets: 25 * 1024 * 1024, // 25MB
  archives: 100 * 1024 * 1024, // 100MB
  code: 5 * 1024 * 1024, // 5MB
  default: 10 * 1024 * 1024, // 10MB
};

/**
 * Validador de seguridad mejorado
 */
export class EnhancedSecurityValidator {
  /**
   * Detecta patrones maliciosos en texto
   */
  static detectMaliciousPatterns(input: string): {
    isMalicious: boolean;
    threats: string[];
    sanitized: string;
  } {
    const threats: string[] = [];
    let sanitized = input;

    // Verificar SQL Injection
    if (
      MALICIOUS_PATTERNS.SQL_INJECTION.some((pattern) => pattern.test(input))
    ) {
      threats.push("SQL_INJECTION");
    }

    // Verificar XSS
    if (MALICIOUS_PATTERNS.XSS.some((pattern) => pattern.test(input))) {
      threats.push("XSS");
      // sanitized = DOMPurify.sanitize(sanitized); // Commented out as DOMPurify not available
    }

    // Verificar Path Traversal
    if (
      MALICIOUS_PATTERNS.PATH_TRAVERSAL.some((pattern) => pattern.test(input))
    ) {
      threats.push("PATH_TRAVERSAL");
      sanitized = sanitized.replace(/\.\.\//g, "").replace(/\.\.\\/g, "");
    }

    // Verificar Command Injection
    if (
      MALICIOUS_PATTERNS.COMMAND_INJECTION.some((pattern) =>
        pattern.test(input),
      )
    ) {
      threats.push("COMMAND_INJECTION");
    }

    // Verificar LDAP Injection
    if (
      MALICIOUS_PATTERNS.LDAP_INJECTION.some((pattern) => pattern.test(input))
    ) {
      threats.push("LDAP_INJECTION");
    }

    return {
      isMalicious: threats.length > 0,
      threats,
      sanitized,
    };
  }

  /**
   * Valida y sanitiza entrada de usuario
   */
  static validateAndSanitizeInput(
    input: any,
    options: {
      allowHtml?: boolean;
      maxLength?: number;
      required?: boolean;
    } = {},
  ): {
    isValid: boolean;
    sanitized: any;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input;

    // Verificar si es requerido
    if (options.required && (!input || input.toString().trim() === "")) {
      errors.push("Field is required");
      return { isValid: false, sanitized: null, errors };
    }

    // Si no hay input y no es requerido, retornar válido
    if (!input && !options.required) {
      return { isValid: true, sanitized: null, errors: [] };
    }

    // Convertir a string para validación
    const stringInput = input.toString();

    // Verificar longitud máxima
    if (options.maxLength && stringInput.length > options.maxLength) {
      errors.push(
        `Input exceeds maximum length of ${options.maxLength} characters`,
      );
    }

    // Detectar patrones maliciosos
    const threatAnalysis = this.detectMaliciousPatterns(stringInput);

    if (threatAnalysis.isMalicious) {
      errors.push(
        `Malicious patterns detected: ${threatAnalysis.threats.join(", ")}`,
      );
    }

    // Sanitizar según opciones
    if (options.allowHtml) {
      // sanitized = DOMPurify.sanitize(stringInput, {
      //   ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "a"],
      //   ALLOWED_ATTR: ["href", "target"],
      // }); // Commented out as DOMPurify not available
      sanitized = stringInput; // Use input as-is for now
    } else {
      sanitized = threatAnalysis.sanitized;
      // Escapar caracteres HTML si no se permite HTML
      sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  /**
   * Valida archivos subidos
   */
  static validateFile(
    file: {
      name: string;
      type: string;
      size: number;
      buffer?: Buffer;
    },
    category: keyof typeof ALLOWED_FILE_TYPES = "images",
  ): {
    isValid: boolean;
    errors: string[];
    metadata: {
      category: string;
      sizeLimit: number;
      allowedTypes: string[];
    };
  } {
    const errors: string[] = [];
    const allowedTypes = ALLOWED_FILE_TYPES[category];
    const sizeLimit = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.default;

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File type ${file.type} not allowed for category ${category}`,
      );
    }

    // Validar tamaño
    if (file.size > sizeLimit) {
      errors.push(`File size ${file.size} exceeds limit of ${sizeLimit} bytes`);
    }

    // Validar nombre de archivo
    const nameValidation = this.validateAndSanitizeInput(file.name, {
      maxLength: 255,
      required: true,
    });

    if (!nameValidation.isValid) {
      errors.push(`Invalid filename: ${nameValidation.errors.join(", ")}`);
    }

    // Validación adicional para archivos de imagen
    if (category === "images" && file.buffer) {
      const isValidImage = this.validateImageFile(file.buffer, file.type);
      if (!isValidImage) {
        errors.push("Invalid image file format or corrupted file");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        category,
        sizeLimit,
        allowedTypes,
      },
    };
  }

  /**
   * Valida archivos de imagen usando magic numbers
   */
  private static validateImageFile(buffer: Buffer, mimeType: string): boolean {
    const magicNumbers: Record<string, number[]> = {
      "image/jpeg": [0xff, 0xd8, 0xff],
      "image/png": [0x89, 0x50, 0x4e, 0x47],
      "image/gif": [0x47, 0x49, 0x46],
      "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const expectedMagic = magicNumbers[mimeType];
    if (!expectedMagic) return true; // No validation for unknown types

    // Verificar magic numbers
    for (let i = 0; i < expectedMagic.length; i++) {
      if (buffer[i] !== expectedMagic[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Valida parámetros de URL
   */
  static validateUrlParams(params: Record<string, any>): {
    isValid: boolean;
    sanitized: Record<string, any>;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Validar clave del parámetro
      const keyValidation = this.validateAndSanitizeInput(key, {
        maxLength: 100,
        required: true,
      });

      if (!keyValidation.isValid) {
        errors.push(
          `Invalid parameter key "${key}": ${keyValidation.errors.join(", ")}`,
        );
        continue;
      }

      // Validar valor del parámetro
      const valueValidation = this.validateAndSanitizeInput(value, {
        maxLength: 1000,
      });

      if (!valueValidation.isValid) {
        errors.push(
          `Invalid parameter value for "${key}": ${valueValidation.errors.join(", ")}`,
        );
        continue;
      }

      sanitized[keyValidation.sanitized] = valueValidation.sanitized;
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  /**
   * Valida headers de request
   */
  static validateRequestHeaders(headers: Headers): {
    isValid: boolean;
    threats: string[];
    suspiciousHeaders: string[];
  } {
    const threats: string[] = [];
    const suspiciousHeaders: string[] = [];

    // Headers sospechosos que podrían indicar ataques
    const suspiciousPatterns = [
      "x-forwarded-for",
      "x-real-ip",
      "x-cluster-client-ip",
      "cf-connecting-ip",
    ];

    // Verificar cada header
    headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();

      // Detectar headers sospechosos
      if (suspiciousPatterns.some((pattern) => lowerName.includes(pattern))) {
        suspiciousHeaders.push(name);
      }

      // Validar valor del header
      const threatAnalysis = this.detectMaliciousPatterns(value);
      if (threatAnalysis.isMalicious) {
        threats.push(
          `Malicious pattern in header "${name}": ${threatAnalysis.threats.join(", ")}`,
        );
      }

      // Verificar longitud excesiva
      if (value.length > 8192) {
        // 8KB limit
        threats.push(`Header "${name}" exceeds maximum length`);
      }
    });

    return {
      isValid: threats.length === 0,
      threats,
      suspiciousHeaders,
    };
  }

  /**
   * Valida el cuerpo de la request
   */
  static async validateRequestBody(
    request: NextRequest,
    options: {
      maxSize?: number;
      allowedContentTypes?: string[];
      requireContentType?: boolean;
    } = {},
  ): Promise<{
    isValid: boolean;
    errors: string[];
    sanitizedBody?: any;
  }> {
    const errors: string[] = [];
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedContentTypes = options.allowedContentTypes || [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "text/plain",
    ];

    // Verificar Content-Type
    const contentType = request.headers.get("content-type");

    if (options.requireContentType && !contentType) {
      errors.push("Content-Type header is required");
      return { isValid: false, errors };
    }

    if (
      contentType &&
      !allowedContentTypes.some((type) => contentType.includes(type))
    ) {
      errors.push(`Content-Type "${contentType}" not allowed`);
      return { isValid: false, errors };
    }

    // Verificar Content-Length
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxSize) {
      errors.push(
        `Request body size ${contentLength} exceeds maximum of ${maxSize} bytes`,
      );
      return { isValid: false, errors };
    }

    try {
      // Intentar parsear el cuerpo según el Content-Type
      let body: any;

      if (contentType?.includes("application/json")) {
        body = await request.json();

        // Validar JSON recursivamente
        const jsonValidation = this.validateJsonObject(body);
        if (!jsonValidation.isValid) {
          errors.push(...jsonValidation.errors);
        }

        return {
          isValid: errors.length === 0,
          errors,
          sanitizedBody: jsonValidation.sanitized,
        };
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        const formObject: Record<string, any> = {};

        formData.forEach((value, key) => {
          formObject[key] = value;
        });

        const formValidation = this.validateUrlParams(formObject);
        if (!formValidation.isValid) {
          errors.push(...formValidation.errors);
        }

        return {
          isValid: errors.length === 0,
          errors,
          sanitizedBody: formValidation.sanitized,
        };
      }

      return { isValid: true, errors: [] };
    } catch (error) {
      errors.push(
        `Failed to parse request body: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { isValid: false, errors };
    }
  }

  /**
   * Valida objetos JSON recursivamente
   */
  private static validateJsonObject(
    obj: any,
    depth = 0,
  ): {
    isValid: boolean;
    sanitized: any;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxDepth = 10; // Prevenir ataques de profundidad excesiva

    if (depth > maxDepth) {
      errors.push("JSON object depth exceeds maximum allowed");
      return { isValid: false, sanitized: null, errors };
    }

    if (obj === null || obj === undefined) {
      return { isValid: true, sanitized: obj, errors: [] };
    }

    if (typeof obj === "string") {
      const validation = this.validateAndSanitizeInput(obj, {
        maxLength: 10000,
      });
      return {
        isValid: validation.isValid,
        sanitized: validation.sanitized,
        errors: validation.errors,
      };
    }

    if (typeof obj === "number" || typeof obj === "boolean") {
      return { isValid: true, sanitized: obj, errors: [] };
    }

    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        // Límite de elementos en array
        errors.push("Array exceeds maximum length of 1000 elements");
        return { isValid: false, sanitized: null, errors };
      }

      const sanitizedArray: any[] = [];
      for (let i = 0; i < obj.length; i++) {
        const itemValidation = this.validateJsonObject(obj[i], depth + 1);
        if (!itemValidation.isValid) {
          errors.push(`Array item ${i}: ${itemValidation.errors.join(", ")}`);
        } else {
          sanitizedArray.push(itemValidation.sanitized);
        }
      }

      return {
        isValid: errors.length === 0,
        sanitized: sanitizedArray,
        errors,
      };
    }

    if (typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length > 100) {
        // Límite de propiedades en objeto
        errors.push("Object exceeds maximum of 100 properties");
        return { isValid: false, sanitized: null, errors };
      }

      const sanitizedObject: Record<string, any> = {};
      for (const key of keys) {
        const keyValidation = this.validateAndSanitizeInput(key, {
          maxLength: 100,
        });
        if (!keyValidation.isValid) {
          errors.push(
            `Object key "${key}": ${keyValidation.errors.join(", ")}`,
          );
          continue;
        }

        const valueValidation = this.validateJsonObject(obj[key], depth + 1);
        if (!valueValidation.isValid) {
          errors.push(
            `Object property "${key}": ${valueValidation.errors.join(", ")}`,
          );
        } else {
          sanitizedObject[keyValidation.sanitized] = valueValidation.sanitized;
        }
      }

      return {
        isValid: errors.length === 0,
        sanitized: sanitizedObject,
        errors,
      };
    }

    errors.push(`Unsupported data type: ${typeof obj}`);
    return { isValid: false, sanitized: null, errors };
  }
}

// Schemas de validación mejorados
export const enhancedValidationSchemas = {
  // Validación de entrada de texto segura
  safeText: z
    .string()
    .min(1)
    .max(1000)
    .refine((val) => {
      const validation =
        EnhancedSecurityValidator.validateAndSanitizeInput(val);
      return validation.isValid;
    }, "Text contains malicious patterns"),

  // Validación de HTML seguro
  safeHtml: z
    .string()
    .max(10000)
    .refine((val) => {
      const validation = EnhancedSecurityValidator.validateAndSanitizeInput(
        val,
        { allowHtml: true },
      );
      return validation.isValid;
    }, "HTML contains malicious patterns"),

  // Validación de archivos
  fileUpload: z
    .object({
      name: z.string().min(1).max(255),
      type: z.string().min(1),
      size: z
        .number()
        .positive()
        .max(100 * 1024 * 1024), // 100MB max
    })
    .refine((file) => {
      const validation = EnhancedSecurityValidator.validateFile(file);
      return validation.isValid;
    }, "Invalid file"),

  // Validación de parámetros de URL
  urlParams: z.record(z.string(), z.any()).refine((params) => {
    const validation = EnhancedSecurityValidator.validateUrlParams(params);
    return validation.isValid;
  }, "Invalid URL parameters"),
};

export default EnhancedSecurityValidator;
