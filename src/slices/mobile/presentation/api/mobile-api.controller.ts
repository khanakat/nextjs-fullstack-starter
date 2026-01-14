/**
 * Mobile API Controller
 * Handles HTTP requests for mobile functionality
 */

import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { StandardErrorResponse, StandardSuccessResponse } from '@/lib/standardized-error-responses';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/utils';
import { handleZodError } from '@/lib/error-handlers';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import webpush from 'web-push';

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

// Commands
import { RegisterDeviceCommand } from '../../application/commands/register-device-command';
import { UpdateDeviceCommand } from '../../application/commands/update-device-command';
import { DeleteDeviceCommand } from '../../application/commands/delete-device-command';
import { SubscribePushCommand } from '../../application/commands/subscribe-push-command';
import { UnsubscribePushCommand } from '../../application/commands/unsubscribe-push-command';
import { SendPushNotificationCommand } from '../../application/commands/send-push-notification-command';
import { QueueOfflineActionCommand } from '../../application/commands/queue-offline-action-command';
import { UpdateOfflineActionCommand } from '../../application/commands/update-offline-action-command';
import { DeleteOfflineActionCommand } from '../../application/commands/delete-offline-action-command';
import { UpdateNotificationPreferencesCommand } from '../../application/commands/update-notification-preferences-command';
import { SyncDataCommand } from '../../application/commands/sync-data-command';

// Queries
import { GetDeviceQuery } from '../../application/queries/get-device-query';
import { GetDevicesQuery } from '../../application/queries/get-devices-query';
import { GetOfflineActionsQuery } from '../../application/queries/get-offline-actions-query';
import { GetNotificationPreferencesQuery } from '../../application/queries/get-notification-preferences-query';
import { GetServerUpdatesQuery } from '../../application/queries/get-server-updates-query';
import { GetVapidKeyQuery } from '../../application/queries/get-vapid-key-query';

// Schemas
const deviceRegistrationSchema = z.object({
  deviceId: z.string(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  platform: z.string(),
  browserName: z.string(),
  browserVersion: z.string(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  userAgent: z.string(),
  capabilities: z.object({
    pushNotifications: z.boolean(),
    serviceWorker: z.boolean(),
    indexedDB: z.boolean(),
    webShare: z.boolean(),
    geolocation: z.boolean(),
    camera: z.boolean(),
    vibration: z.boolean(),
    touchScreen: z.boolean(),
    orientation: z.boolean(),
  }),
  timezone: z.string(),
  language: z.string(),
});

const deviceUpdateSchema = z.object({
  lastSeen: z.string().datetime().optional(),
  capabilities: z
    .object({
      pushNotifications: z.boolean(),
      serviceWorker: z.boolean(),
      indexedDB: z.boolean(),
      webShare: z.boolean(),
      geolocation: z.boolean(),
      camera: z.boolean(),
      vibration: z.boolean(),
      touchScreen: z.boolean(),
      orientation: z.boolean(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceId: z.string().optional(),
  deviceType: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  platform: z.string().optional(),
  userAgent: z.string().optional(),
});

const notificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
  data: z.any().optional(),
  actions: z
    .array(
      z.object({
        action: z.string(),
        title: z.string(),
        icon: z.string().optional(),
      })
    )
    .optional(),
  requireInteraction: z.boolean().optional(),
  silent: z.boolean().optional(),
  timestamp: z.number().optional(),
  vibrate: z.array(z.number()).optional(),
});

const pushOptionsSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  targetUsers: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  schedule: z.string().datetime().optional(),
  ttl: z.number().optional(),
  urgency: z.enum(['very-low', 'low', 'normal', 'high']).optional(),
  topic: z.string().optional(),
});

const sendNotificationSchema = z.object({
  payload: notificationPayloadSchema,
  options: pushOptionsSchema.optional(),
});

const offlineActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  retryCount: z.number().default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const queueActionSchema = z.object({
  actions: z.array(offlineActionSchema),
  deviceId: z.string().optional(),
});

const updateActionSchema = z.object({
  id: z.string(),
  retryCount: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  synced: z.boolean().optional(),
});

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  taskAssignments: z.boolean().optional(),
  workflowUpdates: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
  reminders: z.boolean().optional(),
  marketing: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  quietHoursTimezone: z.string().optional(),
  deliveryMethod: z.enum(['push', 'email', 'sms', 'all']).optional(),
  frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
  batchNotifications: z.boolean().optional(),
  mobileEnabled: z.boolean().optional(),
  desktopEnabled: z.boolean().optional(),
});

const syncActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  retryCount: z.number().default(0),
});

const syncRequestSchema = z.object({
  actions: z.array(syncActionSchema),
  lastSyncTimestamp: z.string().datetime().optional(),
  deviceId: z.string().optional(),
});

@injectable()
export class MobileApiController {
  constructor(
    @inject(RegisterDeviceHandler) private registerDeviceHandler: RegisterDeviceHandler,
    @inject(UpdateDeviceHandler) private updateDeviceHandler: UpdateDeviceHandler,
    @inject(DeleteDeviceHandler) private deleteDeviceHandler: DeleteDeviceHandler,
    @inject(GetDeviceHandler) private getDeviceHandler: GetDeviceHandler,
    @inject(GetDevicesHandler) private getDevicesHandler: GetDevicesHandler,
    @inject(SubscribePushHandler) private subscribePushHandler: SubscribePushHandler,
    @inject(UnsubscribePushHandler) private unsubscribePushHandler: UnsubscribePushHandler,
    @inject(SendPushNotificationHandler) private sendPushNotificationHandler: SendPushNotificationHandler,
    @inject(QueueOfflineActionHandler) private queueOfflineActionHandler: QueueOfflineActionHandler,
    @inject(GetOfflineActionsHandler) private getOfflineActionsHandler: GetOfflineActionsHandler,
    @inject(UpdateOfflineActionHandler) private updateOfflineActionHandler: UpdateOfflineActionHandler,
    @inject(DeleteOfflineActionHandler) private deleteOfflineActionHandler: DeleteOfflineActionHandler,
    @inject(UpdateNotificationPreferencesHandler) private updateNotificationPreferencesHandler: UpdateNotificationPreferencesHandler,
    @inject(GetNotificationPreferencesHandler) private getNotificationPreferencesHandler: GetNotificationPreferencesHandler,
    @inject(SyncDataHandler) private syncDataHandler: SyncDataHandler,
    @inject(GetServerUpdatesHandler) private getServerUpdatesHandler: GetServerUpdatesHandler,
    @inject(GetVapidKeyHandler) private getVapidKeyHandler: GetVapidKeyHandler
  ) {}

  /**
   * Register or update device
   * POST /api/mobile/device
   */
  async registerDevice(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile device registration request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const deviceData = deviceRegistrationSchema.parse(body);

      const command = new RegisterDeviceCommand({
        userId,
        ...deviceData,
      } as any);

      const result = await this.registerDeviceHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to register device', requestId);
      }

      return StandardSuccessResponse.created(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error processing mobile device registration', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to register device', requestId);
    }
  }

  /**
   * Get devices
   * GET /api/mobile/device
   */
  async getDevices(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile devices retrieval request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const deviceId = searchParams.get('deviceId');
      const activeOnly = searchParams.get('activeOnly') === 'true';

      if (deviceId) {
        const query = new GetDeviceQuery({ userId, deviceId });
        const result = await this.getDeviceHandler.handle(query);

        if (result.isFailure) {
          return StandardErrorResponse.notFound('Device not found', requestId);
        }

        return StandardSuccessResponse.ok(result.value, requestId);
      }

      const query = new GetDevicesQuery({ userId, activeOnly });
      const result = await this.getDevicesHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to retrieve devices', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Error retrieving mobile devices', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to retrieve devices', requestId);
    }
  }

  /**
   * Update device
   * PUT /api/mobile/device
   */
  async updateDevice(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile device update request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const deviceId = searchParams.get('deviceId');

      if (!deviceId) {
        return StandardErrorResponse.badRequest('Device ID is required', requestId);
      }

      const body = await request.json();
      const updateData = deviceUpdateSchema.parse(body);

      const command = new UpdateDeviceCommand({
        userId,
        deviceId,
        ...updateData,
      });

      const result = await this.updateDeviceHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to update device', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error updating mobile device', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to update device', requestId);
    }
  }

  /**
   * Delete device
   * DELETE /api/mobile/device
   */
  async deleteDevice(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile device deletion request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const deviceId = searchParams.get('deviceId');

      if (!deviceId) {
        return StandardErrorResponse.badRequest('Device ID is required', requestId);
      }

      const command = new DeleteDeviceCommand({ userId, deviceId });
      const result = await this.deleteDeviceHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to delete device', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Error deleting mobile device', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to delete device', requestId);
    }
  }

  /**
   * Subscribe to push notifications
   * POST /api/mobile/push/subscribe
   */
  async subscribePush(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing push subscription request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const validationResult = pushSubscriptionSchema.safeParse(body);

      if (!validationResult.success) {
        return handleZodError(validationResult.error, requestId);
      }

      const { endpoint, keys, deviceId, deviceType, browserName, browserVersion, platform, userAgent } = validationResult.data;

      const user = await (await import('@/lib/db')).db.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          organizationMemberships: {
            select: { organizationId: true },
          },
        },
      });

      if (!user) {
        return StandardErrorResponse.notFound('User not found', requestId);
      }

      const command = new SubscribePushCommand({
        userId,
        organizationId: user.organizationMemberships[0]?.organizationId || null,
        endpoint,
        keys,
        deviceId,
        deviceType,
        browserName,
        browserVersion,
        platform,
        userAgent,
      });

      const result = await this.subscribePushHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to subscribe', requestId);
      }

      return StandardSuccessResponse.created(result.value, requestId);
    } catch (error) {
      logger.error('Push subscription failed', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to process push subscription', requestId);
    }
  }

  /**
   * Unsubscribe from push notifications
   * POST /api/mobile/push/unsubscribe
   */
  async unsubscribePush(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing push unsubscribe request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const { endpoint, subscriptionId, deviceId } = body;

      const command = new UnsubscribePushCommand({
        userId,
        endpoint,
        subscriptionId,
        deviceId,
      });

      const result = await this.unsubscribePushHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to unsubscribe', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Push unsubscribe failed', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to process push unsubscribe', requestId);
    }
  }

  /**
   * Send push notification
   * POST /api/mobile/push/send
   */
  async sendPushNotification(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const validatedData = sendNotificationSchema.parse(body);

      const command = new SendPushNotificationCommand({
        ...validatedData,
        sentByUserId: userId,
      });

      const result = await this.sendPushNotificationHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to send notification', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error sending push notification', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to send push notification', requestId);
    }
  }

  /**
   * Get VAPID key
   * GET /api/mobile/push/vapid
   */
  async getVapidKey(_request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing VAPID public key request', 'mobile', { requestId });

      const query = new GetVapidKeyQuery();
      const result = await this.getVapidKeyHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.internal(result.error || 'Failed to retrieve VAPID key', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Failed to retrieve VAPID public key', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to retrieve VAPID public key', requestId);
    }
  }

  /**
   * Queue offline actions
   * POST /api/mobile/offline
   */
  async queueOfflineActions(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing offline actions queue request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const { actions, deviceId } = queueActionSchema.parse(body);

      const command = new QueueOfflineActionCommand({
        userId,
        actions: actions as any,
        deviceId,
      });

      const result = await this.queueOfflineActionHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to queue actions', requestId);
      }

      return StandardSuccessResponse.created(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error processing offline actions queue', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to queue offline actions', requestId);
    }
  }

  /**
   * Get offline actions
   * GET /api/mobile/offline
   */
  async getOfflineActions(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing offline actions retrieval request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const deviceId = searchParams.get('deviceId') || undefined;
      const priority = searchParams.get('priority') as 'low' | 'medium' | 'high' | null;
      const syncedParam = searchParams.get('synced');
      const synced = syncedParam === 'true' ? true : syncedParam === 'false' ? false : undefined;
      const limit = parseInt(searchParams.get('limit') || '50');

      const query = new GetOfflineActionsQuery({
        userId,
        deviceId,
        priority: priority || undefined,
        synced,
        limit,
      });

      const result = await this.getOfflineActionsHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to retrieve actions', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Error retrieving offline actions', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to retrieve offline actions', requestId);
    }
  }

  /**
   * Update offline action
   * PUT /api/mobile/offline
   */
  async updateOfflineAction(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing offline action update request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const { id, retryCount, priority, synced } = updateActionSchema.parse(body);

      const command = new UpdateOfflineActionCommand({
        userId,
        actionId: id,
        retryCount,
        priority: priority as any,
        synced,
      });

      const result = await this.updateOfflineActionHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to update action', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error updating offline action', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to update offline action', requestId);
    }
  }

  /**
   * Delete offline actions
   * DELETE /api/mobile/offline
   */
  async deleteOfflineActions(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing offline actions deletion request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const actionId = searchParams.get('id') || undefined;
      const deviceId = searchParams.get('deviceId') || undefined;
      const syncedParam = searchParams.get('synced');
      const synced = syncedParam === 'true' ? true : syncedParam === 'false' ? false : undefined;

      const command = new DeleteOfflineActionCommand({
        userId,
        actionId,
        deviceId,
        synced,
      });

      const result = await this.deleteOfflineActionHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to delete actions', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Error deleting offline actions', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to delete offline actions', requestId);
    }
  }

  /**
   * Get notification preferences
   * GET /api/mobile/push/preferences
   */
  async getNotificationPreferences(_request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing notification preferences request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const query = new GetNotificationPreferencesQuery({ userId });
      const result = await this.getNotificationPreferencesHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to retrieve preferences', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Failed to retrieve notification preferences', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to retrieve notification preferences', requestId);
    }
  }

  /**
   * Update notification preferences
   * POST /api/mobile/push/preferences
   */
  async updateNotificationPreferences(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing notification preferences update', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const preferencesData = preferencesSchema.parse(body);

      const command = new UpdateNotificationPreferencesCommand({
        userId,
        ...preferencesData,
      } as any);

      const result = await this.updateNotificationPreferencesHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to update preferences', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Failed to update notification preferences', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to update notification preferences', requestId);
    }
  }

  /**
   * Sync data
   * POST /api/mobile/sync
   */
  async syncData(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile sync request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const { actions, lastSyncTimestamp, deviceId } = syncRequestSchema.parse(body);

      const command = new SyncDataCommand({
        userId,
        actions,
        lastSyncTimestamp,
        deviceId,
      });

      const result = await this.syncDataHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to sync data', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error('Error processing mobile sync', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to process sync request', requestId);
    }
  }

  /**
   * Get server updates
   * GET /api/mobile/sync
   */
  async getServerUpdates(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing mobile sync updates request', 'mobile', { requestId });

      const { userId } = await auth();

      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const lastSyncTimestamp = searchParams.get('lastSync');

      if (!lastSyncTimestamp) {
        return StandardErrorResponse.badRequest('lastSync parameter is required', requestId);
      }

      const user = await (await import('@/lib/db')).db.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          organizationMemberships: {
            select: { organizationId: true },
          },
        },
      });

      if (!user) {
        return StandardErrorResponse.notFound('User not found', requestId);
      }

      const query = new GetServerUpdatesQuery({
        userId,
        organizationId: user.organizationMemberships[0]?.organizationId || null,
        lastSyncTimestamp,
      });

      const result = await this.getServerUpdatesHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error || 'Failed to retrieve updates', requestId);
      }

      return StandardSuccessResponse.ok(result.value, requestId);
    } catch (error) {
      logger.error('Error retrieving mobile sync updates', 'mobile', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return StandardErrorResponse.internal('Failed to retrieve sync updates', requestId);
    }
  }
}
