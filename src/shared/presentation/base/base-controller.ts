import { NextRequest, NextResponse } from 'next/server';
import { Result } from '../../application/base/result';
import { DomainError } from '../../domain/exceptions/domain-error';
import { ValidationError } from '../../domain/exceptions/validation-error';
import { NotFoundError } from '../../domain/exceptions/not-found-error';
import { BusinessRuleViolationError } from '../../domain/exceptions/business-rule-violation-error';

/**
 * Base controller for API endpoints
 * Provides common functionality for handling requests and responses
 */
export abstract class BaseController {
  /**
   * Execute a use case and return appropriate HTTP response
   */
  protected async execute<T>(
    request: NextRequest,
    operation: () => Promise<Result<T>>
  ): Promise<NextResponse> {
    try {
      const result = await operation();

      if (result.isSuccess) {
        return this.ok(result.value);
      } else {
        return this.handleError(result.error);
      }
    } catch (error) {
      console.error('Unexpected error in controller:', error);
      return this.internalServerError('An unexpected error occurred');
    }
  }

  /**
   * Handle domain errors and return appropriate HTTP responses
   */
  private handleError(error: Error): NextResponse {
    if (error instanceof ValidationError) {
      return this.badRequest({
        message: error.message,
        field: error.field,
        validationRule: error.validationRule,
        errorCode: error.errorCode
      });
    }

    if (error instanceof NotFoundError) {
      return this.notFound({
        message: error.message,
        entityType: error.entityType,
        entityId: error.entityId,
        errorCode: error.errorCode
      });
    }

    if (error instanceof BusinessRuleViolationError) {
      return this.badRequest({
        message: error.message,
        ruleName: error.ruleName,
        context: error.context,
        errorCode: error.errorCode
      });
    }

    if (error instanceof DomainError) {
      return this.badRequest({
        message: error.message,
        errorCode: error.errorCode,
        timestamp: error.timestamp
      });
    }

    // Generic error
    return this.internalServerError(error.message);
  }

  /**
   * Parse JSON body from request
   */
  protected async parseBody<T>(request: NextRequest): Promise<T> {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }

  /**
   * Get query parameters from request
   */
  protected getQueryParams(request: NextRequest): URLSearchParams {
    return new URL(request.url).searchParams;
  }

  /**
   * Get path parameters from request
   */
  protected getPathParam(request: NextRequest, param: string): string | null {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    // This is a simplified implementation
    // In a real app, you'd use Next.js dynamic routing
    return pathSegments[pathSegments.length - 1] || null;
  }

  // HTTP Response helpers
  protected ok<T>(data?: T): NextResponse {
    return NextResponse.json(data, { status: 200 });
  }

  protected created<T>(data?: T): NextResponse {
    return NextResponse.json(data, { status: 201 });
  }

  protected noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  protected badRequest(error: any): NextResponse {
    return NextResponse.json({ error }, { status: 400 });
  }

  protected unauthorized(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json({ error: { message } }, { status: 401 });
  }

  protected forbidden(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json({ error: { message } }, { status: 403 });
  }

  protected notFound(error: any): NextResponse {
    return NextResponse.json({ error }, { status: 404 });
  }

  protected conflict(message: string): NextResponse {
    return NextResponse.json({ error: { message } }, { status: 409 });
  }

  protected internalServerError(message: string = 'Internal Server Error'): NextResponse {
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}