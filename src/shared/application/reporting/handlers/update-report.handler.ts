import { CommandHandler } from '../../command-handler.base';
import { UpdateReportCommand } from '../commands/update-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class UpdateReportHandler implements CommandHandler<UpdateReportCommand> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(command: UpdateReportCommand): Promise<Result<Report>> {
    const reportResult = await this.reportRepository.findById(command.reportId);

    if (reportResult.isFailure || !reportResult.value) {
      return Result.failure<Report>(reportResult.error || 'Report not found');
    }

    const report = reportResult.value;

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

    return this.reportRepository.save(report);
  }
}
