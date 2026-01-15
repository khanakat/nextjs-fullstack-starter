import { CommandHandler } from '../../base';
import { ArchiveReportCommand } from '../commands/archive-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class ArchiveReportHandler extends CommandHandler<ArchiveReportCommand, Report> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(command: ArchiveReportCommand): Promise<Result<Report>> {
    const report = await this.reportRepository.findById(command.reportId);

    if (!report) {
      return Result.failure<Report>(new Error('Report not found'));
    }

    report.archive();
    await this.reportRepository.save(report);
    return Result.success<Report>(report);
  }
}
