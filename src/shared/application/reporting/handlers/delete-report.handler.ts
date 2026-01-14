import { CommandHandler } from '../../command-handler.base';
import { DeleteReportCommand } from '../commands/delete-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Result } from '../../base/result';

export class DeleteReportHandler implements CommandHandler<DeleteReportCommand> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(command: DeleteReportCommand): Promise<Result<void>> {
    const reportResult = await this.reportRepository.findById(command.reportId);

    if (reportResult.isFailure || !reportResult.value) {
      return Result.failure<void>(reportResult.error || 'Report not found');
    }

    return this.reportRepository.delete(command.reportId);
  }
}
