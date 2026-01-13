import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { UpdateWorkflowCommand } from '../commands/update-workflow-command';
import type { UpdateWorkflowHandler } from '../handlers/update-workflow-handler';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Update Workflow Use Case
 * Orchestrates the update of a workflow
 */
@injectable()
export class UpdateWorkflowUseCase implements IUseCase<UpdateWorkflowCommand, WorkflowDto> {
  constructor(
    @inject('UpdateWorkflowHandler') private handler: UpdateWorkflowHandler
  ) {}

  async execute(command: UpdateWorkflowCommand): Promise<Result<WorkflowDto>> {
    return this.handler.handle(command);
  }
}
