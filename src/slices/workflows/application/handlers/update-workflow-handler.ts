import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Workflow } from '../../domain/entities/workflow';
import { WorkflowId } from '../../domain/value-objects/workflow-id';
import { UpdateWorkflowCommand } from '../commands/update-workflow-command';
import type { IWorkflowRepository } from '../../domain/repositories/workflow-repository';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Update Workflow Handler
 * Handles updating workflow details
 */
@injectable()
export class UpdateWorkflowHandler extends CommandHandler<UpdateWorkflowCommand, WorkflowDto> {
  constructor(
    @inject('WorkflowRepository') private workflowRepository: IWorkflowRepository
  ) {
    super();
  }

  async handle(command: UpdateWorkflowCommand): Promise<Result<WorkflowDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowDto>(new Error(validationResult.errors.join(', ')));
    }

    // Find workflow by ID
    const workflowId = WorkflowId.fromValue(command.props.workflowId);
    const workflow = await this.workflowRepository.findById(workflowId);

    if (!workflow) {
      return Result.failure<WorkflowDto>(new Error('Workflow not found'));
    }

    // Update workflow details
    const updates: any = {};
    if (command.props.name !== undefined) {
      updates.name = command.props.name;
    }
    if (command.props.description !== undefined) {
      updates.description = command.props.description;
    }
    if (command.props.definition !== undefined) {
      updates.definition = command.props.definition;
    }
    if (command.props.settings !== undefined) {
      updates.settings = command.props.settings;
    }
    if (command.props.variables !== undefined) {
      updates.variables = command.props.variables;
    }
    if (command.props.status !== undefined) {
      updates.status = command.props.status;
    }
    if (command.props.isTemplate !== undefined) {
      updates.isTemplate = command.props.isTemplate;
    }
    if (command.props.isPublic !== undefined) {
      updates.isPublic = command.props.isPublic;
    }

    workflow.updateDetails(updates);

    // Save workflow
    await this.workflowRepository.update(workflow);

    // Return DTO
    return Result.success(this.toDto(workflow, command.props.updatedBy));
  }

  private validate(command: UpdateWorkflowCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.workflowId || command.props.workflowId.trim() === '') {
      errors.push('Workflow ID is required');
    }

    if (!command.props.updatedBy || command.props.updatedBy.trim() === '') {
      errors.push('Updater ID is required');
    }

    // Check if at least one field is being updated
    const hasUpdate =
      command.props.name !== undefined ||
      command.props.description !== undefined ||
      command.props.definition !== undefined ||
      command.props.settings !== undefined ||
      command.props.variables !== undefined ||
      command.props.status !== undefined ||
      command.props.isTemplate !== undefined ||
      command.props.isPublic !== undefined;

    if (!hasUpdate) {
      errors.push('At least one field must be provided for update');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(workflow: Workflow, updatedBy: string): WorkflowDto {
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
      createdBy: updatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
