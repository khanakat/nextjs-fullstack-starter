/**
 * Mobile Slice DI Container Bindings
 */

import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';

// Handlers
import {
  RegisterDeviceHandler,
  UpdateDeviceHandler,
  DeleteDeviceHandler,
  GetDeviceHandler,
  GetDevicesHandler,
  SubscribePushHandler,
  UnsubscribePushHandler,
  SendPushNotificationHandler,
  QueueOfflineActionHandler,
  GetOfflineActionsHandler,
  UpdateOfflineActionHandler,
  DeleteOfflineActionHandler,
  UpdateNotificationPreferencesHandler,
  GetNotificationPreferencesHandler,
  SyncDataHandler,
  GetServerUpdatesHandler,
  GetVapidKeyHandler,
} from '../../application/handlers/mobile.handlers';

// Controller
import { MobileApiController } from '../../presentation/api/mobile-api.controller';

export const mobileBindings = new ContainerModule((bind: interfaces.Bind) => {
  // Handlers
  bind<RegisterDeviceHandler>(TYPES.RegisterDeviceHandler)
    .to(RegisterDeviceHandler)
    .inSingletonScope();

  bind<UpdateDeviceHandler>(TYPES.UpdateDeviceHandler)
    .to(UpdateDeviceHandler)
    .inSingletonScope();

  bind<DeleteDeviceHandler>(TYPES.DeleteDeviceHandler)
    .to(DeleteDeviceHandler)
    .inSingletonScope();

  bind<GetDeviceHandler>(TYPES.GetDeviceHandler)
    .to(GetDeviceHandler)
    .inSingletonScope();

  bind<GetDevicesHandler>(TYPES.GetDevicesHandler)
    .to(GetDevicesHandler)
    .inSingletonScope();

  bind<SubscribePushHandler>(TYPES.SubscribePushHandler)
    .to(SubscribePushHandler)
    .inSingletonScope();

  bind<UnsubscribePushHandler>(TYPES.UnsubscribePushHandler)
    .to(UnsubscribePushHandler)
    .inSingletonScope();

  bind<SendPushNotificationHandler>(TYPES.SendPushNotificationHandler)
    .to(SendPushNotificationHandler)
    .inSingletonScope();

  bind<QueueOfflineActionHandler>(TYPES.QueueOfflineActionHandler)
    .to(QueueOfflineActionHandler)
    .inSingletonScope();

  bind<GetOfflineActionsHandler>(TYPES.GetOfflineActionsHandler)
    .to(GetOfflineActionsHandler)
    .inSingletonScope();

  bind<UpdateOfflineActionHandler>(TYPES.UpdateOfflineActionHandler)
    .to(UpdateOfflineActionHandler)
    .inSingletonScope();

  bind<DeleteOfflineActionHandler>(TYPES.DeleteOfflineActionHandler)
    .to(DeleteOfflineActionHandler)
    .inSingletonScope();

  bind<UpdateNotificationPreferencesHandler>(TYPES.UpdateNotificationPreferencesHandler)
    .to(UpdateNotificationPreferencesHandler)
    .inSingletonScope();

  bind<GetNotificationPreferencesHandler>(TYPES.GetNotificationPreferencesHandler)
    .to(GetNotificationPreferencesHandler)
    .inSingletonScope();

  bind<SyncDataHandler>(TYPES.SyncDataHandler)
    .to(SyncDataHandler)
    .inSingletonScope();

  bind<GetServerUpdatesHandler>(TYPES.GetServerUpdatesHandler)
    .to(GetServerUpdatesHandler)
    .inSingletonScope();

  bind<GetVapidKeyHandler>(TYPES.GetVapidKeyHandler)
    .to(GetVapidKeyHandler)
    .inSingletonScope();

  // Controller
  bind<MobileApiController>(TYPES.MobileApiController)
    .to(MobileApiController)
    .inSingletonScope();
});
