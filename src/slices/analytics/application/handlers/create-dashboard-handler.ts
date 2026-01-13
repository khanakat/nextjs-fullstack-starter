import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Dashboard, DashboardStatus } from '../../domain/entities/dashboard';
import { DashboardId } from '../../domain/value-objects/dashboard-id';
import { CreateDashboardCommand } from '../commands/create-dashboard-command';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Create Dashboard Handler
 * Handles the creation of new analytics dashboards
 */
@injectable()
export class CreateDashboardHandler extends CommandHandler<CreateDashboardCommand, DashboardDto> {
  constructor(
    @inject('DashboardRepository') private dashboardRepository: IDashboardRepository
  ) {
    super();
  }

  async handle(command: CreateDashboardCommand): Promise<Result<DashboardDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<DashboardDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create dashboard entity
    const dashboard = Dashboard.create({
      name: command.props.name,
      description: command.props.description,
      layout: command.props.layout,
      settings: command.props.settings,
      isPublic: command.props.isPublic,
      isTemplate: command.props.isTemplate,
      tags: command.props.tags,
      organizationId: command.props.organizationId,
      createdBy: command.props.createdBy,
      status: command.props.status || DashboardStatus.ACTIVE,
    });

    // Save dashboard
    await this.dashboardRepository.save(dashboard);

    // Return DTO
    return Result.success(this.toDto(dashboard));
  }

  private validate(command: CreateDashboardCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.name || command.props.name.trim() === '') {
      errors.push('Dashboard name is required');
    }

    if (!command.props.layout || command.props.layout.trim() === '') {
      errors.push('Dashboard layout is required');
    }

    if (!command.props.organizationId || command.props.organizationId.trim() === '') {
      errors.push('Organization ID is required');
    }

    if (!command.props.createdBy || command.props.createdBy.trim() === '') {
      errors.push('Creator ID is required');
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
