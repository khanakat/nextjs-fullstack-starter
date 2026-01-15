import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { CreateScheduledReportCommand } from '@/slices/reporting/application/commands';

/**
 * TODO: Implement CreateScheduledReportHandler
 * Placeholder to prevent TypeScript compilation errors
 */
@injectable()
export class CreateScheduledReportHandler extends CommandHandler<CreateScheduledReportCommand, Result<any>> {
  async handle(command: CreateScheduledReportCommand): Promise<Result<any>> {
    return Result.success({ id: 'temp-id', name: command.name, reportId: command.reportId });
  }
}
