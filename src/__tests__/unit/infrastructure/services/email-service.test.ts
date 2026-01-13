import { EmailService } from 'src/shared/infrastructure/services/email-service';
import { NotificationFactory } from '../../../factories/notification-factory';
import { UserFactory } from '../../../factories/user-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockEmailProvider: any;
  let mockTemplateEngine: any;
  let mockLogger: any;
  let mockConfig: any;

  beforeEach(() => {
    mockEmailProvider = {
      send: jest.fn(),
      sendBulk: jest.fn(),
      validateEmail: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    mockTemplateEngine = {
      render: jest.fn(),
      compile: jest.fn(),
      registerHelper: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockConfig = {
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      },
      from: {
        name: 'Test App',
        email: 'noreply@example.com',
      },
      templates: {
        path: '/templates',
        cache: true,
      },
      retries: {
        maxAttempts: 3,
        backoffMs: 1000,
      },
    };

    emailService = new EmailService(
      mockEmailProvider,
      mockTemplateEngine,
      mockLogger,
      mockConfig
    );
  });

  describe('Send Single Email', () => {
    it('should send email successfully', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create({
        recipientId: user.getId().getValue(),
      });

      const emailData = {
        to: user.getEmail().getValue(),
        subject: notification.getTitle(),
        template: 'notification',
        data: {
          title: notification.getTitle(),
          message: notification.getMessage(),
          recipientName: user.getName(),
        },
      };

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockResolvedValue({
        messageId: 'msg-123',
        status: 'sent',
      });

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockTemplateEngine.render).toHaveBeenCalledWith('notification', emailData.data);
      expect(mockEmailProvider.send).toHaveBeenCalledWith({
        from: `${mockConfig.from.name} <${mockConfig.from.email}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: '<html>Rendered email</html>',
      });
    });

    it('should handle template rendering errors', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockRejectedValue(new Error('Template not found'));

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to render email template',
        expect.objectContaining({
          template: 'notification',
          error: 'Template not found',
        })
      );
    });

    it('should handle email provider errors', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockRejectedValue(new Error('SMTP connection failed'));

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.objectContaining({
          error: 'SMTP connection failed',
        })
      );
    });

    it('should retry on transient failures', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({
          messageId: 'msg-123',
          status: 'sent',
        });

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockRejectedValue(new Error('Persistent failure'));

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent failure');
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(3); // maxAttempts
    });
  });

  describe('Send Bulk Emails', () => {
    it('should send bulk emails successfully', async () => {
      const users = UserFactory.createMany(5);
      const notifications = users.map(user => 
        NotificationFactory.create({ recipientId: user.getId().getValue() })
      );

      const emailBatch = users.map((user, index) => ({
        to: user.getEmail().getValue(),
        subject: notifications[index].getTitle(),
        html: '<html>Rendered email</html>',
      }));

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.sendBulk.mockResolvedValue({
        sent: 5,
        failed: 0,
        results: emailBatch.map((_, index) => ({
          messageId: `msg-${index}`,
          status: 'sent',
        })),
      });

      const result = await emailService.sendBulkNotificationEmails(notifications, users);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(5);
      expect(result.failed).toBe(0);
      expect(mockEmailProvider.sendBulk).toHaveBeenCalledWith(emailBatch);
    });

    it('should handle partial bulk send failures', async () => {
      const users = UserFactory.createMany(5);
      const notifications = users.map(user => 
        NotificationFactory.create({ recipientId: user.getId().getValue() })
      );

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.sendBulk.mockResolvedValue({
        sent: 3,
        failed: 2,
        results: [
          { messageId: 'msg-1', status: 'sent' },
          { messageId: 'msg-2', status: 'sent' },
          { messageId: 'msg-3', status: 'sent' },
          { error: 'Invalid email address', status: 'failed' },
          { error: 'Recipient blocked', status: 'failed' },
        ],
      });

      const result = await emailService.sendBulkNotificationEmails(notifications, users);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle bulk send complete failure', async () => {
      const users = UserFactory.createMany(3);
      const notifications = users.map(user => 
        NotificationFactory.create({ recipientId: user.getId().getValue() })
      );

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.sendBulk.mockRejectedValue(new Error('Bulk send failed'));

      const result = await emailService.sendBulkNotificationEmails(notifications, users);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bulk send failed');
    });
  });

  describe('Email Validation', () => {
    it('should validate email addresses', async () => {
      const email = ValueObjectFactory.createEmail();
      mockEmailProvider.validateEmail.mockResolvedValue({
        valid: true,
        reason: 'Valid email format',
      });

      const result = await emailService.validateEmail(email.getValue());

      expect(result.valid).toBe(true);
      expect(mockEmailProvider.validateEmail).toHaveBeenCalledWith(email.getValue());
    });

    it('should handle invalid email addresses', async () => {
      const invalidEmail = 'invalid-email';
      mockEmailProvider.validateEmail.mockResolvedValue({
        valid: false,
        reason: 'Invalid email format',
      });

      const result = await emailService.validateEmail(invalidEmail);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid email format');
    });

    it('should validate multiple email addresses', async () => {
      const emails = ['valid@example.com', 'invalid-email', 'another@example.com'];
      mockEmailProvider.validateEmail
        .mockResolvedValueOnce({ valid: true, reason: 'Valid' })
        .mockResolvedValueOnce({ valid: false, reason: 'Invalid format' })
        .mockResolvedValueOnce({ valid: true, reason: 'Valid' });

      const results = await emailService.validateMultipleEmails(emails);

      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should compile and cache templates', async () => {
      const templateName = 'welcome';
      const templateContent = '<h1>Welcome {{name}}!</h1>';

      mockTemplateEngine.compile.mockResolvedValue({
        render: jest.fn().mockReturnValue('<h1>Welcome John!</h1>'),
      });

      await emailService.compileTemplate(templateName, templateContent);

      expect(mockTemplateEngine.compile).toHaveBeenCalledWith(templateContent);
    });

    it('should render templates with data', async () => {
      const templateName = 'notification';
      const data = {
        title: 'Test Notification',
        message: 'This is a test message',
        recipientName: 'John Doe',
      };

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered content</html>');

      const result = await emailService.renderTemplate(templateName, data);

      expect(result).toBe('<html>Rendered content</html>');
      expect(mockTemplateEngine.render).toHaveBeenCalledWith(templateName, data);
    });

    it('should handle template rendering errors gracefully', async () => {
      const templateName = 'nonexistent';
      const data = {};

      mockTemplateEngine.render.mockRejectedValue(new Error('Template not found'));

      await expect(emailService.renderTemplate(templateName, data))
        .rejects.toThrow('Template not found');
    });
  });

  describe('Delivery Status Tracking', () => {
    it('should track email delivery status', async () => {
      const messageId = 'msg-123';
      mockEmailProvider.getDeliveryStatus.mockResolvedValue({
        messageId,
        status: 'delivered',
        deliveredAt: new Date(),
        events: [
          { type: 'sent', timestamp: new Date() },
          { type: 'delivered', timestamp: new Date() },
        ],
      });

      const result = await emailService.getDeliveryStatus(messageId);

      expect(result.status).toBe('delivered');
      expect(result.events).toHaveLength(2);
      expect(mockEmailProvider.getDeliveryStatus).toHaveBeenCalledWith(messageId);
    });

    it('should handle delivery status errors', async () => {
      const messageId = 'invalid-msg';
      mockEmailProvider.getDeliveryStatus.mockRejectedValue(
        new Error('Message not found')
      );

      await expect(emailService.getDeliveryStatus(messageId))
        .rejects.toThrow('Message not found');
    });
  });

  describe('Configuration and Setup', () => {
    it('should initialize with correct configuration', () => {
      expect(emailService.getConfig()).toEqual(mockConfig);
    });

    it('should validate SMTP configuration', async () => {
      mockEmailProvider.testConnection = jest.fn().mockResolvedValue(true);

      const isValid = await emailService.testConnection();

      expect(isValid).toBe(true);
      expect(mockEmailProvider.testConnection).toHaveBeenCalled();
    });

    it('should handle SMTP connection failures', async () => {
      mockEmailProvider.testConnection = jest.fn().mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(emailService.testConnection()).rejects.toThrow('Connection refused');
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should handle high volume email sending', async () => {
      const users = UserFactory.createMany(100);
      const notifications = users.map(user => 
        NotificationFactory.create({ recipientId: user.getId().getValue() })
      );

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.sendBulk.mockResolvedValue({
        sent: 100,
        failed: 0,
        results: Array.from({ length: 100 }, (_, i) => ({
          messageId: `msg-${i}`,
          status: 'sent',
        })),
      });

      const startTime = Date.now();
      const result = await emailService.sendBulkNotificationEmails(notifications, users);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.sent).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respect rate limits', async () => {
      const rateLimitedService = new EmailService(
        mockEmailProvider,
        mockTemplateEngine,
        mockLogger,
        { ...mockConfig, rateLimit: { maxPerSecond: 10 } }
      );

      const users = UserFactory.createMany(25);
      const notifications = users.map(user => 
        NotificationFactory.create({ recipientId: user.getId().getValue() })
      );

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockResolvedValue({
        messageId: 'msg-123',
        status: 'sent',
      });

      const startTime = Date.now();
      
      // Send emails individually to test rate limiting
      for (let i = 0; i < 25; i++) {
        await rateLimitedService.sendNotificationEmail(notifications[i], users[i]);
      }
      
      const endTime = Date.now();

      // Should take at least 2.5 seconds due to rate limiting (25 emails / 10 per second)
      expect(endTime - startTime).toBeGreaterThan(2000);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockRejectedValue(new Error('Network timeout'));

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle provider service unavailable', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockRejectedValue(new Error('Service unavailable'));

      const result = await emailService.sendNotificationEmail(notification, user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });

    it('should fallback to alternative provider on failure', async () => {
      const mockFallbackProvider = {
        send: jest.fn().mockResolvedValue({
          messageId: 'fallback-msg-123',
          status: 'sent',
        }),
      };

      const serviceWithFallback = new EmailService(
        mockEmailProvider,
        mockTemplateEngine,
        mockLogger,
        { ...mockConfig, fallbackProvider: mockFallbackProvider }
      );

      const user = UserFactory.create();
      const notification = NotificationFactory.create();

      mockTemplateEngine.render.mockResolvedValue('<html>Rendered email</html>');
      mockEmailProvider.send.mockRejectedValue(new Error('Primary provider failed'));

      const result = await serviceWithFallback.sendNotificationEmail(notification, user);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('fallback-msg-123');
      expect(mockFallbackProvider.send).toHaveBeenCalled();
    });
  });
});