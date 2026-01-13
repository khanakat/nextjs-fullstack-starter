/**
 * Base Command class for CQRS pattern
 * Commands represent write operations that change system state
 */
export abstract class Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly userId?: string;

  constructor(userId?: string) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
  }

  /**
   * Gets command metadata
   */
  public getMetadata(): Record<string, any> {
    return {
      commandId: this.commandId,
      commandType: this.constructor.name,
      timestamp: this.timestamp,
      userId: this.userId,
    };
  }

  /**
   * Validates the command
   * Override in derived classes for specific validation
   */
  public validate(): void {
    // Base validation can be implemented here
  }
}