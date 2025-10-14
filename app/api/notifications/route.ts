import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationStore, NotificationService } from '@/lib/notifications';

/**
 * GET /api/notifications - Get user notifications
 * Query params:
 * - limit: number of notifications to return (default: 50)
 * - offset: pagination offset (default: 0) 
 * - unread: only unread notifications (default: false)
 * - type: filter by notification type
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const type = url.searchParams.get('type') as any;

    const notifications = await notificationStore.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
      type,
    });

    const unreadCount = await notificationStore.getUnreadCount(userId);
    const preferences = await notificationStore.getUserPreferences(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
      preferences,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit, // Simple check
      },
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create a new notification
 * Body: Notification data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      data,
      actionUrl,
      actionLabel,
      channels = {
        inApp: true,
        email: false,
        push: false,
      },
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = await NotificationService.notify(userId, {
      title,
      message,
      type,
      priority,
      data,
      actionUrl,
      actionLabel,
      channels,
    });

    return NextResponse.json({ notification }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - Bulk operations
 * Body: { action: 'markAllAsRead' | 'deleteAll', type?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'markAllAsRead':
        const count = await notificationStore.markAllAsRead(userId);
        return NextResponse.json({ message: `Marked ${count} notifications as read` });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}