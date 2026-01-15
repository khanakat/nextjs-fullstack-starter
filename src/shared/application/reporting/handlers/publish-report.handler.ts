import { CommandHandler } from '../../base';
import { PublishReportCommand } from '../commands/publish-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class PublishReportHandler extends CommandHandler<PublishReportCommand, Report> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(command: PublishReportCommand): Promise<Result<Report>> {
    const report = await this.reportRepository.findById(command.reportId);

    if (!report) {
      return Result.failure<Report>(new Error('Report not found'));
    }

    report.publish();
    await this.reportRepository.save(report);
    return Result.success<Report>(report);
  }
}
