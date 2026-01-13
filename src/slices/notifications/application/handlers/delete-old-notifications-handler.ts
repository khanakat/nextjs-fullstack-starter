import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteOldNotificationsCommand } from '../commands/delete-old-notifications-command';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';

/**
 * Delete Old Notifications Handler
 * Handles deletion of old notifications
 */
@injectable()
export class DeleteOldNotificationsHandler extends CommandHandler<DeleteOldNotificationsCommand, number> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async handle(command: DeleteOldNotificationsCommand): Promise<Result<number>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<number>(new Error(validationResult.errors.join(', ')));
    }

    // Delete old notifications
    const count = await this.notificationRepository.deleteOldNotifications(command.props.olderThanDays || 30);

    // Return result
    return Result.success(count);
  }

  private validate(command: DeleteOldNotificationsCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.olderThanDays || command.props.olderThanDays <= 0) {
      errors.push('Older than days must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
