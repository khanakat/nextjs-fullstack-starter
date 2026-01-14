import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';
import { PrismaUnitOfWork } from '../database/unit-of-work';
import type { IEventBus } from '../events/in-memory-event-bus';
import { InMemoryEventBus } from '../events/in-memory-event-bus';
import { configureUserManagementContainer } from '../../../slices/user-management/infrastructure/di/user-management-container';
import { configureNotificationsContainer } from '../../../slices/notifications/infrastructure/di/notifications-container';
import { configureReportingContainer } from '../../../slices/reporting/infrastructure/di/reporting-container';
import { configureCommentsContainer } from '../../../slices/comments/infrastructure/di/comments-container';
import { configureAnalyticsContainer } from '../../../slices/analytics/infrastructure/di/analytics-container';
import { configureIntegrationsContainer } from '../../../slices/integrations/infrastructure/di/integrations-container';
import { configureFilesContainer } from '../../../slices/files/infrastructure/di/files-container';
import { configureSettingsContainer } from '../../../slices/settings/infrastructure/di/settings-container';
import { configureAuditContainer } from '../../../slices/audit/infrastructure/di/audit-container';
import { configureWorkflowsContainer } from '../../../slices/workflows/infrastructure/di/workflows-container';
import { configureOrganizationsContainer } from '../../../slices/organizations/infrastructure/di/organizations-container';
import { configureEmailContainer } from '../../../slices/email/infrastructure/di/email-container';
import { configureMobileContainer } from '../../../slices/mobile/infrastructure/di/mobile-container';
import { configureUIContainer } from '../../../slices/ui/infrastructure/di/ui-container';
import { configureSecurityContainer } from '../../../slices/security/infrastructure/di/security-container';

/**
 * IoC Container configuration
 * Registers all dependencies for dependency injection
 */
export class DIContainer {
  private static instance: Container;

  static getInstance(): Container {
    if (!DIContainer.instance) {
      DIContainer.instance = new Container();
      DIContainer.configureContainer();
    }
    return DIContainer.instance;
  }

  private static configureContainer(): void {
    const container = DIContainer.instance;

    // Event Bus - bind first to avoid circular dependency
    container.bind<IEventBus>(TYPES.EventBus).to(InMemoryEventBus).inSingletonScope();

    // Database
    const prismaClient = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prismaClient);
    container.bind<PrismaUnitOfWork>(TYPES.UnitOfWork).to(PrismaUnitOfWork).inSingletonScope();

    // Configure vertical slices
    configureUserManagementContainer(container);
    configureNotificationsContainer(container);
    configureReportingContainer(container);
    configureCommentsContainer(container);
    configureAnalyticsContainer(container);
    configureIntegrationsContainer(container);
    configureFilesContainer(container);
    configureSettingsContainer(container);
    configureAuditContainer(container);
    configureWorkflowsContainer(container);
    configureOrganizationsContainer(container);
    configureEmailContainer(container);
    configureMobileContainer(container);
    configureUIContainer(container);
    configureSecurityContainer(container);

    // Note: Additional vertical slices will be registered here as they are implemented
  }

  /**
   * Register dependencies for a specific vertical slice
   */
  static registerSlice(registrationFn: (container: Container) => void): void {
    const container = DIContainer.getInstance();
    registrationFn(container);
  }

  /**
   * Get service from container
   */
  static get<T>(serviceIdentifier: symbol): T {
    const container = DIContainer.getInstance();
    return container.get<T>(serviceIdentifier);
  }

  /**
   * Check if service is bound
   */
  static isBound(serviceIdentifier: symbol): boolean {
    const container = DIContainer.getInstance();
    return container.isBound(serviceIdentifier);
  }
}

// Export the container instance for direct use
export const container = DIContainer.getInstance();