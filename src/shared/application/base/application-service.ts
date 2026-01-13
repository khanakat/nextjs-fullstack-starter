import { injectable } from 'inversify';

/**
 * Base class for application services
 * Provides common functionality and patterns for application layer services
 */
@injectable()
export abstract class ApplicationService {
  /**
   * Execute a service operation with error handling
   */
  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log error and re-throw
      console.error(`Error in ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Validate input parameters
   */
  protected validateInput(input: any, validationRules: any): void {
    // Basic validation logic - can be extended with a validation library
    if (!input) {
      throw new Error('Input is required');
    }
  }

  /**
   * Get service name for logging
   */
  protected getServiceName(): string {
    return this.constructor.name;
  }
}