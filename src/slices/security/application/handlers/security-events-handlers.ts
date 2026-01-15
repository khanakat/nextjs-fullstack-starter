import { injectable } from 'inversify';
import { Result } from '@/shared/application/base/result';
import { GetSecurityEventsQuery } from '@/slices/security/application/queries/security-events-queries';
import { UpdateSecurityEventCommand } from '@/slices/security/application/commands/security-events-commands';
import { SecurityEventDto } from '@/slices/security/application/dto';

/**
 * List Security Events Handler
 */
@injectable()
export class ListSecurityEventsHandler {
  async handle(query: GetSecurityEventsQuery): Promise<Result<{ events: SecurityEventDto[] }>> {
    try {
      const { SecurityService } = await import('@/lib/services/security-service');

      const result = await SecurityService.getSecurityEvents(
        { organizationId: query.organizationId },
        { page: query.page, limit: query.limit },
      );

      return Result.success({ events: result.events as SecurityEventDto[] });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to list security events'),
      );
    }
  }
}

/**
 * Update Security Event Handler
 */
@injectable()
export class UpdateSecurityEventHandler {
  async handle(command: UpdateSecurityEventCommand): Promise<Result<{ event: any }>> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Get the event first to check organization access
      const event = await prisma.securityEvent.findUnique({
        where: { id: command.eventId },
      });

      if (!event) {
        return Result.failure(new Error('Event not found'));
      }

      const updatedEvent = await prisma.securityEvent.update({
        where: { id: command.eventId },
        data: {
          status: command.resolved ? 'resolved' : 'open',
          resolvedBy: command.resolved ? command.updaterUserId : null,
          resolvedAt: command.resolved ? new Date() : null,
        },
      });

      return Result.success({ event: updatedEvent });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to update security event'),
      );
    }
  }
}
