import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { CreateWorkflowCommand } from '../commands/create-workflow-command';
import type { CreateWorkflowHandler } from '../handlers/create-workflow-handler';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Create Workflow Use Case
 * Orchestrates the creation of a new workflow
 */
@injectable()
export class CreateWorkflowUseCase implements IUseCase<CreateWorkflowCommand, WorkflowDto> {
  constructor(
    @inject('CreateWorkflowHandler') private handler: CreateWorkflowHandler
  ) {}

  async execute(command: CreateWorkflowCommand): Promise<Result<WorkflowDto>> {
    return this.handler.handle(command);
  }
}
