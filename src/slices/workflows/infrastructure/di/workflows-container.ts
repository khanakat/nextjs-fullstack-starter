import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';
import { IWorkflowRepository } from '../../domain/repositories/workflow-repository';
import { PrismaWorkflowRepository } from '../repositories/prisma-workflow-repository';
import { CreateWorkflowHandler } from '../../application/handlers/create-workflow-handler';
import { UpdateWorkflowHandler } from '../../application/handlers/update-workflow-handler';
import { DeleteWorkflowHandler } from '../../application/handlers/delete-workflow-handler';
import { ExecuteWorkflowHandler } from '../../application/handlers/execute-workflow-handler';
import { GetWorkflowHandler } from '../../application/handlers/get-workflow-handler';
import { GetWorkflowsHandler } from '../../application/handlers/get-workflows-handler';
import { WorkflowsApiController } from '../../presentation/api/workflows-api.controller';

// Workflow Instance imports
import { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { PrismaWorkflowInstanceRepository } from '../repositories/prisma-workflow-instance-repository';
import { CreateWorkflowInstanceHandler } from '../../application/handlers/create-instance-handler';
import { UpdateWorkflowInstanceHandler } from '../../application/handlers/update-instance-handler';
import { PerformWorkflowActionHandler } from '../../application/handlers/perform-action-handler';
import { GetWorkflowInstanceHandler } from '../../application/handlers/get-instance-handler';
import { ListWorkflowInstancesHandler } from '../../application/handlers/list-instances-handler';
import { WorkflowInstancesApiController } from '../../presentation/api/workflow-instances-api.controller';

// Workflow Task imports
import { IWorkflowTaskRepository } from '../../domain/repositories/workflow-task-repository';
import { PrismaWorkflowTaskRepository } from '../repositories/prisma-workflow-task-repository';
import { UpdateWorkflowTaskHandler } from '../../application/handlers/update-task-handler';
import { CompleteWorkflowTaskHandler } from '../../application/handlers/complete-task-handler';
import { GetWorkflowTaskHandler } from '../../application/handlers/get-task-handler';
import { ListWorkflowTasksHandler } from '../../application/handlers/list-tasks-handler';
import { WorkflowTasksApiController } from '../../presentation/api/workflow-tasks-api.controller';

// Workflow Template imports
import { IWorkflowTemplateRepository } from '../../domain/repositories/workflow-template-repository';
import { PrismaWorkflowTemplateRepository } from '../repositories/prisma-workflow-template-repository';
import { CreateWorkflowTemplateHandler } from '../../application/handlers/create-template-handler';
import { GetWorkflowTemplateHandler } from '../../application/handlers/get-template-handler';
import { ListWorkflowTemplatesHandler } from '../../application/handlers/list-templates-handler';
import { WorkflowTemplatesApiController } from '../../presentation/api/workflow-templates-api.controller';

export const WorkflowsContainer = new ContainerModule((bind: interfaces.Bind) => {
  // Workflow Repository
  bind<IWorkflowRepository>(TYPES.WorkflowRepository)
    .to(PrismaWorkflowRepository)
    .inSingletonScope();

  // Workflow Instance Repository
  bind<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository)
    .to(PrismaWorkflowInstanceRepository)
    .inSingletonScope();

  // Workflow Task Repository
  bind<IWorkflowTaskRepository>(TYPES.WorkflowTaskRepository)
    .to(PrismaWorkflowTaskRepository)
    .inSingletonScope();

  // Workflow Template Repository
  bind<IWorkflowTemplateRepository>(TYPES.WorkflowTemplateRepository)
    .to(PrismaWorkflowTemplateRepository)
    .inSingletonScope();

  // Workflow Command Handlers
  bind<CreateWorkflowHandler>(TYPES.CreateWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowRepository>(TYPES.WorkflowRepository);
      return new CreateWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<UpdateWorkflowHandler>(TYPES.UpdateWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowRepository>(TYPES.WorkflowRepository);
      return new UpdateWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<DeleteWorkflowHandler>(TYPES.DeleteWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowRepository>(TYPES.WorkflowRepository);
      return new DeleteWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<ExecuteWorkflowHandler>(TYPES.ExecuteWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new ExecuteWorkflowHandler(repository);
    })
    .inTransientScope();

  // Workflow Query Handlers
  bind<GetWorkflowHandler>(TYPES.GetWorkflowHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowRepository>(TYPES.WorkflowRepository);
      return new GetWorkflowHandler(repository);
    })
    .inTransientScope();

  bind<GetWorkflowsHandler>(TYPES.GetWorkflowsHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowRepository>(TYPES.WorkflowRepository);
      return new GetWorkflowsHandler(repository);
    })
    .inTransientScope();

  // Workflow Instance Handlers
  bind<CreateWorkflowInstanceHandler>(TYPES.CreateWorkflowInstanceHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new CreateWorkflowInstanceHandler(repository);
    })
    .inTransientScope();

  bind<GetWorkflowInstanceHandler>(TYPES.GetWorkflowInstanceHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new GetWorkflowInstanceHandler(repository);
    })
    .inTransientScope();

  bind<ListWorkflowInstancesHandler>(TYPES.ListWorkflowInstancesHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new ListWorkflowInstancesHandler(repository);
    })
    .inTransientScope();

  bind<UpdateWorkflowInstanceHandler>(TYPES.UpdateWorkflowInstanceHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new UpdateWorkflowInstanceHandler(repository);
    })
    .inTransientScope();

  bind<PerformWorkflowActionHandler>(TYPES.PerformWorkflowActionHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowInstanceRepository>(TYPES.WorkflowInstanceRepository);
      return new PerformWorkflowActionHandler(repository);
    })
    .inTransientScope();

  // Workflow Task Handlers
  bind<GetWorkflowTaskHandler>(TYPES.GetWorkflowTaskHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTaskRepository>(TYPES.WorkflowTaskRepository);
      return new GetWorkflowTaskHandler(repository);
    })
    .inTransientScope();

  bind<ListWorkflowTasksHandler>(TYPES.ListWorkflowTasksHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTaskRepository>(TYPES.WorkflowTaskRepository);
      return new ListWorkflowTasksHandler(repository);
    })
    .inTransientScope();

  bind<UpdateWorkflowTaskHandler>(TYPES.UpdateWorkflowTaskHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTaskRepository>(TYPES.WorkflowTaskRepository);
      return new UpdateWorkflowTaskHandler(repository);
    })
    .inTransientScope();

  bind<CompleteWorkflowTaskHandler>(TYPES.CompleteWorkflowTaskHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTaskRepository>(TYPES.WorkflowTaskRepository);
      return new CompleteWorkflowTaskHandler(repository);
    })
    .inTransientScope();

  // Workflow Template Handlers
  bind<CreateWorkflowTemplateHandler>(TYPES.CreateWorkflowTemplateHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTemplateRepository>(TYPES.WorkflowTemplateRepository);
      return new CreateWorkflowTemplateHandler(repository);
    })
    .inTransientScope();

  bind<GetWorkflowTemplateHandler>(TYPES.GetWorkflowTemplateHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTemplateRepository>(TYPES.WorkflowTemplateRepository);
      return new GetWorkflowTemplateHandler(repository);
    })
    .inTransientScope();

  bind<ListWorkflowTemplatesHandler>(TYPES.ListWorkflowTemplatesHandler)
    .toDynamicValue((context) => {
      const repository = context.container.get<IWorkflowTemplateRepository>(TYPES.WorkflowTemplateRepository);
      return new ListWorkflowTemplatesHandler(repository);
    })
    .inTransientScope();

  // Controllers
  bind<WorkflowsApiController>(TYPES.WorkflowsApiController)
    .to(WorkflowsApiController)
    .inSingletonScope();

  bind<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController)
    .to(WorkflowInstancesApiController)
    .inSingletonScope();

  bind<WorkflowTasksApiController>(TYPES.WorkflowTasksApiController)
    .to(WorkflowTasksApiController)
    .inSingletonScope();

  bind<WorkflowTemplatesApiController>(TYPES.WorkflowTemplatesApiController)
    .to(WorkflowTemplatesApiController)
    .inSingletonScope();
});

/**
 * Configure workflows container for use with main DI container
 */
export function configureWorkflowsContainer(container: any) {
  container.load(WorkflowsContainer);
}
