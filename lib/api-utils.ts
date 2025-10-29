import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { logger } from "./logger";

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Error types for better categorization
 */
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  CONFLICT = "CONFLICT_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  INTERNAL = "INTERNAL_ERROR",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE_ERROR",
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
}

/**
 * Enhanced API Error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ErrorType.INTERNAL,
    details?: any,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, ApiError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Predefined error creators for common scenarios
 */
export const createError = {
  validation: (message: string, details?: any) =>
    new ApiError(message, 400, ErrorType.VALIDATION, details),

  unauthorized: (message: string = "Unauthorized") =>
    new ApiError(message, 401, ErrorType.AUTHENTICATION),

  forbidden: (message: string = "Forbidden") =>
    new ApiError(message, 403, ErrorType.AUTHORIZATION),

  notFound: (resource: string = "Resource") =>
    new ApiError(`${resource} not found`, 404, ErrorType.NOT_FOUND),

  conflict: (message: string) => new ApiError(message, 409, ErrorType.CONFLICT),

  rateLimit: (message: string = "Rate limit exceeded") =>
    new ApiError(message, 429, ErrorType.RATE_LIMIT),

  internal: (message: string = "Internal server error", details?: any) =>
    new ApiError(message, 500, ErrorType.INTERNAL, details),

  externalService: (service: string, message?: string) =>
    new ApiError(
      message || `External service ${service} is unavailable`,
      502,
      ErrorType.EXTERNAL_SERVICE,
      { service },
    ),

  timeout: (operation: string) =>
    new ApiError(`Operation ${operation} timed out`, 504, ErrorType.TIMEOUT, {
      operation,
    }),
};

/**
 * Enhanced success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  meta?: any,
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  return NextResponse.json(response, { status });
}

/**
 * Enhanced error response helper
 */
export function errorResponse(
  error: string | ApiError,
  status?: number,
  code?: string,
  details?: any,
): NextResponse<ApiResponse> {
  let response: ApiResponse;

  if (error instanceof ApiError) {
    response = {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    };
    status = error.statusCode;
  } else {
    response = {
      success: false,
      error: typeof error === "string" ? error : "Unknown error",
      code: code || ErrorType.INTERNAL,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  return NextResponse.json(response, { status: status || 500 });
}

/**
 * Enhanced validation error response helper
 */
export function validationErrorResponse(
  errors: ZodError,
): NextResponse<ApiResponse> {
  const formattedErrors = errors.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
    received: "received" in err ? err.received : undefined,
  }));

  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      code: ErrorType.VALIDATION,
      details: formattedErrors,
      timestamp: new Date().toISOString(),
    },
    { status: 400 },
  );
}

/**
 * Enhanced async handler wrapper with comprehensive error handling and logging
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string,
) {
  return async (...args: T): Promise<NextResponse<ApiResponse>> => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    try {
      // Log request start
      if (context) {
        logger.debug(`API Request started: ${context}`, "API", { requestId });
      }

      const result = await handler(...args);

      // Log successful completion
      const duration = Date.now() - startTime;
      logger.debug(`API Request completed: ${context}`, "API", {
        requestId,
        duration: `${duration}ms`,
        success: true,
      });

      return result as NextResponse<ApiResponse>;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error logging
      const errorInfo = {
        requestId,
        context: context || "Unknown",
        duration: `${duration}ms`,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };

      if (error instanceof ApiError) {
        // Log operational errors at appropriate level
        const logLevel = error.statusCode >= 500 ? "error" : "warn";
        logger[logLevel](`API Error: ${error.message}`, "API", {
          ...errorInfo,
          statusCode: error.statusCode,
          code: error.code,
          isOperational: error.isOperational,
        });

        return errorResponse(error);
      }

      if (error instanceof ZodError) {
        logger.warn("API Validation Error", "API", {
          ...errorInfo,
          validationErrors: error.errors,
        });

        return validationErrorResponse(error);
      }

      // Log unexpected errors
      logger.error("Unexpected API Error", "API", errorInfo);

      return errorResponse(
        error instanceof Error ? error.message : "Internal server error",
        500,
        ErrorType.INTERNAL,
        process.env.NODE_ENV === "development" ? errorInfo : undefined,
      );
    }
  };
}

/**
 * Enhanced request validation helper
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw createError.validation("Invalid JSON in request body");
    }
    throw createError.validation("Invalid request body");
  }
}

/**
 * Enhanced method checker helper
 */
export function checkMethod(request: Request, allowedMethods: string[]): void {
  const method = request.method || "";
  if (!allowedMethods.includes(method)) {
    throw createError.validation(
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
      { allowedMethods, receivedMethod: method },
    );
  }
}

/**
 * Enhanced rate limiting helper with better tracking
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    };
    rateLimitMap.set(identifier, newRecord);

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit middleware helper
 */
export function withRateLimit(
  identifier: (request: Request) => string,
  limit: number = 10,
  windowMs: number = 60000,
) {
  return (handler: Function) => {
    return async (...args: any[]) => {
      const request = args[0] as Request;
      const id = identifier(request);
      const rateLimitResult = rateLimit(id, limit, windowMs);

      if (!rateLimitResult.allowed) {
        throw createError.rateLimit("Rate limit exceeded");
      }

      const response = await handler(...args);

      // Add rate limit headers to response
      if (response instanceof NextResponse) {
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set(
          "X-RateLimit-Remaining",
          rateLimitResult.remaining.toString(),
        );
        response.headers.set(
          "X-RateLimit-Reset",
          rateLimitResult.resetTime.toString(),
        );
      }

      return response;
    };
  };
}

/**
 * Enhanced CORS headers helper
 */
export function addCorsHeaders(
  response: NextResponse,
  options?: {
    origin?: string;
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  },
): NextResponse {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers = ["Content-Type", "Authorization"],
    credentials = false,
  } = options || {};

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
  response.headers.set("Access-Control-Allow-Headers", headers.join(", "));

  if (credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

/**
 * Helper to extract client IP from request
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Async timeout helper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = "Operation",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(createError.timeout(operation)), timeoutMs),
    ),
  ]);
}
