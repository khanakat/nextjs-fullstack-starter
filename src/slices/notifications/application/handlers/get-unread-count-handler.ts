import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetUnreadCountQuery } from '../queries/get-unread-count-query';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { UnreadCountDto } from '../dtos/unread-count-dto';

/**
 * Get Unread Count Handler
 * Handles retrieving unread notification count for a user
 */
@injectable()
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery, UnreadCountDto> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {}

  async handle(query: GetUnreadCountQuery): Promise<Result<UnreadCountDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<UnreadCountDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get unread count
    const count = await this.notificationRepository.getUnreadCount(query.props.userId);

    // Return DTO
    return Result.success(new UnreadCountDto(count));
  }

  private validate(query: GetUnreadCountQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.userId || query.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
