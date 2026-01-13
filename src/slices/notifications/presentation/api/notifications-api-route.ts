import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { CreateNotificationHandler } from '../../application/handlers/create-notification-handler';
import { MarkNotificationReadHandler } from '../../application/handlers/mark-notification-read-handler';
import { DeleteNotificationHandler } from '../../application/handlers/delete-notification-handler';
import { MarkAllNotificationsReadHandler } from '../../application/handlers/mark-all-notifications-read-handler';
import { DeleteOldNotificationsHandler } from '../../application/handlers/delete-old-notifications-handler';
import { GetNotificationHandler } from '../../application/handlers/get-notification-handler';
import { ListNotificationsHandler } from '../../application/handlers/list-notifications-handler';
import { GetUnreadCountHandler } from '../../application/handlers/get-unread-count-handler';
import { CreateNotificationCommand } from '../../application/commands/create-notification-command';
import { MarkNotificationReadCommand } from '../../application/commands/mark-notification-read-command';
import { DeleteNotificationCommand } from '../../application/commands/delete-notification-command';
import { MarkAllNotificationsReadCommand } from '../../application/commands/mark-all-notifications-read-command';
import { DeleteOldNotificationsCommand } from '../../application/commands/delete-old-notifications-command';
import { GetNotificationQuery } from '../../application/queries/get-notification-query';
import { ListNotificationsQuery } from '../../application/queries/list-notifications-query';
import { GetUnreadCountQuery } from '../../application/queries/get-unread-count-query';
import { NotificationId } from '../../domain/value-objects/notification-id';

/**
 * Notifications API Route
 * Handles HTTP requests for notifications
 */
@injectable()
export class NotificationsApiRoute {
  constructor(
    private readonly createNotificationHandler: CreateNotificationHandler,
    private readonly markNotificationReadHandler: MarkNotificationReadHandler,
    private readonly deleteNotificationHandler: DeleteNotificationHandler,
    private readonly markAllNotificationsReadHandler: MarkAllNotificationsReadHandler,
    private readonly deleteOldNotificationsHandler: DeleteOldNotificationsHandler,
    private readonly getNotificationHandler: GetNotificationHandler,
    private readonly listNotificationsHandler: ListNotificationsHandler,
    private readonly getUnreadCountHandler: GetUnreadCountHandler
  ) {}

  /**
   * GET /api/notifications
   * List notifications for a user
   */
  async list(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      const query = new ListNotificationsQuery({
        userId,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        unreadOnly: searchParams.get('unreadOnly') === 'true',
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
      });

      const result = await this.listNotificationsHandler.handle(query);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to list notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/notifications/[id]
   * Get a single notification
   */
  async get(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      const notificationId = NotificationId.fromValue(id);
      const query = new GetNotificationQuery({ userId, notificationId: notificationId.value });

      const result = await this.getNotificationHandler.handle(query);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get notification' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/notifications
   * Create a new notification
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateNotificationCommand({
        userId: body.userId,
        title: body.title,
        message: body.message,
        type: body.type || 'system',
        priority: body.priority || 'medium',
        data: body.data,
        actionUrl: body.actionUrl,
        actionLabel: body.actionLabel,
        channels: body.channels || { inApp: true, email: false, push: false },
        deliverAt: body.deliverAt ? new Date(body.deliverAt) : undefined,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      });

      const result = await this.createNotificationHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to create notification' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value.toObject(), { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PATCH /api/notifications/[id]/read
   * Mark a notification as read
   */
  async markAsRead(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const notificationId = NotificationId.fromValue(id);

      const command = new MarkNotificationReadCommand({
        notificationId: notificationId.value,
        userId: body.userId,
      });

      const result = await this.markNotificationReadHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to mark notification as read' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PATCH /api/notifications/mark-all-read
   * Mark all notifications as read for a user
   */
  async markAllAsRead(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new MarkAllNotificationsReadCommand({
        userId: body.userId,
      });

      const result = await this.markAllNotificationsReadHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to mark all notifications as read' },
          { status: 400 }
        );
      }

      return NextResponse.json({ count: result.value });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/notifications/[id]
   * Delete a notification
   */
  async delete(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const notificationId = NotificationId.fromValue(id);

      const command = new DeleteNotificationCommand({
        notificationId: notificationId.value,
        userId: body.userId,
      });

      const result = await this.deleteNotificationHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete notification' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/notifications/delete-old
   * Delete old notifications
   */
  async deleteOld(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new DeleteOldNotificationsCommand({
        userId: body.userId,
        olderThanDays: body.olderThanDays || 30,
      });

      const result = await this.deleteOldNotificationsHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete old notifications' },
          { status: 400 }
        );
      }

      return NextResponse.json({ count: result.value });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread count for a user
   */
  async getUnreadCount(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      const query = new GetUnreadCountQuery({ userId });

      const result = await this.getUnreadCountHandler.handle(query);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get unread count' },
          { status: 500 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

/**
 * Next.js API route handler
 * This is the actual function that Next.js will call
 */
export async function GET(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new NotificationsApiRoute(
    // These would be injected by the DI container in a real implementation
    {} as any, // createNotificationHandler
    {} as any, // markNotificationReadHandler
    {} as any, // deleteNotificationHandler
    {} as any, // markAllNotificationsReadHandler
    {} as any, // deleteOldNotificationsHandler
    {} as any, // getNotificationHandler
    {} as any, // listNotificationsHandler
    {} as any, // getUnreadCountHandler
  );

  if (params?.id) {
    // Get single notification
    return await apiRoute.get(request, params.id);
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get('unreadCount') === 'true') {
    // Get unread count
    return await apiRoute.getUnreadCount(request);
  }

  // List notifications
  return await apiRoute.list(request);
}

export async function POST(request: NextRequest) {
  const apiRoute = new NotificationsApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return await apiRoute.create(request);
}

export async function PATCH(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new NotificationsApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const { searchParams } = new URL(request.url);
  if (searchParams.get('action') === 'mark-all-read') {
    // Mark all as read
    return await apiRoute.markAllAsRead(request);
  }

  if (params?.id) {
    // Mark as read
    return await apiRoute.markAsRead(request, params.id);
  }

  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new NotificationsApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const { searchParams } = new URL(request.url);
  if (searchParams.get('action') === 'delete-old') {
    // Delete old notifications
    return await apiRoute.deleteOld(request);
  }

  if (params?.id) {
    // Delete single notification
    return await apiRoute.delete(request, params.id);
  }

  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  );
}
