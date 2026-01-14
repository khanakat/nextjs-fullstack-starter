import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';
import { PrismaOrganizationRepository } from '../repositories/prisma-organization-repository';
import { CreateOrganizationHandler } from '../../application/handlers/create-organization-handler';
import { GetOrganizationsHandler } from '../../application/handlers/get-organizations-handler';
import { OrganizationsApiController } from '../../presentation/api/organizations-api.controller';

/**
 * Configure Organizations slice dependencies in DI container
 */
export function configureOrganizationsContainer(container: Container): void {
  // Repositories
  container
    .bind(TYPES.OrganizationRepository)
    .to(PrismaOrganizationRepository)
    .inSingletonScope();

  // Handlers
  container
    .bind(TYPES.CreateOrganizationHandler)
    .to(CreateOrganizationHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetOrganizationsHandler)
    .to(GetOrganizationsHandler)
    .inTransientScope();

  // Presentation Controllers
  container
    .bind(TYPES.OrganizationsController)
    .to(OrganizationsApiController)
    .inSingletonScope();
}
