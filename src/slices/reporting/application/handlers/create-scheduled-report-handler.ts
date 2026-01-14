import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { CreateScheduledReportCommand } from '../../commands/create-scheduled-report-command';

/**
 * TODO: Implement CreateScheduledReportHandler
 * Placeholder to prevent TypeScript compilation errors
 */
@injectable()
export class CreateScheduledReportHandler extends CommandHandler<CreateScheduledReportCommand, Result<any>> {
  async handle(command: CreateScheduledReportCommand): Promise<Result<any>> {
    return Result.success({ id: 'temp-id', ...command.props });
  }
}
