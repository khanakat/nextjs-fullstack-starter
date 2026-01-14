/**
 * Mobile Handlers
 * All command and query handlers for mobile functionality
 */

import { injectable, inject } from 'inversify';
import { Result } from '@/shared/domain/result';
import { db as prisma } from '@/lib/db';

// Commands
import { RegisterDeviceCommand } from '../commands/register-device-command';
import { UpdateDeviceCommand } from '../commands/update-device-command';
import { DeleteDeviceCommand } from '../commands/delete-device-command';
import { SubscribePushCommand } from '../commands/subscribe-push-command';
import { UnsubscribePushCommand } from '../commands/unsubscribe-push-command';
import { SendPushNotificationCommand } from '../commands/send-push-notification-command';
import { QueueOfflineActionCommand } from '../commands/queue-offline-action-command';
import { UpdateOfflineActionCommand } from '../commands/update-offline-action-command';
import { DeleteOfflineActionCommand } from '../commands/delete-offline-action-command';
import { UpdateNotificationPreferencesCommand } from '../commands/update-notification-preferences-command';
import { SyncDataCommand } from '../commands/sync-data-command';

// Queries
import { GetDeviceQuery } from '../queries/get-device-query';
import { GetDevicesQuery } from '../queries/get-devices-query';
import { GetOfflineActionsQuery } from '../queries/get-offline-actions-query';
import { GetNotificationPreferencesQuery } from '../queries/get-notification-preferences-query';
import { GetServerUpdatesQuery } from '../queries/get-server-updates-query';
import { GetVapidKeyQuery } from '../queries/get-vapid-key-query';

// Entities
import { Device, DeviceType } from '../../domain/entities/device.entity';
import { PushSubscription } from '../../domain/entities/push-subscription.entity';
import { OfflineAction, OfflineActionPriority } from '../../domain/entities/offline-action.entity';
import { NotificationPreference, DeliveryMethod, NotificationFrequency } from '../../domain/entities/notification-preference.entity';

/**
 * Register Device Handler
 */
@injectable()
export class RegisterDeviceHandler {
  async handle(command: RegisterDeviceCommand): Promise<Result<any>> {
    try {
      const { userId, deviceId, deviceType, platform, browserName, browserVersion, screenWidth, screenHeight, userAgent, capabilities, timezone, language } = command.data;

      // Get user's internal ID
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      // Check if device already exists
      const existingDevice = await prisma.deviceInfo.findFirst({
        where: {
          userId: user.id,
          deviceId: deviceId,
        },
      });

      let device;

      if (existingDevice) {
        // Update existing device
        device = await prisma.deviceInfo.update({
          where: { id: existingDevice.id },
          data: {
            deviceType,
            platform,
            browserName,
            browserVersion,
            screenWidth,
            screenHeight,
            userAgent,
            capabilities: JSON.stringify(capabilities),
            timezone,
            language,
            lastSeen: new Date(),
            isActive: true,
          },
        });
      } else {
        // Create new device
        device = await prisma.deviceInfo.create({
          data: {
            userId: user.id,
            deviceId,
            deviceType,
            platform,
            browserName,
            browserVersion,
            screenWidth,
            screenHeight,
            userAgent,
            capabilities: JSON.stringify(capabilities),
            timezone,
            language,
            lastSeen: new Date(),
            isActive: true,
          },
        });
      }

      return Result.ok({
        device: {
          id: device.id,
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          platform: device.platform,
          browserName: device.browserName,
          browserVersion: device.browserVersion,
          capabilities: JSON.parse(device.capabilities || '{}'),
          isActive: device.isActive,
          lastSeen: device.lastSeen,
        },
        message: existingDevice ? 'Device updated successfully' : 'Device registered successfully',
      });
    } catch (error) {
      console.error('Error in RegisterDeviceHandler:', error);
      return Result.fail('Failed to register device');
    }
  }
}

/**
 * Update Device Handler
 */
@injectable()
export class UpdateDeviceHandler {
  async handle(command: UpdateDeviceCommand): Promise<Result<any>> {
    try {
      const { userId, deviceId, lastSeen, capabilities, isActive } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const device = await prisma.deviceInfo.findFirst({
        where: {
          userId: user.id,
          deviceId: deviceId,
        },
      });

      if (!device) {
        return Result.fail('Device not found');
      }

      const updatedDevice = await prisma.deviceInfo.update({
        where: { id: device.id },
        data: {
          ...(capabilities && { capabilities: JSON.stringify(capabilities) }),
          ...(isActive !== undefined && { isActive }),
          lastSeen: lastSeen ? new Date(lastSeen) : new Date(),
        },
        select: {
          id: true,
          deviceId: true,
          deviceType: true,
          platform: true,
          browserName: true,
          browserVersion: true,
          capabilities: true,
          isActive: true,
          lastSeen: true,
          updatedAt: true,
        },
      });

      return Result.ok({
        device: {
          ...updatedDevice,
          capabilities: JSON.parse(updatedDevice.capabilities || '{}'),
        },
        message: 'Device updated successfully',
      });
    } catch (error) {
      console.error('Error in UpdateDeviceHandler:', error);
      return Result.fail('Failed to update device');
    }
  }
}

/**
 * Delete Device Handler
 */
@injectable()
export class DeleteDeviceHandler {
  async handle(command: DeleteDeviceCommand): Promise<Result<any>> {
    try {
      const { userId, deviceId } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const device = await prisma.deviceInfo.findFirst({
        where: {
          userId: user.id,
          deviceId: deviceId,
        },
      });

      if (!device) {
        return Result.fail('Device not found');
      }

      await prisma.deviceInfo.delete({
        where: { id: device.id },
      });

      return Result.ok({
        message: 'Device deleted successfully',
        deviceId: device.deviceId,
      });
    } catch (error) {
      console.error('Error in DeleteDeviceHandler:', error);
      return Result.fail('Failed to delete device');
    }
  }
}

/**
 * Get Device Handler
 */
@injectable()
export class GetDeviceHandler {
  async handle(query: GetDeviceQuery): Promise<Result<any>> {
    try {
      const { userId, deviceId } = query.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const device = await prisma.deviceInfo.findFirst({
        where: {
          userId: user.id,
          deviceId: deviceId,
        },
        select: {
          id: true,
          deviceId: true,
          deviceType: true,
          platform: true,
          browserName: true,
          browserVersion: true,
          screenWidth: true,
          screenHeight: true,
          capabilities: true,
          timezone: true,
          language: true,
          isActive: true,
          lastSeen: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!device) {
        return Result.fail('Device not found');
      }

      return Result.ok({ device });
    } catch (error) {
      console.error('Error in GetDeviceHandler:', error);
      return Result.fail('Failed to retrieve device');
    }
  }
}

/**
 * Get Devices Handler
 */
@injectable()
export class GetDevicesHandler {
  async handle(query: GetDevicesQuery): Promise<Result<any>> {
    try {
      const { userId, activeOnly } = query.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const whereClause: any = { userId: user.id };
      if (activeOnly) {
        whereClause.isActive = true;
      }

      const devices = await prisma.deviceInfo.findMany({
        where: whereClause,
        select: {
          id: true,
          deviceId: true,
          deviceType: true,
          platform: true,
          browserName: true,
          browserVersion: true,
          screenWidth: true,
          screenHeight: true,
          capabilities: true,
          timezone: true,
          language: true,
          isActive: true,
          lastSeen: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { lastSeen: 'desc' },
      });

      return Result.ok({
        devices: devices.map((device) => ({
          ...device,
          capabilities: JSON.parse(device.capabilities || '{}'),
        })),
        total: devices.length,
        activeCount: devices.filter((d) => d.isActive).length,
      });
    } catch (error) {
      console.error('Error in GetDevicesHandler:', error);
      return Result.fail('Failed to retrieve devices');
    }
  }
}

/**
 * Subscribe Push Handler
 */
@injectable()
export class SubscribePushHandler {
  async handle(command: SubscribePushCommand): Promise<Result<any>> {
    try {
      const { userId, organizationId, endpoint, keys, deviceId, deviceType, browserName, browserVersion, platform, userAgent } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const existingSubscription = await prisma.pushSubscription.findUnique({
        where: { endpoint },
      });

      let subscription;

      if (existingSubscription) {
        subscription = await prisma.pushSubscription.update({
          where: { endpoint },
          data: {
            userId: user.id,
            organizationId,
            p256dh: keys.p256dh,
            auth: keys.auth,
            deviceId,
            deviceType,
            browserName,
            browserVersion,
            platform,
            userAgent,
            isActive: true,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        });
      } else {
        subscription = await prisma.pushSubscription.create({
          data: {
            userId: user.id,
            organizationId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            deviceId,
            deviceType,
            browserName,
            browserVersion,
            platform,
            userAgent,
            isActive: true,
          },
        });
      }

      return Result.ok({
        subscription: {
          id: subscription.id,
          endpoint: subscription.endpoint,
          isActive: subscription.isActive,
          subscribedAt: subscription.subscribedAt,
        },
      });
    } catch (error) {
      console.error('Error in SubscribePushHandler:', error);
      return Result.fail('Failed to subscribe to push notifications');
    }
  }
}

/**
 * Unsubscribe Push Handler
 */
@injectable()
export class UnsubscribePushHandler {
  async handle(command: UnsubscribePushCommand): Promise<Result<any>> {
    try {
      const { userId, endpoint, subscriptionId, deviceId } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const whereClause: any = {
        userId: user.id,
        isActive: true,
      };

      if (subscriptionId) {
        whereClause.id = subscriptionId;
      } else if (endpoint) {
        whereClause.endpoint = endpoint;
      } else if (deviceId) {
        whereClause.deviceId = deviceId;
      }

      const activeSubscriptions = await prisma.pushSubscription.findMany({
        where: whereClause,
      });

      if (activeSubscriptions.length === 0) {
        return Result.fail('No active subscriptions found');
      }

      const subscriptionIds = activeSubscriptions.map((sub) => sub.id);
      const updateResult = await prisma.pushSubscription.updateMany({
        where: {
          id: { in: subscriptionIds },
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });

      return Result.ok({
        unsubscribed: updateResult.count,
        subscriptions: activeSubscriptions.map((sub) => ({
          id: sub.id,
          endpoint: sub.endpoint,
          deviceId: sub.deviceId,
        })),
      });
    } catch (error) {
      console.error('Error in UnsubscribePushHandler:', error);
      return Result.fail('Failed to unsubscribe from push notifications');
    }
  }
}

/**
 * Send Push Notification Handler
 */
@injectable()
export class SendPushNotificationHandler {
  async handle(command: SendPushNotificationCommand): Promise<Result<any>> {
    try {
      const { payload, options = {}, sentByUserId } = command.data;
      const webpush = require('web-push');

      // Get target users
      let targetUserIds: string[] = [];

      if (options.targetUsers) {
        targetUserIds = options.targetUsers;
      } else if (options.userId) {
        targetUserIds = [options.userId];
      } else {
        return Result.fail('No target users specified');
      }

      // Get push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId: {
            in: targetUserIds,
          },
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        return Result.ok({
          message: 'No active subscriptions found',
          sent: 0,
          failed: 0,
        });
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: payload.title,
          message: payload.body,
          type: 'push',
          userId: sentByUserId,
        },
      });

      let sentCount = 0;
      let failedCount = 0;

      // Send push notifications
      for (const subscription of subscriptions) {
        try {
          const pushPayload = JSON.stringify({
            ...payload,
            notificationId: notification.id,
            timestamp: Date.now(),
          });

          const pushOptions: any = {
            TTL: options.ttl || 86400,
            urgency: options.urgency || 'normal',
          };

          if (options.topic) {
            pushOptions.topic = options.topic;
          }

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            pushPayload,
            pushOptions
          );

          sentCount++;

          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsed: new Date() },
          });
        } catch (error) {
          failedCount++;

          if (error instanceof Error && (error.message.includes('410') || error.message.includes('invalid'))) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }
        }
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          read: failedCount === 0,
        },
      });

      return Result.ok({
        notificationId: notification.id,
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length,
        message: `Notification sent to ${sentCount} devices`,
      });
    } catch (error) {
      console.error('Error in SendPushNotificationHandler:', error);
      return Result.fail('Failed to send push notification');
    }
  }
}

/**
 * Queue Offline Action Handler
 */
@injectable()
export class QueueOfflineActionHandler {
  async handle(command: QueueOfflineActionCommand): Promise<Result<any>> {
    try {
      const { userId, actions, deviceId } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const queuedActions: string[] = [];

      for (const action of actions) {
        try {
          await prisma.offlineAction.upsert({
            where: {
              id: action.id,
            },
            update: {
              action: action.action,
              data: JSON.stringify(action.data),
              timestamp: new Date(action.timestamp),
              retryCount: action.retryCount,
              priority: action.priority,
              updatedAt: new Date(),
            },
            create: {
              id: action.id,
              userId: user.id,
              action: action.action,
              data: JSON.stringify(action.data),
              timestamp: new Date(action.timestamp),
              retryCount: action.retryCount,
              priority: action.priority,
              synced: false,
              deviceId,
            },
          });

          queuedActions.push(action.id);
        } catch (error) {
          console.error('Failed to queue offline action:', error);
        }
      }

      if (deviceId) {
        await prisma.deviceInfo.updateMany({
          where: {
            userId: user.id,
            deviceId,
          },
          data: {
            lastSeen: new Date(),
          },
        });
      }

      return Result.ok({
        queuedActions,
        totalQueued: queuedActions.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in QueueOfflineActionHandler:', error);
      return Result.fail('Failed to queue offline actions');
    }
  }
}

/**
 * Get Offline Actions Handler
 */
@injectable()
export class GetOfflineActionsHandler {
  async handle(query: GetOfflineActionsQuery): Promise<Result<any>> {
    try {
      const { userId, deviceId, priority, synced, limit = 50 } = query.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const where: any = {
        userId: user.id,
      };

      if (deviceId) {
        where.deviceId = deviceId;
      }

      if (priority) {
        where.priority = priority;
      }

      if (synced !== undefined) {
        where.synced = synced === true;
      }

      const actions = await prisma.offlineAction.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { timestamp: 'asc' }],
        take: Math.min(limit, 100),
        select: {
          id: true,
          action: true,
          data: true,
          timestamp: true,
          retryCount: true,
          priority: true,
          synced: true,
          syncedAt: true,
          lastError: true,
          deviceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const parsedActions = actions.map((action) => ({
        ...action,
        data: JSON.parse(action.data),
      }));

      return Result.ok({
        actions: parsedActions,
        total: parsedActions.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GetOfflineActionsHandler:', error);
      return Result.fail('Failed to retrieve offline actions');
    }
  }
}

/**
 * Update Offline Action Handler
 */
@injectable()
export class UpdateOfflineActionHandler {
  async handle(command: UpdateOfflineActionCommand): Promise<Result<any>> {
    try {
      const { userId, actionId, retryCount, priority, synced } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const existingAction = await prisma.offlineAction.findFirst({
        where: {
          id: actionId,
          userId: user.id,
        },
      });

      if (!existingAction) {
        return Result.fail('Offline action not found');
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (retryCount !== undefined) {
        updateData.retryCount = retryCount;
      }

      if (priority !== undefined) {
        updateData.priority = priority;
      }

      if (synced !== undefined) {
        updateData.synced = synced;
        if (synced) {
          updateData.syncedAt = new Date();
        }
      }

      const updatedAction = await prisma.offlineAction.update({
        where: { id: actionId },
        data: updateData,
        select: {
          id: true,
          action: true,
          data: true,
          timestamp: true,
          retryCount: true,
          priority: true,
          synced: true,
          syncedAt: true,
          lastError: true,
          deviceId: true,
          updatedAt: true,
        },
      });

      return Result.ok({
        action: {
          ...updatedAction,
          data: JSON.parse(updatedAction.data),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in UpdateOfflineActionHandler:', error);
      return Result.fail('Failed to update offline action');
    }
  }
}

/**
 * Delete Offline Action Handler
 */
@injectable()
export class DeleteOfflineActionHandler {
  async handle(command: DeleteOfflineActionCommand): Promise<Result<any>> {
    try {
      const { userId, actionId, deviceId, synced } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      let deletedCount = 0;

      if (actionId) {
        const result = await prisma.offlineAction.deleteMany({
          where: {
            id: actionId,
            userId: user.id,
          },
        });
        deletedCount = result.count;

        if (deletedCount === 0) {
          return Result.fail('Offline action not found');
        }
      } else {
        const where: any = {
          userId: user.id,
        };

        if (deviceId) {
          where.deviceId = deviceId;
        }

        if (synced !== undefined) {
          where.synced = synced === true;
        }

        const result = await prisma.offlineAction.deleteMany({
          where,
        });
        deletedCount = result.count;
      }

      return Result.ok({
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in DeleteOfflineActionHandler:', error);
      return Result.fail('Failed to delete offline actions');
    }
  }
}

/**
 * Update Notification Preferences Handler
 */
@injectable()
export class UpdateNotificationPreferencesHandler {
  async handle(command: UpdateNotificationPreferencesCommand): Promise<Result<any>> {
    try {
      const { userId, ...preferencesData } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const preferences = await prisma.notificationPreferences.upsert({
        where: { userId: user.id },
        update: preferencesData,
        create: {
          userId: user.id,
          ...preferencesData,
        },
      });

      return Result.ok({
        preferences: {
          pushEnabled: preferences.pushEnabled,
          emailEnabled: preferences.emailEnabled,
          smsEnabled: preferences.smsEnabled,
          taskAssignments: preferences.taskAssignments,
          workflowUpdates: preferences.workflowUpdates,
          systemAlerts: preferences.systemAlerts,
          reminders: preferences.reminders,
          marketing: preferences.marketing,
          quietHoursEnabled: preferences.quietHoursEnabled,
          quietHoursStart: preferences.quietHoursStart,
          quietHoursEnd: preferences.quietHoursEnd,
          quietHoursTimezone: preferences.quietHoursTimezone,
          deliveryMethod: preferences.deliveryMethod,
          frequency: preferences.frequency,
          batchNotifications: preferences.batchNotifications,
          mobileEnabled: preferences.mobileEnabled,
          desktopEnabled: preferences.desktopEnabled,
        },
      });
    } catch (error) {
      console.error('Error in UpdateNotificationPreferencesHandler:', error);
      return Result.fail('Failed to update notification preferences');
    }
  }
}

/**
 * Get Notification Preferences Handler
 */
@injectable()
export class GetNotificationPreferencesHandler {
  async handle(query: GetNotificationPreferencesQuery): Promise<Result<any>> {
    try {
      const { userId } = query.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: user.id },
      });

      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: {
            userId: user.id,
          },
        });
      }

      return Result.ok({
        preferences: {
          pushEnabled: preferences.pushEnabled,
          emailEnabled: preferences.emailEnabled,
          smsEnabled: preferences.smsEnabled,
          taskAssignments: preferences.taskAssignments,
          workflowUpdates: preferences.workflowUpdates,
          systemAlerts: preferences.systemAlerts,
          reminders: preferences.reminders,
          marketing: preferences.marketing,
          quietHoursEnabled: preferences.quietHoursEnabled,
          quietHoursStart: preferences.quietHoursStart,
          quietHoursEnd: preferences.quietHoursEnd,
          quietHoursTimezone: preferences.quietHoursTimezone,
          deliveryMethod: preferences.deliveryMethod,
          frequency: preferences.frequency,
          batchNotifications: preferences.batchNotifications,
          mobileEnabled: preferences.mobileEnabled,
          desktopEnabled: preferences.desktopEnabled,
        },
      });
    } catch (error) {
      console.error('Error in GetNotificationPreferencesHandler:', error);
      return Result.fail('Failed to retrieve notification preferences');
    }
  }
}

/**
 * Sync Data Handler
 */
@injectable()
export class SyncDataHandler {
  async handle(command: SyncDataCommand): Promise<Result<any>> {
    try {
      const { userId, actions, lastSyncTimestamp, deviceId } = command.data;

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          organizationMemberships: {
            select: { organizationId: true },
          },
        },
      });

      if (!user) {
        return Result.fail('User not found');
      }

      const organizationId = user.organizationMemberships[0]?.organizationId || null;
      const syncedActions: string[] = [];
      const failedActions: Array<{ id: string; error: string }> = [];

      for (const action of actions) {
        try {
          await this.processOfflineAction(action, user.id, organizationId);
          syncedActions.push(action.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedActions.push({
            id: action.id,
            error: errorMessage,
          });
        }
      }

      const serverUpdates: Array<Record<string, any>> = [];
      if (lastSyncTimestamp) {
        const updates = await this.getServerUpdates(user.id, organizationId, new Date(lastSyncTimestamp));
        serverUpdates.push(...updates);
      }

      if (deviceId) {
        await prisma.deviceInfo.updateMany({
          where: {
            userId: user.id,
            deviceId: deviceId,
          },
          data: {
            lastSeen: new Date(),
          },
        });
      }

      return Result.ok({
        success: true,
        syncedActions,
        failedActions,
        serverUpdates,
        nextSyncTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in SyncDataHandler:', error);
      return Result.fail('Failed to process sync request');
    }
  }

  private async processOfflineAction(action: any, userId: string, organizationId: string | null) {
    switch (action.action) {
      case 'create_workflow':
        await prisma.workflow.create({
          data: {
            name: action.data.name || 'Untitled Workflow',
            description: action.data.description,
            definition: action.data.definition || '{}',
            ...action.data,
            createdBy: userId,
            organizationId,
            createdAt: new Date(action.timestamp),
          },
        });
        break;

      case 'update_workflow':
        await prisma.workflow.update({
          where: { id: action.data.id },
          data: {
            ...action.data,
            updatedAt: new Date(action.timestamp),
          },
        });
        break;

      case 'delete_workflow':
        await prisma.workflow.delete({
          where: { id: action.data.id },
        });
        break;

      default:
        throw new Error(`Unknown action type: ${action.action}`);
    }
  }

  private async getServerUpdates(userId: string, organizationId: string | null, lastSyncTimestamp: Date): Promise<Array<Record<string, any>>> {
    const updates: Array<Record<string, any>> = [];

    const workflows = await prisma.workflow.findMany({
      where: {
        OR: [{ createdBy: userId }, { organizationId }],
        updatedAt: {
          gt: lastSyncTimestamp,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    workflows.forEach((workflow) => {
      updates.push({
        type: 'workflow_update',
        data: workflow,
        timestamp: workflow.updatedAt.toISOString(),
      });
    });

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gt: lastSyncTimestamp,
        },
      },
    });

    notifications.forEach((notification) => {
      updates.push({
        type: 'notification',
        data: notification,
        timestamp: notification.createdAt.toISOString(),
      });
    });

    return updates;
  }
}

/**
 * Get Server Updates Handler
 */
@injectable()
export class GetServerUpdatesHandler {
  async handle(query: GetServerUpdatesQuery): Promise<Result<any>> {
    try {
      const { userId, organizationId, lastSyncTimestamp } = query.data;

      const syncDataHandler = new SyncDataHandler();
      const updates = await syncDataHandler['getServerUpdates'](userId, organizationId, new Date(lastSyncTimestamp));

      return Result.ok({
        updates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GetServerUpdatesHandler:', error);
      return Result.fail('Failed to retrieve server updates');
    }
  }
}

/**
 * Get VAPID Key Handler
 */
@injectable()
export class GetVapidKeyHandler {
  async handle(_query: GetVapidKeyQuery): Promise<Result<any>> {
    try {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        return Result.fail('Push notifications are not configured');
      }

      return Result.ok({
        publicKey: vapidPublicKey,
      });
    } catch (error) {
      console.error('Error in GetVapidKeyHandler:', error);
      return Result.fail('Failed to retrieve VAPID public key');
    }
  }
}
