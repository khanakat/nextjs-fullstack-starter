import { Container } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';

// Domain
import { IUserRepository } from '../../domain/repositories/user-repository';

// Application
import { CreateUserHandler } from '../../application/handlers/create-user-handler';
import { UpdateUserHandler } from '../../application/handlers/update-user-handler';
import { GetUserHandler } from '../../application/handlers/get-user-handler';
import { GetUsersHandler } from '../../application/handlers/get-users-handler';

// Infrastructure
import { PrismaUserRepository } from '../repositories/prisma-user-repository';

// Presentation
import { UsersController } from '../../presentation/api/users-controller';

/**
 * User Management Dependency Injection Container
 * Configures all dependencies for the user management vertical slice
 */
export function configureUserManagementContainer(container: Container): void {
  // Repositories
  container.bind<IUserRepository>(TYPES.UserRepository).to(PrismaUserRepository);

  // Command Handlers
  container.bind<CreateUserHandler>(TYPES.CreateUserHandler).to(CreateUserHandler);
  container.bind<UpdateUserHandler>(TYPES.UpdateUserHandler).to(UpdateUserHandler);

  // Query Handlers
  container.bind<GetUserHandler>(TYPES.GetUserHandler).to(GetUserHandler);
  container.bind<GetUsersHandler>(TYPES.GetUsersHandler).to(GetUsersHandler);

  // Controllers
  container.bind<UsersController>(TYPES.UsersController).to(UsersController);
}