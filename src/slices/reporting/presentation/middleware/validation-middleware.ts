import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation middleware for API requests
 */
export class ValidationMiddleware {
  /**
   * Validate request body against a Zod schema
   */
  static async validateBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): Promise<{ isValid: boolean; data?: T; errors?: any[] }> {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          isValid: false,
          errors: error.errors,
        };
      }
      
      return {
        isValid: false,
        errors: [{ message: 'Invalid JSON body' }],
      };
    }
  }

  /**
   * Validate query parameters against a Zod schema
   */
  static validateQuery<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): { isValid: boolean; data?: T; errors?: any[] } {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      const validatedData = schema.parse(queryParams);
      
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          isValid: false,
          errors: error.errors,
        };
      }
      
      return {
        isValid: false,
        errors: [{ message: 'Invalid query parameters' }],
      };
    }
  }

  /**
   * Validate path parameters against a Zod schema
   */
  static validateParams<T>(
    params: any,
    schema: ZodSchema<T>
  ): { isValid: boolean; data?: T; errors?: any[] } {
    try {
      const validatedData = schema.parse(params);
      
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          isValid: false,
          errors: error.errors,
        };
      }
      
      return {
        isValid: false,
        errors: [{ message: 'Invalid path parameters' }],
      };
    }
  }

  /**
   * Create a validation error response
   */
  static createValidationErrorResponse(errors: any[]): NextResponse {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: errors,
      },
      { status: 400 }
    );
  }

  /**
   * Middleware wrapper for request validation
   */
  static withValidation<TBody = any, TQuery = any, TParams = any>(
    options: {
      bodySchema?: ZodSchema<TBody>;
      querySchema?: ZodSchema<TQuery>;
      paramsSchema?: ZodSchema<TParams>;
    }
  ) {
    return function (
      handler: (
        request: NextRequest,
        context: {
          params?: TParams;
          body?: TBody;
          query?: TQuery;
        }
      ) => Promise<NextResponse>
    ) {
      return async function (
        request: NextRequest,
        { params }: { params?: any } = {}
      ): Promise<NextResponse> {
        const context: {
          params?: TParams;
          body?: TBody;
          query?: TQuery;
        } = {};

        // Validate path parameters
        if (options.paramsSchema && params) {
          const paramsValidation = ValidationMiddleware.validateParams(
            params,
            options.paramsSchema
          );
          
          if (!paramsValidation.isValid) {
            return ValidationMiddleware.createValidationErrorResponse(
              paramsValidation.errors || []
            );
          }
          
          context.params = paramsValidation.data;
        }

        // Validate query parameters
        if (options.querySchema) {
          const queryValidation = ValidationMiddleware.validateQuery(
            request,
            options.querySchema
          );
          
          if (!queryValidation.isValid) {
            return ValidationMiddleware.createValidationErrorResponse(
              queryValidation.errors || []
            );
          }
          
          context.query = queryValidation.data;
        }

        // Validate request body (only for methods that typically have a body)
        if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const bodyValidation = await ValidationMiddleware.validateBody(
            request,
            options.bodySchema
          );
          
          if (!bodyValidation.isValid) {
            return ValidationMiddleware.createValidationErrorResponse(
              bodyValidation.errors || []
            );
          }
          
          context.body = bodyValidation.data;
        }

        // Call the actual handler with validated data
        return handler(request, context);
      };
    };
  }
}

// Common validation schemas
export const CommonSchemas = {
  // Pagination schema
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // ID parameter schema
  idParam: z.object({
    id: z.string().min(1),
  }),

  // Date range schema
  dateRange: z.object({
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }),

  // Organization filter schema
  organizationFilter: z.object({
    organizationId: z.string().optional(),
  }),
};

// Utility function to combine schemas
export function combineSchemas<T extends Record<string, ZodSchema>>(
  schemas: T
): z.ZodObject<any> {
  const combined = z.object(
    Object.entries(schemas).reduce((acc, [key, schema]) => {
      acc[key] = schema.optional();
      return acc;
    }, {} as any)
  );
  
  return combined;
}