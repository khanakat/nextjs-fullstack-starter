import { NextRequest } from 'next/server';
import { DIContainer } from 'src/shared/infrastructure/di/container';
import { NotificationFactory } from '../../factories/notification-factory';
import { UserFactory } from '../../factories/user-factory';
import { ValueObjectFactory } from '../../factories/value-object-factory';

/**
 * Integration tests for the complete notification flow
 * Tests the entire vertical slice from API to database
 */
describe('Notification Flow Integration Tests', () => {
  let testUser: any;
  let testOrganization: any;

  beforeAll(async () => {
    // Setup test database and dependencies
    await setupTestDatabase();
    
    // Create test user and organization
    testUser = UserFactory.create();
    testOrganization = {
      id: ValueObjectFactory.createUniqueId().getValue(),
      name: 'Test Organization',
    };
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await clearTestData();
  });

  describe('Complete Notification Lifecycle', () => {
    it('should create, retrieve, mark as read, and delete notification', async () => {
      // Step 1: Create notification via API
      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Integration Test Notification',
          message: 'This is a test notification for integration testing',
          recipientId: testUser.getId().getValue(),
          type: 'info',
          priority: 'medium',
          organizationId: testOrganization.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      expect(createData.success).toBe(true);
      expect(createData.data.id).toBeDefined();
      
      const notificationId = createData.data.id;

      // Step 2: Retrieve notifications via API
      const getRequest = new NextRequest(
        'http://localhost/api/notifications?page=1&limit=10',
        {
          method: 'GET',
          headers: {
            'x-user-id': testUser.getId().getValue(),
            'x-organization-id': testOrganization.id,
          },
        }
      );

      const getResponse = await fetch('/api/notifications?page=1&limit=10', {
        method: 'GET',
        headers: Object.fromEntries(getRequest.headers.entries()),
      });

      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.success).toBe(true);
      expect(getData.data.items).toHaveLength(1);
      expect(getData.data.items[0].id).toBe(notificationId);
      expect(getData.data.items[0].readAt).toBeNull();

      // Step 3: Mark notification as read via API
      const markReadRequest = new NextRequest(
        `http://localhost/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': testUser.getId().getValue(),
            'x-organization-id': testOrganization.id,
          },
        }
      );

      const markReadResponse = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: Object.fromEntries(markReadRequest.headers.entries()),
      });

      expect(markReadResponse.status).toBe(200);
      const markReadData = await markReadResponse.json();
      expect(markReadData.success).toBe(true);

      // Step 4: Verify notification is marked as read
      const getUpdatedResponse = await fetch('/api/notifications?page=1&limit=10', {
        method: 'GET',
        headers: Object.fromEntries(getRequest.headers.entries()),
      });

      const getUpdatedData = await getUpdatedResponse.json();
      expect(getUpdatedData.data.items[0].readAt).not.toBeNull();

      // Step 5: Delete notification via API
      const deleteRequest = new NextRequest(
        `http://localhost/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': testUser.getId().getValue(),
            'x-organization-id': testOrganization.id,
          },
        }
      );

      const deleteResponse = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: Object.fromEntries(deleteRequest.headers.entries()),
      });

      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);

      // Step 6: Verify notification is deleted
      const getFinalResponse = await fetch('/api/notifications?page=1&limit=10', {
        method: 'GET',
        headers: Object.fromEntries(getRequest.headers.entries()),
      });

      const getFinalData = await getFinalResponse.json();
      expect(getFinalData.data.items).toHaveLength(0);
    });

    it('should handle notification delivery through multiple channels', async () => {
      // Create notification with multiple delivery channels
      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Multi-Channel Notification',
          message: 'This notification should be delivered via multiple channels',
          recipientId: testUser.getId().getValue(),
          type: 'alert',
          priority: 'high',
          channels: ['email', 'push', 'in-app'],
          organizationId: testOrganization.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      
      const notificationId = createData.data.id;

      // Wait for delivery processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check delivery status via API
      const statusResponse = await fetch(`/api/notifications/${notificationId}/delivery-status`, {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      expect(statusResponse.status).toBe(200);
      const statusData = await statusResponse.json();
      expect(statusData.success).toBe(true);
      expect(statusData.data.deliveryStatus).toHaveProperty('email');
      expect(statusData.data.deliveryStatus).toHaveProperty('push');
      expect(statusData.data.deliveryStatus).toHaveProperty('in-app');
    });

    it('should handle notification preferences and filtering', async () => {
      // Set user notification preferences
      const preferencesRequest = new NextRequest('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          emailEnabled: true,
          pushEnabled: false,
          inAppEnabled: true,
          categories: {
            'reports': true,
            'system': false,
            'marketing': false
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const preferencesResponse = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        body: preferencesRequest.body,
        headers: Object.fromEntries(preferencesRequest.headers.entries()),
      });

      expect(preferencesResponse.status).toBe(200);

      // Create notification that should respect preferences
      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Report Ready',
          message: 'Your monthly report is ready for review',
          recipientId: testUser.getId().getValue(),
          type: 'info',
          category: 'reports',
          priority: 'medium',
          organizationId: testOrganization.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      
      // Verify notification was created and delivery channels respect preferences
      expect(createData.data.deliveryChannels).toContain('email');
      expect(createData.data.deliveryChannels).toContain('in-app');
      expect(createData.data.deliveryChannels).not.toContain('push');
    });

    it('should handle bulk notification operations', async () => {
      const bulkNotificationData = {
        notifications: [
          {
            title: 'System Maintenance',
            message: 'Scheduled maintenance tonight',
            type: 'warning',
            priority: 'high'
          },
          {
            title: 'New Feature Available',
            message: 'Check out our new reporting features',
            type: 'info',
            priority: 'low'
          },
          {
            title: 'Security Update',
            message: 'Please update your password',
            type: 'alert',
            priority: 'high'
          }
        ],
        recipients: [testUser.getId().getValue()],
        organizationId: testOrganization.id,
        scheduleFor: null // Send immediately
      };

      const bulkRequest = new NextRequest('http://localhost/api/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkNotificationData),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const bulkResponse = await fetch('/api/notifications/bulk', {
        method: 'POST',
        body: bulkRequest.body,
        headers: Object.fromEntries(bulkRequest.headers.entries()),
      });

      expect(bulkResponse.status).toBe(201);
      const bulkData = await bulkResponse.json();
      expect(bulkData.success).toBe(true);
      expect(bulkData.data.created).toBe(3);
      expect(bulkData.data.failed).toBe(0);

      // Verify all notifications were created
      const getRequest = new NextRequest('http://localhost/api/notifications?page=1&limit=10');
      const getResponse = await fetch('/api/notifications?page=1&limit=10', {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const getData = await getResponse.json();
      expect(getData.data.items).toHaveLength(3);
    });

    it('should handle notification templates and personalization', async () => {
      // Create notification using template
      const templateNotificationData = {
        templateId: 'report-ready-template',
        recipientId: testUser.getId().getValue(),
        variables: {
          reportName: 'Monthly Sales Report',
          reportUrl: 'https://app.example.com/reports/monthly-sales',
          userName: testUser.getName(),
          generatedAt: new Date().toISOString()
        },
        organizationId: testOrganization.id
      };

      const templateRequest = new NextRequest('http://localhost/api/notifications/from-template', {
        method: 'POST',
        body: JSON.stringify(templateNotificationData),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const templateResponse = await fetch('/api/notifications/from-template', {
        method: 'POST',
        body: templateRequest.body,
        headers: Object.fromEntries(templateRequest.headers.entries()),
      });

      expect(templateResponse.status).toBe(201);
      const templateData = await templateResponse.json();
      expect(templateData.success).toBe(true);
      
      // Verify template variables were interpolated
      expect(templateData.data.title).toContain('Monthly Sales Report');
      expect(templateData.data.message).toContain(testUser.getName());
    });

    it('should handle notification scheduling and delayed delivery', async () => {
      const scheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const scheduledNotificationData = {
        title: 'Scheduled Reminder',
        message: 'This is a scheduled notification',
        recipientId: testUser.getId().getValue(),
        type: 'reminder',
        priority: 'medium',
        scheduleFor: scheduledTime.toISOString(),
        organizationId: testOrganization.id
      };

      const scheduleRequest = new NextRequest('http://localhost/api/notifications/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduledNotificationData),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const scheduleResponse = await fetch('/api/notifications/schedule', {
        method: 'POST',
        body: scheduleRequest.body,
        headers: Object.fromEntries(scheduleRequest.headers.entries()),
      });

      expect(scheduleResponse.status).toBe(201);
      const scheduleData = await scheduleResponse.json();
      expect(scheduleData.success).toBe(true);
      expect(scheduleData.data.status).toBe('scheduled');
      expect(new Date(scheduleData.data.scheduledFor)).toEqual(scheduledTime);

      // Verify notification is not immediately visible
      const getRequest = new NextRequest('http://localhost/api/notifications?status=delivered');
      const getResponse = await fetch('/api/notifications?status=delivered', {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const getData = await getResponse.json();
      expect(getData.data.items).toHaveLength(0);

      // Check scheduled notifications
      const scheduledRequest = new NextRequest('http://localhost/api/notifications?status=scheduled');
      const scheduledResponse_get = await fetch('/api/notifications?status=scheduled', {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const scheduledData_get = await scheduledResponse_get.json();
      expect(scheduledData_get.data.items).toHaveLength(1);
      expect(scheduledData_get.data.items[0].status).toBe('scheduled');
      // Fetch delivery status for the scheduled notification before asserting channels
      const statusResponse = await fetch(`/api/notifications/${scheduledData_get.data.items[0].id}/delivery-status`, {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });
      const statusData = await statusResponse.json();
      expect(statusData.data.channels).toHaveLength(3);
      expect(statusData.data.channels.map((c: any) => c.type)).toEqual(
        expect.arrayContaining(['email', 'push', 'in-app'])
      );
    });

    it('should handle bulk notification operations', async () => {
      // Create multiple notifications
      const notifications = Array.from({ length: 5 }, (_, i) => ({
        title: `Bulk Notification ${i + 1}`,
        message: `This is bulk notification number ${i + 1}`,
        recipientId: testUser.getId().getValue(),
        type: 'info',
        priority: 'low',
        organizationId: testOrganization.id,
      }));

      const createPromises = notifications.map(notification =>
        fetch('/api/notifications', {
          method: 'POST',
          body: JSON.stringify(notification),
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': testUser.getId().getValue(),
            'x-organization-id': testOrganization.id,
          },
        })
      );

      const createResponses = await Promise.all(createPromises);
      
      // Verify all notifications were created
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      const createDataPromises = createResponses.map(response => response.json());
      const createDataResults = await Promise.all(createDataPromises);
      
      const notificationIds = createDataResults.map(data => data.data.id);

      // Bulk mark as read
      const bulkReadRequest = new NextRequest('http://localhost/api/notifications/bulk/read', {
        method: 'PUT',
        body: JSON.stringify({
          notificationIds,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const bulkReadResponse = await fetch('/api/notifications/bulk/read', {
        method: 'PUT',
        body: bulkReadRequest.body,
        headers: Object.fromEntries(bulkReadRequest.headers.entries()),
      });

      expect(bulkReadResponse.status).toBe(200);
      const bulkReadData = await bulkReadResponse.json();
      expect(bulkReadData.success).toBe(true);
      expect(bulkReadData.data.updated).toBe(5);

      // Verify all notifications are marked as read
      const getResponse = await fetch('/api/notifications?page=1&limit=10', {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
          'x-organization-id': testOrganization.id,
        },
      });

      const getData = await getResponse.json();
      expect(getData.data.items).toHaveLength(5);
      getData.data.items.forEach((notification: any) => {
        expect(notification.readAt).not.toBeNull();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid recipient ID gracefully', async () => {
      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Invalid Recipient Test',
          message: 'This should fail due to invalid recipient',
          recipientId: 'invalid-user-id',
          type: 'info',
          priority: 'medium',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      expect(createResponse.status).toBe(400);
      const createData = await createResponse.json();
      expect(createData.success).toBe(false);
      expect(createData.error).toContain('Recipient not found');
    });

    it('should handle unauthorized access attempts', async () => {
      // Create notification as one user
      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Unauthorized Test',
          message: 'This notification belongs to another user',
          recipientId: testUser.getId().getValue(),
          type: 'info',
          priority: 'medium',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      const createData = await createResponse.json();
      const notificationId = createData.data.id;

      // Try to access as different user
      const otherUser = UserFactory.create();
      const unauthorizedRequest = new NextRequest(
        `http://localhost/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': otherUser.getId().getValue(),
          },
        }
      );

      const unauthorizedResponse = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: Object.fromEntries(unauthorizedRequest.headers.entries()),
      });

      expect(unauthorizedResponse.status).toBe(403);
      const unauthorizedData = await unauthorizedResponse.json();
      expect(unauthorizedData.success).toBe(false);
      expect(unauthorizedData.error).toContain('Access denied');
    });

    it('should handle database connection failures', async () => {
      // Simulate database connection failure
      await simulateDatabaseFailure();

      const createRequest = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Database Failure Test',
          message: 'This should fail due to database issues',
          recipientId: testUser.getId().getValue(),
          type: 'info',
          priority: 'medium',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: createRequest.body,
        headers: Object.fromEntries(createRequest.headers.entries()),
      });

      expect(createResponse.status).toBe(500);
      const createData = await createResponse.json();
      expect(createData.success).toBe(false);
      expect(createData.error).toBe('Internal server error');

      // Restore database connection
      await restoreDatabaseConnection();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume notification creation', async () => {
      const notificationCount = 100;
      const notifications = Array.from({ length: notificationCount }, (_, i) => ({
        title: `Performance Test Notification ${i + 1}`,
        message: `This is performance test notification number ${i + 1}`,
        recipientId: testUser.getId().getValue(),
        type: 'info',
        priority: 'low',
      }));

      const startTime = Date.now();

      const createPromises = notifications.map(notification =>
        fetch('/api/notifications', {
          method: 'POST',
          body: JSON.stringify(notification),
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': testUser.getId().getValue(),
          },
        })
      );

      const createResponses = await Promise.all(createPromises);
      const endTime = Date.now();

      // Verify all notifications were created successfully
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance assertion - should complete within reasonable time
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10 seconds for 100 notifications

      // Verify all notifications are retrievable
      const getResponse = await fetch(`/api/notifications?page=1&limit=${notificationCount}`, {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const getData = await getResponse.json();
      expect(getData.data.items).toHaveLength(notificationCount);
      expect(getData.data.total).toBe(notificationCount);
    });

    it('should handle concurrent user operations', async () => {
      const userCount = 10;
      const users = Array.from({ length: userCount }, () => UserFactory.create());

      // Create notifications for multiple users concurrently
      const createPromises = users.map(user =>
        fetch('/api/notifications', {
          method: 'POST',
          body: JSON.stringify({
            title: `Concurrent Test for ${user.getName()}`,
            message: 'Testing concurrent operations',
            recipientId: user.getId().getValue(),
            type: 'info',
            priority: 'medium',
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.getId().getValue(),
          },
        })
      );

      const startTime = Date.now();
      const createResponses = await Promise.all(createPromises);
      const endTime = Date.now();

      // Verify all operations succeeded
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance assertion
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // 5 seconds for 10 concurrent operations

      // Verify each user can retrieve their notification
      const getPromises = users.map(user =>
        fetch('/api/notifications?page=1&limit=10', {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        })
      );

      const getResponses = await Promise.all(getPromises);
      
      getResponses.forEach(async (response, index) => {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.items).toHaveLength(1);
        expect(data.data.items[0].recipientId).toBe(users[index].getId().getValue());
      });
    });
  });

  describe('Data Consistency and Transactions', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      // Create a notification
      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Consistency Test',
          message: 'Testing data consistency',
          recipientId: testUser.getId().getValue(),
          type: 'info',
          priority: 'medium',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const createData = await createResponse.json();
      const notificationId = createData.data.id;

      // Perform concurrent read and update operations
      const operations = [
        // Multiple read operations
        ...Array.from({ length: 5 }, () =>
          fetch(`/api/notifications/${notificationId}`, {
            method: 'GET',
            headers: {
              'x-user-id': testUser.getId().getValue(),
            },
          })
        ),
        // Mark as read operation
        fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            'x-user-id': testUser.getId().getValue(),
          },
        }),
      ];

      const responses = await Promise.all(operations);

      // Verify all operations completed successfully
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });

      // Verify final state is consistent
      const finalResponse = await fetch(`/api/notifications/${notificationId}`, {
        method: 'GET',
        headers: {
          'x-user-id': testUser.getId().getValue(),
        },
      });

      const finalData = await finalResponse.json();
      expect(finalData.data.readAt).not.toBeNull();
    });
  });
});

// Helper functions for test setup and cleanup
async function setupTestDatabase() {
  // Initialize test database connection
  // Setup test data isolation
  // Configure test environment
}

async function cleanupTestDatabase() {
  // Close database connections
  // Clean up test data
  // Reset test environment
}

async function clearTestData() {
  // Clear notifications table
  // Reset auto-increment counters
  // Clear related test data
}

async function simulateDatabaseFailure() {
  // Mock database connection failure
  // This would typically involve mocking the database client
}

async function restoreDatabaseConnection() {
  // Restore normal database operations
  // Clear any failure mocks
}

// Custom Jest matchers
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});