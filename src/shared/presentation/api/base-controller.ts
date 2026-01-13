import { NextResponse } from 'next/server';

/**
 * Base Controller class for all API controllers
 * Provides standardized HTTP response methods
 */
export abstract class BaseController {
  protected ok<T>(data: T): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected created<T>(data: T): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  }

  protected noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  protected badRequest(message: string, details?: any): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'BAD_REQUEST',
        message,
        details,
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  protected unauthorized(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'UNAUTHORIZED',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status: 401 });
  }

  protected forbidden(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'FORBIDDEN',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status: 403 });
  }

  protected notFound(message: string): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'NOT_FOUND',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status: 404 });
  }

  protected conflict(message: string): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'CONFLICT',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status: 409 });
  }

  protected unprocessableEntity(message: string, validationErrors?: any): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'UNPROCESSABLE_ENTITY',
        message,
        validationErrors,
        timestamp: new Date().toISOString()
      }
    }, { status: 422 });
  }

  protected internalError(message: string = 'Internal server error'): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }

  /**
   * Handle errors from use cases and map to appropriate HTTP responses
   */
  protected handleError(error: Error): NextResponse {
    console.error('Controller error:', error);

    // Map domain errors to HTTP responses
    if (error.name === 'ValidationError') {
      return this.badRequest(error.message);
    }

    if (error.name === 'NotFoundError') {
      return this.notFound(error.message);
    }

    if (error.name === 'UnauthorizedError') {
      return this.unauthorized(error.message);
    }

    if (error.name === 'ForbiddenError') {
      return this.forbidden(error.message);
    }

    // Default to internal server error
    return this.internalError('An unexpected error occurred');
  }
}