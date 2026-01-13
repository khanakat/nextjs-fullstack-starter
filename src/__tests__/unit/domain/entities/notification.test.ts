import { Notification, NotificationStatus, NotificationPriority, NotificationCategory } from 'src/shared/domain/notifications/entities/notification';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { NotificationFactory } from '../../../factories/notification-factory';

describe('Notification Entity', () => {
  describe('Creation', () => {
    it('should create a notification with valid data', () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'Test Message',
        recipientId: UniqueId.generate(),
        type: NotificationType.system(),
        priority: NotificationPriority.medium(),
      };

      const notification = Notification.create(notificationData);

      expect(notification.title).toBe(notificationData.title);
      expect(notification.message).toBe(notificationData.message);
      expect(notification.recipientId).toBe(notificationData.recipientId);
      expect(notification.type).toBe(notificationData.type);
      expect(notification.priority).toBe(notificationData.priority);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should create a notification with minimal required data', () => {
      const notificationData = {
        title: 'Minimal Notification',
        message: 'Minimal Message',
        recipientId: UniqueId.generate(),
        type: NotificationType.user(),
      };

      const notification = Notification.create(notificationData);

      expect(notification.title).toBe(notificationData.title);
      expect(notification.message).toBe(notificationData.message);
      expect(notification.recipientId).toBe(notificationData.recipientId);
      expect(notification.type).toBe(notificationData.type);
      expect(notification.priority.equals(NotificationPriority.medium())).toBe(true);
    });

    it('should throw error when title is empty', () => {
      const notificationData = {
        title: '',
        message: 'Test Message',
        recipientId: UniqueId.generate(),
        type: NotificationType.system(),
      };

      expect(() => Notification.create(notificationData)).toThrow();
    });

    it('should throw error when message is empty', () => {
      const notificationData = {
        title: 'Test Title',
        message: '',
        recipientId: UniqueId.generate(),
        type: NotificationType.system(),
      };

      expect(() => Notification.create(notificationData)).toThrow();
    });
  });

  describe('Status Management', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should mark notification as sent', () => {
      notification.markAsSent();

      expect(notification.sentAt).toBeInstanceOf(Date);
      expect(notification.isPending()).toBe(false);
      expect(notification.isSent()).toBe(true);
    });

    it('should mark notification as read', () => {
      notification.markAsSent();
      notification.markAsRead();

      expect(notification.readAt).toBeInstanceOf(Date);
      expect(notification.isRead()).toBe(true);
    });

    it('should not mark pending notification as read', () => {
      expect(() => notification.markAsRead()).toThrow();
    });

    it('should mark notification as failed', () => {
      const errorMessage = 'Failed to send notification';
      notification.markAsFailed(errorMessage);

      expect(notification.failedAt).toBeInstanceOf(Date);
      expect(notification.errorMessage).toBe(errorMessage);
      expect(notification.isFailed()).toBe(true);
    });
  });

  describe('Scheduling', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should schedule notification for future delivery', () => {
      const scheduledDate = new Date(Date.now() + 3600000); // 1 hour from now
      notification.scheduleFor(scheduledDate);

      expect(notification.scheduledFor).toBe(scheduledDate);
      expect(notification.isScheduled()).toBe(true);
    });

    it('should not schedule notification for past date', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      expect(() => notification.scheduleFor(pastDate)).toThrow();
    });

    it('should cancel scheduled notification', () => {
      const scheduledDate = new Date(Date.now() + 3600000);
      notification.scheduleFor(scheduledDate);
      notification.cancelSchedule();

      expect(notification.scheduledFor).toBeNull();
      expect(notification.isScheduled()).toBe(false);
    });

    it('should not cancel schedule of sent notification', () => {
      const scheduledDate = new Date(Date.now() + 3600000);
      notification.scheduleFor(scheduledDate);
      notification.markAsSent();

      expect(() => notification.cancelSchedule()).toThrow();
    });
  });

  describe('Priority Management', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should update priority', () => {
      const highPriority = NotificationPriority.high();
      notification.updatePriority(highPriority);

      expect(notification.priority).toBe(highPriority);
    });

    it('should not update priority of sent notification', () => {
      notification.markAsSent();
      const originalPriority = notification.priority;

      expect(() => notification.updatePriority(NotificationPriority.high())).toThrow();
      expect(notification.priority).toBe(originalPriority);
    });
  });

  describe('Content Management', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should update title', () => {
      const newTitle = 'Updated Title';
      notification.updateTitle(newTitle);

      expect(notification.title).toBe(newTitle);
    });

    it('should update message', () => {
      const newMessage = 'Updated Message';
      notification.updateMessage(newMessage);

      expect(notification.message).toBe(newMessage);
    });

    it('should not update content of sent notification', () => {
      notification.markAsSent();
      const originalTitle = notification.title;
      const originalMessage = notification.message;

      expect(() => notification.updateTitle('New Title')).toThrow();
      expect(() => notification.updateMessage('New Message')).toThrow();
      expect(notification.title).toBe(originalTitle);
      expect(notification.message).toBe(originalMessage);
    });
  });

  describe('Metadata Management', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should add metadata', () => {
      const metadata = { key1: 'value1', key2: 'value2' };
      notification.addMetadata(metadata);

      expect(notification.metadata).toEqual(metadata);
    });

    it('should update existing metadata', () => {
      const initialMetadata = { key1: 'value1' };
      const additionalMetadata = { key2: 'value2' };
      
      notification.addMetadata(initialMetadata);
      notification.addMetadata(additionalMetadata);

      expect(notification.metadata).toEqual({ ...initialMetadata, ...additionalMetadata });
    });

    it('should remove metadata key', () => {
      const metadata = { key1: 'value1', key2: 'value2' };
      notification.addMetadata(metadata);
      notification.removeMetadataKey('key1');

      expect(notification.metadata).toEqual({ key2: 'value2' });
    });
  });

  describe('Retry Logic', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = NotificationFactory.createPending();
    });

    it('should increment retry count on failure', () => {
      notification.markAsFailed('First failure');
      expect(notification.retryCount).toBe(1);

      notification.retry();
      notification.markAsFailed('Second failure');
      expect(notification.retryCount).toBe(2);
    });

    it('should reset retry count on successful send', () => {
      notification.markAsFailed('Failure');
      notification.retry();
      notification.markAsSent();

      expect(notification.retryCount).toBe(1); // Keeps the count but stops retrying
    });

    it('should not retry beyond maximum attempts', () => {
      // Assuming max retry count is 3
      for (let i = 0; i < 3; i++) {
        notification.markAsFailed(`Failure ${i + 1}`);
        if (i < 2) notification.retry();
      }

      expect(() => notification.retry()).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate notification data', () => {
      const validNotification = NotificationFactory.createPending();
      expect(validNotification.isValid()).toBe(true);
    });

    it('should invalidate notification with empty title', () => {
      expect(() => {
        NotificationFactory.create({ title: '' });
      }).toThrow();
    });

    it('should invalidate notification with empty message', () => {
      expect(() => {
        NotificationFactory.create({ message: '' });
      }).toThrow();
    });
  });

  describe('Equality', () => {
    it('should be equal to another notification with same id', () => {
      const id = UniqueId.generate();
      const notification1 = NotificationFactory.create({ id: id.value });
      const notification2 = NotificationFactory.create({ id: id.value });

      expect(notification1.equals(notification2)).toBe(true);
    });

    it('should not be equal to another notification with different id', () => {
      const notification1 = NotificationFactory.createPending();
      const notification2 = NotificationFactory.createPending();

      expect(notification1.equals(notification2)).toBe(false);
    });
  });

  describe('Domain Events', () => {
    it('should raise NotificationCreated event when created', () => {
      const notification = NotificationFactory.createPending();
      const events = notification.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('NotificationCreated');
    });

    it('should raise NotificationSent event when sent', () => {
      const notification = NotificationFactory.createPending();
      notification.clearEvents(); // Clear creation event
      
      notification.markAsSent();
      const events = notification.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('NotificationSent');
    });

    it('should raise NotificationRead event when read', () => {
      const notification = NotificationFactory.createSent();
      notification.clearEvents(); // Clear previous events
      
      notification.markAsRead();
      const events = notification.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('NotificationRead');
    });

    it('should raise NotificationFailed event when failed', () => {
      const notification = NotificationFactory.createPending();
      notification.clearEvents(); // Clear creation event
      
      notification.markAsFailed('Test error');
      const events = notification.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('NotificationFailed');
    });
  });
});