import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Workflow } from '../../domain/entities/workflow';
import { WorkflowId } from '../../domain/value-objects/workflow-id';
import { DeleteWorkflowCommand } from '../commands/delete-workflow-command';
import type { IWorkflowRepository } from '../../domain/repositories/workflow-repository';

/**
 * Delete Workflow Handler
 * Handles deletion of workflows
 */
@injectable()
export class DeleteWorkflowHandler extends CommandHandler<DeleteWorkflowCommand, void> {
  constructor(
    @inject('WorkflowRepository') private workflowRepository: IWorkflowRepository
  ) {
    super();
  }

  async handle(command: DeleteWorkflowCommand): Promise<Result<void>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<void>(new Error(validationResult.errors.join(', ')));
    }

    // Find workflow by ID
    const workflowId = WorkflowId.fromValue(command.props.workflowId);
    const workflow = await this.workflowRepository.findById(workflowId);

    if (!workflow) {
      return Result.failure<void>(new Error('Workflow not found'));
    }

    // Delete workflow
    await this.workflowRepository.delete(workflowId);

    // Return success
    return Result.success<void>(undefined);
  }

  private validate(command: DeleteWorkflowCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.workflowId || command.props.workflowId.trim() === '') {
      errors.push('Workflow ID is required');
    }

    if (!command.props.deletedBy || command.props.deletedBy.trim() === '') {
      errors.push('Deleter ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
