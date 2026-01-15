import { CommandHandler } from '../../base';
import { UpdateReportCommand } from '../commands/update-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';
import { ReportConfig } from '../../../domain/reporting/value-objects/report-config';

export class UpdateReportHandler extends CommandHandler<UpdateReportCommand, Report> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(command: UpdateReportCommand): Promise<Result<Report>> {
    const report = await this.reportRepository.findById(command.reportId);

    if (!report) {
      return Result.failure<Report>(new Error('Report not found'));
    }

    if (command.title) {
      report.updateTitle(command.title);
    }

    if (command.description !== undefined) {
      report.updateDescription(command.description);
    }

    if (command.config) {
      const reportConfig = ReportConfig.create(command.config);
      report.updateConfig(reportConfig);
    }

    if (command.content !== undefined) {
      report.updateContent(command.content);
    }

    if (command.isPublic !== undefined) {
      report.updateVisibility(command.isPublic);
    }

    if (command.metadata) {
      report.addMetadata(command.metadata);
    }

    await this.reportRepository.save(report);
    return Result.success<Report>(report);
  }
}
