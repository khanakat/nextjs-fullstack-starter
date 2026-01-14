import { CommandHandler } from '../../command-handler.base';
import { ArchiveReportCommand } from '../commands/archive-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class ArchiveReportHandler implements CommandHandler<ArchiveReportCommand> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(command: ArchiveReportCommand): Promise<Result<Report>> {
    const reportResult = await this.reportRepository.findById(command.reportId);

    if (reportResult.isFailure || !reportResult.value) {
      return Result.failure<Report>(reportResult.error || 'Report not found');
    }

    const report = reportResult.value;
    report.archive();

    return this.reportRepository.save(report);
  }
}
