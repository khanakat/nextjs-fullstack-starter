import { Command } from './command';
import { Result } from './result';

/**
 * Interface for command handlers
 */
export interface ICommandHandler<TCommand extends Command, TResult> {
  handle(command: TCommand): Promise<Result<TResult>>;
}

/**
 * Abstract base class for command handlers
 */
export abstract class CommandHandler<TCommand extends Command, TResult>
  implements ICommandHandler<TCommand, TResult> {
  
  abstract handle(command: TCommand): Promise<Result<TResult>>;

  /**
   * Template method for command handling with validation and error handling
   */
  protected async handleWithValidation(
    command: TCommand,
    handler: (command: TCommand) => Promise<TResult>
  ): Promise<Result<TResult>> {
    // Ensure null/undefined commands cause a rejected promise as tests expect
    if (command == null) {
      throw new Error('Command cannot be null or undefined');
    }
    try {
      // Validate command
      command.validate();

      // Execute handler
      const result = await handler(command);
      return Result.success(result);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}