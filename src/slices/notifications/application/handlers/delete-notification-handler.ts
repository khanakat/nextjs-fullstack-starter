import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteNotificationCommand } from '../commands/delete-notification-command';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { NotificationId } from '../../domain/value-objects/notification-id';

/**
 * Delete Notification Handler
 * Handles deletion of notifications
 */
@injectable()
export class DeleteNotificationHandler extends CommandHandler<DeleteNotificationCommand, boolean> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async handle(command: DeleteNotificationCommand): Promise<Result<boolean>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<boolean>(new Error(validationResult.errors.join(', ')));
    }

    // Find notification
    const notificationId = NotificationId.fromValue(command.props.notificationId);
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      return Result.failure<boolean>(new Error('Notification not found'));
    }

    // Check ownership
    if (notification.userId !== command.props.userId) {
      return Result.failure<boolean>(new Error('Not authorized to delete this notification'));
    }

    // Delete notification
    const deleted = await this.notificationRepository.delete(notificationId);

    // Return result
    return Result.success(deleted);
  }

  private validate(command: DeleteNotificationCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.notificationId || command.props.notificationId.trim() === '') {
      errors.push('Notification ID is required');
    }

    if (!command.props.userId || command.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
