import { Container } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';

// Domain
import { INotificationRepository } from '../../../../shared/domain/notifications/repositories/notification-repository';
import { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories/notification-preferences-repository';
import { NotificationRoutingService } from '../../../../shared/domain/notifications/services/notification-routing-service';
import { NotificationDeliveryService } from '../../../../shared/domain/notifications/services/notification-delivery-service';

// Application
import { SendNotificationUseCase } from '../../application/use-cases/send-notification-use-case';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications-use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read-use-case';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/update-notification-preferences-use-case';

// Infrastructure
import { PrismaNotificationRepository } from '../repositories/prisma-notification-repository';
import { PrismaNotificationPreferencesRepository } from '../repositories/prisma-notification-preferences-repository';
import { SSENotificationStreamingService } from '../services/sse-notification-streaming-service';
import { EmailNotificationService } from '../services/email-notification-service';

// Presentation
import { NotificationsController } from '../../presentation/controllers/notifications-controller';
import { PreferencesController } from '../../presentation/controllers/preferences-controller';

/**
 * Notifications Dependency Injection Container
 * Configures all dependencies for the notifications vertical slice
 */
export function configureNotificationsContainer(container: Container): void {
  // Domain Repositories
  container.bind<INotificationRepository>(TYPES.NotificationRepository).to(PrismaNotificationRepository);
  container.bind<INotificationPreferencesRepository>(TYPES.NotificationPreferencesRepository).to(PrismaNotificationPreferencesRepository);

  // Domain Services
  container.bind<NotificationRoutingService>(TYPES.NotificationRoutingService).to(NotificationRoutingService);
  container.bind<NotificationDeliveryService>(TYPES.NotificationDeliveryService).to(NotificationDeliveryService);

  // Application Use Cases
  container.bind<SendNotificationUseCase>(TYPES.SendNotificationUseCase).to(SendNotificationUseCase);
  container.bind<GetNotificationsUseCase>(TYPES.GetNotificationsUseCase).to(GetNotificationsUseCase);
  container.bind<MarkNotificationReadUseCase>(TYPES.MarkNotificationReadUseCase).to(MarkNotificationReadUseCase);
  container.bind<UpdateNotificationPreferencesUseCase>(TYPES.UpdateNotificationPreferencesUseCase).to(UpdateNotificationPreferencesUseCase);

  // Infrastructure Services
  container.bind<SSENotificationStreamingService>(TYPES.SSENotificationStreamingService).to(SSENotificationStreamingService).inSingletonScope();
  container.bind<EmailNotificationService>(TYPES.EmailNotificationService).to(EmailNotificationService);

  // Presentation Controllers
  container.bind<NotificationsController>(TYPES.NotificationsController).to(NotificationsController);
  container.bind<PreferencesController>(TYPES.PreferencesController).to(PreferencesController);
}