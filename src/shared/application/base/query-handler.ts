import { Query } from './query';
import { Result } from './result';

/**
 * Interface for query handlers
 */
export interface IQueryHandler<TQuery extends Query, TResult> {
  handle(query: TQuery): Promise<Result<TResult>>;
}

/**
 * Abstract base class for query handlers
 */
export abstract class QueryHandler<TQuery extends Query, TResult>
  implements IQueryHandler<TQuery, TResult> {
  
  abstract handle(query: TQuery): Promise<Result<TResult>>;

  /**
   * Template method for query handling with validation and error handling
   */
  protected async handleWithValidation(
    query: TQuery,
    handler: (query: TQuery) => Promise<TResult>
  ): Promise<Result<TResult>> {
    try {
      // Validate query
      query.validate();

      // Execute handler
      const result = await handler(query);
      return Result.success(result);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}