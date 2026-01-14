import { CommandHandler } from '../../command-handler.base';
import { CreateReportCommand } from '../commands/create-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { ReportConfig } from '../../../domain/reporting/value-objects/report-config';
import { Result } from '../../base/result';

export class CreateReportHandler implements CommandHandler<CreateReportCommand> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(command: CreateReportCommand): Promise<Result<Report>> {
    const reportConfig = ReportConfig.create(command.config);

    const report = Report.create({
      title: command.title,
      description: command.description,
      config: reportConfig,
      isPublic: command.isPublic,
      templateId: command.templateId,
      createdBy: command.createdBy,
      organizationId: command.organizationId,
      metadata: command.metadata,
    });

    if (report.isFailure) {
      return Result.failure<Report>(report.error);
    }

    return this.reportRepository.save(report.value);
  }
}
