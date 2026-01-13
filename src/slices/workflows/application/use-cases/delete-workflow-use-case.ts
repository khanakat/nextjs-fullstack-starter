import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { DeleteWorkflowCommand } from '../commands/delete-workflow-command';
import type { DeleteWorkflowHandler } from '../handlers/delete-workflow-handler';

/**
 * Delete Workflow Use Case
 * Orchestrates the deletion of a workflow
 */
@injectable()
export class DeleteWorkflowUseCase implements IUseCase<DeleteWorkflowCommand, void> {
  constructor(
    @inject('DeleteWorkflowHandler') private handler: DeleteWorkflowHandler
  ) {}

  async execute(command: DeleteWorkflowCommand): Promise<Result<void>> {
    return this.handler.handle(command);
  }
}
