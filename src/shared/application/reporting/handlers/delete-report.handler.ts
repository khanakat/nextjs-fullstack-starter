import { CommandHandler } from '../../base';
import { DeleteReportCommand } from '../commands/delete-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Result } from '../../base/result';

export class DeleteReportHandler extends CommandHandler<DeleteReportCommand, void> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(command: DeleteReportCommand): Promise<Result<void>> {
    const report = await this.reportRepository.findById(command.reportId);

    if (!report) {
      return Result.failure<void>(new Error('Report not found'));
    }

    await this.reportRepository.delete(command.reportId);
    return Result.success<void>(undefined);
  }
}
