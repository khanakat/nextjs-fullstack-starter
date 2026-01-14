import { Command } from '../../base/command';

/**
 * Clear Cache Command
 * Command to clear all cache entries
 */
export class ClearCacheCommand extends Command {
  constructor(userId?: string) {
    super(userId);
  }

  public validate(): void {
    // No validation needed for clear command
  }
}
