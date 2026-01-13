import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Workflow, WorkflowStatus } from '../../domain/entities/workflow';
import { WorkflowId } from '../../domain/value-objects/workflow-id';
import { CreateWorkflowCommand } from '../commands/create-workflow-command';
import type { IWorkflowRepository } from '../../domain/repositories/workflow-repository';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Create Workflow Handler
 * Handles the creation of new workflows
 */
@injectable()
export class CreateWorkflowHandler extends CommandHandler<CreateWorkflowCommand, WorkflowDto> {
  constructor(
    @inject('WorkflowRepository') private workflowRepository: IWorkflowRepository
  ) {
    super();
  }

  async handle(command: CreateWorkflowCommand): Promise<Result<WorkflowDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create workflow entity
    const workflow = Workflow.create({
      name: command.props.name,
      description: command.props.description,
      organizationId: command.props.organizationId,
      definition: command.props.definition,
      settings: command.props.settings,
      variables: command.props.variables,
      version: '1.0',
      status: command.props.status || WorkflowStatus.DRAFT,
      isTemplate: command.props.isTemplate ?? false,
      isPublic: command.props.isPublic ?? false,
    });

    // Save workflow
    await this.workflowRepository.save(workflow);

    // Return DTO
    return Result.success(this.toDto(workflow, command.props.createdBy));
  }

  private validate(command: CreateWorkflowCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.name || command.props.name.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (!command.props.organizationId || command.props.organizationId.trim() === '') {
      errors.push('Organization ID is required');
    }

    if (!command.props.definition || command.props.definition.trim() === '') {
      errors.push('Workflow definition is required');
    }

    if (!command.props.createdBy || command.props.createdBy.trim() === '') {
      errors.push('Creator ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(workflow: Workflow, createdBy: string): WorkflowDto {
    const persistence = workflow.toPersistence();
    return new WorkflowDto({
      id: persistence.id as string,
      name: workflow.name,
      description: workflow.description ?? '',
      organizationId: workflow.organizationId ?? '',
      definition: workflow.definition,
      settings: workflow.settings,
      variables: workflow.variables,
      status: workflow.status,
      version: workflow.version,
      isTemplate: workflow.isTemplate,
      isPublic: workflow.isPublic,
      publishedAt: null,
      executionCount: 0,
      successRate: 0,
      avgDuration: 0,
      lastExecutedAt: null,
      createdBy: createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
