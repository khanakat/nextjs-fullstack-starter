import { Command } from '../../base/command';

/**
 * Invalidate Cache Command
 * Command to invalidate cache entries by tag or pattern
 */
export class InvalidateCacheCommand extends Command {
  constructor(
    public readonly tag?: string,
    public readonly pattern?: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.tag && !this.pattern) {
      throw new Error('Either tag or pattern must be specified');
    }
    if (this.tag && this.pattern) {
      throw new Error('Only one of tag or pattern can be specified');
    }
    if (this.tag && typeof this.tag !== 'string') {
      throw new Error('Cache tag must be a string');
    }
    if (this.pattern && typeof this.pattern !== 'string') {
      throw new Error('Cache pattern must be a string');
    }
  }
}
