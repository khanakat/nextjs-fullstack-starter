import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { MarkAllNotificationsReadCommand } from '../commands/mark-all-notifications-read-command';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';

/**
 * Mark All Notifications Read Handler
 * Handles marking all notifications as read for a user
 */
@injectable()
export class MarkAllNotificationsReadHandler extends CommandHandler<MarkAllNotificationsReadCommand, number> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async handle(command: MarkAllNotificationsReadCommand): Promise<Result<number>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<number>(new Error(validationResult.errors.join(', ')));
    }

    // Mark all notifications as read
    const count = await this.notificationRepository.markAllAsRead(command.props.userId);

    // Return result
    return Result.success(count);
  }

  private validate(command: MarkAllNotificationsReadCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.userId || command.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
