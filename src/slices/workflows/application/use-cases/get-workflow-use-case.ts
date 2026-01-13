import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetWorkflowQuery } from '../queries/get-workflow-query';
import type { GetWorkflowHandler } from '../handlers/get-workflow-handler';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Get Workflow Use Case
 * Orchestrates the retrieval of a single workflow
 */
@injectable()
export class GetWorkflowUseCase implements IUseCase<GetWorkflowQuery, WorkflowDto> {
  constructor(
    @inject('GetWorkflowHandler') private handler: GetWorkflowHandler
  ) {}

  async execute(query: GetWorkflowQuery): Promise<Result<WorkflowDto>> {
    return this.handler.handle(query);
  }
}
