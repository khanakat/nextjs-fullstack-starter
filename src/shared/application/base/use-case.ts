import { Result } from './result';

/**
 * Base Use Case interface
 * All use cases should implement this interface
 */
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<Result<TResponse>>;
}

/**
 * Abstract base class for use cases
 */
export abstract class UseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<Result<TResponse>>;

  /**
   * Template method for use case execution with common error handling
   */
  protected async executeWithErrorHandling(
    request: TRequest,
    handler: (request: TRequest) => Promise<TResponse>
  ): Promise<Result<TResponse>> {
    try {
      const response = await handler(request);
      return Result.success(response);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}