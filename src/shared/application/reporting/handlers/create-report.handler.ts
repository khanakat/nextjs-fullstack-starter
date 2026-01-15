import { CommandHandler } from '../../base/command-handler';
import { CreateReportCommand } from '../commands/create-report.command';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { ReportConfig } from '../../../domain/reporting/value-objects/report-config';
import { Result } from '../../base/result';

export class CreateReportHandler extends CommandHandler<CreateReportCommand, Report> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

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

    await this.reportRepository.save(report);
    return Result.success(report);
  }
}
