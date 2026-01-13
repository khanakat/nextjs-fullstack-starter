import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetWorkflowsQuery } from '../queries/get-workflows-query';
import type { GetWorkflowsHandler } from '../handlers/get-workflows-handler';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Get Workflows Use Case
 * Orchestrates the retrieval of multiple workflows
 */
@injectable()
export class GetWorkflowsUseCase implements IUseCase<GetWorkflowsQuery, WorkflowDto[]> {
  constructor(
    @inject('GetWorkflowsHandler') private handler: GetWorkflowsHandler
  ) {}

  async execute(query: GetWorkflowsQuery): Promise<Result<WorkflowDto[]>> {
    return this.handler.handle(query);
  }
}
