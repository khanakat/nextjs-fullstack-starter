# Notifications Slice Integration Guide

## Overview

The Notifications slice provides a comprehensive notification system with support for multiple delivery channels (in-app, email, push, SMS), notification types, and delivery tracking.

## Architecture

```
src/slices/notifications/
├── domain/
│   ├── value-objects/
│   │   ├── notification-id.ts          # Unique identifier for notifications
│   │   ├── notification-type.ts         # Type of notification (info, success, warning, error, system, task, workflow, reminder, marketing)
│   │   └── notification-status.ts       # Status of notification (pending, delivered, read, failed)
│   ├── entities/
│   │   └── notification.ts              # Aggregate root for notifications
│   └── repositories/
│       └── notification-repository.ts  # Repository interface
├── application/
│   ├── commands/
│   │   ├── create-notification-command.ts
│   │   ├── mark-notification-read-command.ts
│   │   ├── delete-notification-command.ts
│   │   ├── mark-all-notifications-read-command.ts
│   │   └── delete-old-notifications-command.ts
│   ├── queries/
│   │   ├── get-notification-query.ts
│   │   ├── list-notifications-query.ts
│   │   └── get-unread-count-query.ts
│   ├── dtos/
│   │   ├── notification-dto.ts
│   │   ├── unread-count-dto.ts
│   │   └── paginated-notifications-dto.ts
│   └── handlers/
│       ├── create-notification-handler.ts
│       ├── mark-notification-read-handler.ts
│       ├── delete-notification-handler.ts
│       ├── mark-all-notifications-read-handler.ts
│       ├── delete-old-notifications-handler.ts
│       ├── get-notification-handler.ts
│       ├── list-notifications-handler.ts
│       └── get-unread-count-handler.ts
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-notification-repository.ts
│   └── services/
│       └── notification-service-impl.ts
└── presentation/
    └── api/
        └── notifications-api-route.ts
```

## Domain Layer

### Value Objects

#### NotificationId
- Unique identifier for notifications
- Factory method: `create(value: string): Result<NotificationId>`
- Helper method: `fromValue(value: string): NotificationId`

#### NotificationType
- Type of notification with validation
- Valid types: `info`, `success`, `warning`, `error`, `system`, `task`, `workflow`, `reminder`, `marketing`
- Factory method: `create(value: NotificationTypeValue): NotificationType`

#### NotificationStatus
- Status of notification with validation
- Valid statuses: `pending`, `delivered`, `read`, `failed`
- Factory method: `create(value: string): NotificationStatus`

### Entities

#### Notification
- Aggregate root for notifications
- Properties:
  - `id`: NotificationId
  - `userId`: string
  - `title`: string
  - `message`: string | undefined
  - `type`: NotificationType
  - `priority`: 'low' | 'medium' | 'high' | 'urgent'
  - `data`: Record<string, any> | undefined
  - `actionUrl`: string | undefined
  - `actionLabel`: string | undefined
  - `read`: boolean
  - `createdAt`: Date
  - `readAt`: Date | undefined
  - `channels`: { inApp: boolean; email: boolean; push: boolean; sms?: boolean; }
  - `deliverAt`: Date | undefined
  - `expiresAt`: Date | undefined
  - `status`: NotificationStatus
- Methods:
  - `markAsRead()`: Marks notification as read
- Static methods:
  - `create(props)`: Creates new notification
  - `reconstitute(props)`: Reconstitutes from persistence

### Repository Interface

#### INotificationRepository
- Methods:
  - `create(notification)`: Create new notification
  - `findById(id)`: Find notification by ID
  - `findByUserId(userId, options)`: List notifications with filters
  - `update(notification)`: Update notification
  - `delete(id)`: Delete notification
  - `getUnreadCount(userId)`: Get unread count
  - `markAllAsRead(userId)`: Mark all notifications as read
  - `markAsRead(userId, notificationIds)`: Mark specific notifications as read
  - `deleteOldNotifications(olderThanDays)`: Delete old notifications

## Application Layer

### Commands

#### CreateNotificationCommand
- Creates a new notification
- Properties: userId, title, message, type, priority, data, actionUrl, actionLabel, channels, deliverAt, expiresAt

#### MarkNotificationReadCommand
- Marks a notification as read
- Properties: userId, notificationId

#### DeleteNotificationCommand
- Deletes a notification
- Properties: userId, notificationId

#### MarkAllNotificationsReadCommand
- Marks all notifications as read for a user
- Properties: userId

#### DeleteOldNotificationsCommand
- Deletes old notifications
- Properties: userId, olderThanDays

### Queries

#### GetNotificationQuery
- Gets a single notification
- Properties: userId, notificationId

#### ListNotificationsQuery
- Lists notifications with filters
- Properties: userId, limit, offset, unreadOnly, type, status

#### GetUnreadCountQuery
- Gets unread count for a user
- Properties: userId

### DTOs

#### NotificationDto
- Main notification DTO
- Properties: id, userId, title, message, type, priority, data, actionUrl, actionLabel, read, createdAt, readAt, channels, deliverAt, expiresAt, status

#### UnreadCountDto
- Unread count DTO
- Properties: userId, count

#### PaginatedNotificationsDto
- Paginated notifications result
- Properties: notifications, total, page, pageSize

### Handlers

#### CreateNotificationHandler
- Handles notification creation
- Validates command properties
- Creates notification entity
- Saves via repository
- Returns NotificationDto

#### MarkNotificationReadHandler
- Handles marking notification as read
- Validates command
- Finds notification by ID
- Marks as read via repository
- Returns NotificationDto

#### DeleteNotificationHandler
- Handles notification deletion
- Validates command
- Deletes via repository
- Returns success result

#### MarkAllNotificationsReadHandler
- Handles marking all notifications as read
- Validates command
- Marks all as read via repository
- Returns count

#### DeleteOldNotificationsHandler
- Handles deletion of old notifications
- Validates command
- Deletes old notifications via repository
- Returns count

#### GetNotificationHandler
- Handles getting single notification
- Validates query
- Finds notification by ID
- Returns NotificationDto

#### ListNotificationsHandler
- Handles listing notifications
- Validates query
- Applies filters
- Returns PaginatedNotificationsDto

#### GetUnreadCountHandler
- Handles getting unread count
- Validates query
- Gets count via repository
- Returns UnreadCountDto

## Infrastructure Layer

### Repository

#### PrismaNotificationRepository
- Implements INotificationRepository
- Uses Prisma ORM for data access
- Handles JSON serialization for additional fields
- Note: Prisma Notification model has limited fields, additional data stored in message field as JSON

### Service

#### NotificationServiceImpl
- Implements INotificationService
- Handles notification delivery
- Methods:
  - `sendNotification(notification)`: Send single notification
  - `sendBulkNotifications(notifications)`: Send multiple notifications
  - `sendSystemNotification(userId, title, message)`: Send system notification
  - `sendTaskNotification(userId, title, message, actionUrl)`: Send task notification
  - `sendWorkflowNotification(userId, title, message, actionUrl)`: Send workflow notification
  - `sendReminderNotification(userId, title, message, actionUrl)`: Send reminder notification

## Presentation Layer

### API Routes

#### NotificationsApiRoute
- Handles HTTP requests for notifications
- Endpoints:
  - `GET /api/notifications`: List notifications
  - `GET /api/notifications/[id]`: Get single notification
  - `GET /api/notifications/unread-count`: Get unread count
  - `POST /api/notifications`: Create notification
  - `PATCH /api/notifications/[id]/read`: Mark as read
  - `PATCH /api/notifications/mark-all-read`: Mark all as read
  - `DELETE /api/notifications/[id]`: Delete notification
  - `DELETE /api/notifications/delete-old`: Delete old notifications

## Integration Steps

### 1. Configure DI Container

Add notification types to DI container in `src/shared/infrastructure/di/types.ts`:

```typescript
// Notifications
NotificationRepository: Symbol.for('NotificationRepository'),
NotificationService: Symbol.for('NotificationService'),
CreateNotificationHandler: Symbol.for('CreateNotificationHandler'),
MarkNotificationReadHandler: Symbol.for('MarkNotificationReadHandler'),
DeleteNotificationHandler: Symbol.for('DeleteNotificationHandler'),
MarkAllNotificationsReadHandler: Symbol.for('MarkAllNotificationsReadHandler'),
DeleteOldNotificationsHandler: Symbol.for('DeleteOldNotificationsHandler'),
GetNotificationHandler: Symbol.for('GetNotificationHandler'),
ListNotificationsHandler: Symbol.for('ListNotificationsHandler'),
GetUnreadCountHandler: Symbol.for('GetUnreadCountHandler'),
```

### 2. Register Services

Register services in DI container initialization:

```typescript
container.bind<INotificationRepository>(TYPES.NotificationRepository)
  .toConstantValue(new PrismaNotificationRepository(prisma));

container.bind<INotificationService>(TYPES.NotificationService)
  .to(NotificationServiceImpl)
  .inRequestScope();
```

### 3. Register Handlers

Register handlers in DI container:

```typescript
container.bind<CreateNotificationHandler>(TYPES.CreateNotificationHandler)
  .to(CreateNotificationHandler)
  .inRequestScope();

container.bind<MarkNotificationReadHandler>(TYPES.MarkNotificationReadHandler)
  .to(MarkNotificationReadHandler)
  .inRequestScope();

// ... register other handlers
```

### 4. Create API Route

Create Next.js API route at `app/api/notifications/route.ts`:

```typescript
import { container } from '@/shared/infrastructure/di/container';
import { GET, POST, PATCH, DELETE } from './notifications-api-route';

export const GET = (request: NextRequest, { params }) => {
  const apiRoute = container.get<NotificationsApiRoute>(TYPES.NotificationsApiRoute);
  return GET.call(apiRoute, request, params);
};

export const POST = (request: NextRequest) => {
  const apiRoute = container.get<NotificationsApiRoute>(TYPES.NotificationsApiRoute);
  return POST.call(apiRoute, request);
};

export const PATCH = (request: NextRequest, { params }) => {
  const apiRoute = container.get<NotificationsApiRoute>(TYPES.NotificationsApiRoute);
  return PATCH.call(apiRoute, request, params);
};

export const DELETE = (request: NextRequest, { params }) => {
  const apiRoute = container.get<NotificationsApiRoute>(TYPES.NotificationsApiRoute);
  return DELETE.call(apiRoute, request, params);
};
```

### 5. Test Integration

Test the notification endpoints:

```bash
# Create notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "title": "New notification",
    "message": "You have a new notification",
    "type": "info",
    "priority": "medium"
  }'

# List notifications
curl http://localhost:3000/api/notifications?userId=user-id

# Get unread count
curl http://localhost:3000/api/notifications/unread-count?userId=user-id
```

## Usage Examples

### Creating a Notification

```typescript
import { Notification } from '@/slices/notifications';

const notification = Notification.create({
  userId: 'user-123',
  title: 'New Task Assigned',
  message: 'You have been assigned a new task',
  type: 'task',
  priority: 'high',
  actionUrl: '/tasks/123',
  actionLabel: 'View Task',
  channels: { inApp: true, email: true, push: true },
});

await notificationRepository.create(notification);
```

### Listing Notifications

```typescript
const notifications = await notificationRepository.findByUserId('user-123', {
  limit: 20,
  unreadOnly: true,
  type: 'task',
});
```

### Marking as Read

```typescript
const notification = await notificationRepository.findById(notificationId);
notification.markAsRead();
await notificationRepository.update(notification);
```

### Sending System Notification

```typescript
await notificationService.sendSystemNotification(
  'user-123',
  'Welcome!',
  'Welcome to the platform'
);
```

## Notes

- The Prisma Notification model has limited fields. Additional fields are stored in the `message` field as JSON.
- The repository handles serialization/deserialization of additional fields.
- Consider implementing actual notification delivery (email, push, SMS) in the service layer.
- The current implementation stores notifications but doesn't deliver them to external channels.
