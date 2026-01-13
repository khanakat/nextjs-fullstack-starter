/**
 * Base Query class for CQRS pattern
 * Queries represent read operations that don't change system state
 */
export abstract class Query {
  public readonly queryId: string;
  public readonly timestamp: Date;
  public readonly userId?: string;

  constructor(userId?: string) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
  }

  /**
   * Gets query metadata
   */
  public getMetadata(): Record<string, any> {
    return {
      queryId: this.queryId,
      queryType: this.constructor.name,
      timestamp: this.timestamp,
      userId: this.userId,
    };
  }

  /**
   * Validates the query
   * Override in derived classes for specific validation
   */
  public validate(): void {
    // Base validation can be implemented here
  }
}