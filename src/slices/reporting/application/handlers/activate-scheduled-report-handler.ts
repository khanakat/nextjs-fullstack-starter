import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';

/**
 * TODO: Implement ActivateScheduledReportHandler
 * Placeholder to prevent TypeScript compilation errors
 */
@injectable()
export class ActivateScheduledReportHandler extends CommandHandler<any, Result<any>> {
  async handle(command: any): Promise<Result<any>> {
    return Result.success({ id: command.scheduledReportId, active: true });
  }
}
