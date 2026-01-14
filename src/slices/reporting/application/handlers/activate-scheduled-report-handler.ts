import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { ScheduledReport, ScheduledReportStatus } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Handler for activating a scheduled report
 */
export class ActivateScheduledReportHandler extends CommandHandler<string, ScheduledReport> {
  constructor(
    private readonly scheduledReportRepository: IScheduledReportRepository
  ) {
    super();
  }

  async handle(scheduledReportId: string): Promise<Result<ScheduledReport>> {
    try {
      const id = UniqueId.create(scheduledReportId);
      const scheduledReport = await this.scheduledReportRepository.findById(id);

      if (!scheduledReport) {
        return Result.failure(new Error('Scheduled report not found'));
      }

      // Activate the scheduled report
      const activatedReport = scheduledReport.activate();
      await this.scheduledReportRepository.save(activatedReport);

      return Result.success(activatedReport);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(message));
    }
  }
}
