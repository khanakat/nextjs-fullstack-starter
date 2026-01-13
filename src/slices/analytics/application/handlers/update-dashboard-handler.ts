import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Dashboard, DashboardStatus } from '../../domain/entities/dashboard';
import { UpdateDashboardCommand } from '../commands/update-dashboard-command';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Update Dashboard Handler
 * Handles dashboard updates with validation
 */
@injectable()
export class UpdateDashboardHandler extends CommandHandler<UpdateDashboardCommand, DashboardDto> {
  constructor(
    @inject('DashboardRepository') private dashboardRepository: IDashboardRepository
  ) {
    super();
  }

  async handle(command: UpdateDashboardCommand): Promise<Result<DashboardDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<DashboardDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get existing dashboard
    const dashboardResult = await this.dashboardRepository.findById(
      command.dashboardId
    );

    if (!dashboardResult) {
      return Result.failure(new Error('Dashboard not found'));
    }

    const dashboard = dashboardResult;

    // Update dashboard details
    dashboard.updateDetails({
      name: command.props.name,
      description: command.props.description,
      layout: command.props.layout,
      settings: command.props.settings,
      isPublic: command.props.isPublic,
      isTemplate: command.props.isTemplate,
      tags: command.props.tags,
    });

    // Update status if provided
    if (command.props.status) {
      switch (command.props.status) {
        case DashboardStatus.ACTIVE:
          dashboard.activate();
          break;
        case DashboardStatus.INACTIVE:
          dashboard.deactivate();
          break;
        case DashboardStatus.ARCHIVED:
          dashboard.archive();
          break;
      }
    }

    // Save updated dashboard
    await this.dashboardRepository.update(dashboard);

    // Convert to DTO
    const dto = this.toDto(dashboard);

    return Result.success(dto);
  }

  private validate(command: UpdateDashboardCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // At least one field should be provided for update
    const hasUpdate =
      command.props.name !== undefined ||
      command.props.description !== undefined ||
      command.props.layout !== undefined ||
      command.props.settings !== undefined ||
      command.props.isPublic !== undefined ||
      command.props.isTemplate !== undefined ||
      command.props.tags !== undefined ||
      command.props.status !== undefined;

    if (!hasUpdate) {
      errors.push('At least one field must be provided for update');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(dashboard: Dashboard): DashboardDto {
    return new DashboardDto(
      dashboard.id.value,
      new Date(),
      {
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout,
        settings: dashboard.settings,
        isPublic: dashboard.isPublic,
        isTemplate: dashboard.isTemplate,
        tags: dashboard.tags,
        organizationId: dashboard.organizationId,
        createdBy: dashboard.createdBy,
        status: dashboard.status,
        lastViewedAt: undefined,
        viewCount: 0,
      }
    );
  }
}
