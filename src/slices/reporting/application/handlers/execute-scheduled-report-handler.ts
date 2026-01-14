import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Handler for executing a scheduled report immediately
 */
export class ExecuteScheduledReportHandler extends CommandHandler<{ scheduledReportId: string; userId: string }, any> {
  constructor(
    private readonly scheduledReportRepository: IScheduledReportRepository
  ) {
    super();
  }

  async handle(command: { scheduledReportId: string; userId: string }): Promise<Result<any>> {
    try {
      const { scheduledReportId, userId } = command;
      const id = UniqueId.create(scheduledReportId);
      const scheduledReport = await this.scheduledReportRepository.findById(id);

      if (!scheduledReport) {
        return Result.failure(new Error('Scheduled report not found'));
      }

      // For now, return a success response indicating execution started
      // In a real implementation, this would trigger the actual report generation
      return Result.success({
        scheduledReportId,
        status: 'executing',
        startedAt: new Date(),
        message: 'Scheduled report execution started'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(message));
    }
  }
}
