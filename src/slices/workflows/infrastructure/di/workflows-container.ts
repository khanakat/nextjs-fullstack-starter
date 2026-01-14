import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';
import { WorkflowRepository } from '../../domain/repositories/workflow-repository';
import { PrismaWorkflowRepository } from '../repositories/prisma-workflow-repository';
import { CreateWorkflowHandler } from '../../application/handlers/create-workflow-handler';
import { UpdateWorkflowHandler } from '../../application/handlers/update-workflow-handler';
import { DeleteWorkflowHandler } from '../../application/handlers/delete-workflow-handler';
import { GetWorkflowHandler } from '../../application/handlers/get-workflow-handler';
import { GetWorkflowsHandler } from '../../application/handlers/get-workflows-handler';
import { WorkflowsApiController } from '../../presentation/api/workflows-api.controller';

export const WorkflowsContainer = new ContainerModule((bind: interfaces.Bind) => {
  // Repository
  bind<WorkflowRepository>(TYPES.WorkflowRepository)
    .to(PrismaWorkflowRepository)
    .inSingletonScope();

  // Command Handlers
  bind<CreateWorkflowHandler>(TYPES.CreateWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<WorkflowRepository>(TYPES.WorkflowRepository);
      return new CreateWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<UpdateWorkflowHandler>(TYPES.UpdateWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<WorkflowRepository>(TYPES.WorkflowRepository);
      return new UpdateWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<DeleteWorkflowHandler>(TYPES.DeleteWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<WorkflowRepository>(TYPES.WorkflowRepository);
      return new DeleteWorkflowHandler(repository);
    })
    .inTransientScope();

  // Query Handlers
  bind<GetWorkflowHandler>(TYPES.GetWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<WorkflowRepository>(TYPES.WorkflowRepository);
      return new GetWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<GetWorkflowsHandler>(TYPES.GetWorkflowsHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<WorkflowRepository>(TYPES.WorkflowRepository);
      return new GetWorkflowsHandler(repository);
    })
    .inTransientScope();

  // Controller
  bind<WorkflowsApiController>(TYPES.WorkflowsApiController)
    .to(WorkflowsApiController)
    .inSingletonScope();
});

/**
 * Configure workflows container for use with main DI container
 */
export function configureWorkflowsContainer(container: any) {
  container.load(WorkflowsContainer);
}
