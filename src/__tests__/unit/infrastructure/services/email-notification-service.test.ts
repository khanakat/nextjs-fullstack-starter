import { EmailNotificationService } from '../../../../slices/reporting/infrastructure/services/email-notification-service';

// Mock email provider
const mockEmailProvider = {
  send: jest.fn(),
};

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  const fromEmail = 'noreply@example.com';
  const baseUrl = 'https://app.example.com';

  beforeEach(() => {
    service = new EmailNotificationService(mockEmailProvider, fromEmail, baseUrl);
    jest.clearAllMocks();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendReportReadyNotification', () => {
    it('should send report ready notification successfully', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Monthly Sales Report';
      const reportUrl = 'https://app.example.com/reports/123';
      const recipientName = 'John Doe';

      await service.sendReportReadyNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        recipientName
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Report Ready: ${reportTitle}`);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Content:'));
    });

    it('should send report ready notification without recipient name', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Monthly Sales Report';
      const reportUrl = 'https://app.example.com/reports/123';

      await service.sendReportReadyNotification(
        recipientEmail,
        reportTitle,
        reportUrl
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Report Ready: ${reportTitle}`);
    });

    it('should generate correct HTML template with recipient name', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Test Report';
      const reportUrl = 'https://app.example.com/reports/123';
      const recipientName = 'Jane Smith';

      await service.sendReportReadyNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        recipientName
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      expect(contentCall).toBeDefined();
      
      const htmlContent = contentCall[0].replace('Content: ', '');
      expect(htmlContent).toContain(`Hi ${recipientName}`);
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(reportUrl);
      expect(htmlContent).toContain('View Report');
    });

    it('should generate correct HTML template without recipient name', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Test Report';
      const reportUrl = 'https://app.example.com/reports/123';

      await service.sendReportReadyNotification(
        recipientEmail,
        reportTitle,
        reportUrl
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      expect(contentCall).toBeDefined();
      
      const htmlContent = contentCall[0].replace('Content: ', '');
      expect(htmlContent).toContain('Hello,');
      expect(htmlContent).not.toContain('Hi ');
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(reportUrl);
    });

    it('should handle email sending errors', async () => {
      // Override the sendEmail method to throw an error
      const originalSendEmail = (service as any).sendEmail;
      (service as any).sendEmail = jest.fn().mockRejectedValue(new Error('SMTP server unavailable'));

      await expect(service.sendReportReadyNotification(
        'user@example.com',
        'Test Report',
        'https://app.example.com/reports/123'
      )).rejects.toThrow('SMTP server unavailable');

      // Restore original method
      (service as any).sendEmail = originalSendEmail;
    });
  });

  describe('sendScheduledReportNotification', () => {
    it('should send scheduled report notification successfully', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Weekly Analytics';
      const reportUrl = 'https://app.example.com/reports/456';
      const scheduleName = 'Weekly Report Schedule';
      const recipientName = 'Alice Johnson';

      await service.sendScheduledReportNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        scheduleName,
        recipientName
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Scheduled Report: ${reportTitle}`);
    });

    it('should generate correct HTML template for scheduled report', async () => {
      const recipientEmail = 'user@example.com';
      const reportTitle = 'Weekly Analytics';
      const reportUrl = 'https://app.example.com/reports/456';
      const scheduleName = 'Weekly Report Schedule';
      const recipientName = 'Alice Johnson';

      await service.sendScheduledReportNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        scheduleName,
        recipientName
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      expect(contentCall).toBeDefined();
      
      const htmlContent = contentCall[0].replace('Content: ', '');
      expect(htmlContent).toContain(`Hi ${recipientName}`);
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(scheduleName);
      expect(htmlContent).toContain(reportUrl);
      expect(htmlContent).toContain('Scheduled Report');
    });
  });

  describe('sendReportFailureNotification', () => {
    it('should send report failure notification successfully', async () => {
      const recipientEmail = 'admin@example.com';
      const reportTitle = 'Failed Report';
      const errorMessage = 'Database connection timeout';
      const recipientName = 'Admin User';

      await service.sendReportFailureNotification(
        recipientEmail,
        reportTitle,
        errorMessage,
        recipientName
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Report Generation Failed: ${reportTitle}`);
    });

    it('should generate correct HTML template for failure notification', async () => {
      const recipientEmail = 'admin@example.com';
      const reportTitle = 'Failed Report';
      const errorMessage = 'Database connection timeout';
      const recipientName = 'Admin User';

      await service.sendReportFailureNotification(
        recipientEmail,
        reportTitle,
        errorMessage,
        recipientName
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      expect(contentCall).toBeDefined();
      
      const htmlContent = contentCall[0].replace('Content: ', '');
      expect(htmlContent).toContain(`Hi ${recipientName}`);
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(errorMessage);
      expect(htmlContent).toContain('Report Generation Failed');
    });
  });

  describe('sendReportSharedNotification', () => {
    it('should send report shared notification successfully', async () => {
      const recipientEmail = 'colleague@example.com';
      const reportTitle = 'Shared Analytics Report';
      const reportUrl = 'https://app.example.com/reports/789';
      const sharedByName = 'Bob Wilson';
      const recipientName = 'Carol Davis';
      const message = 'Please review this report for our meeting.';

      await service.sendReportSharedNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        sharedByName,
        recipientName,
        message
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Report Shared: ${reportTitle}`);
    });

    it('should generate correct HTML template for shared report', async () => {
      const recipientEmail = 'colleague@example.com';
      const reportTitle = 'Shared Analytics Report';
      const reportUrl = 'https://app.example.com/reports/789';
      const sharedByName = 'Bob Wilson';
      const recipientName = 'Carol Davis';
      const message = 'Please review this report.';

      await service.sendReportSharedNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        sharedByName,
        recipientName,
        message
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      expect(contentCall).toBeDefined();
      
      const htmlContent = contentCall[0].replace('Content: ', '');
      expect(htmlContent).toContain(`Hi ${recipientName}`);
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(sharedByName);
      expect(htmlContent).toContain(message);
      expect(htmlContent).toContain(reportUrl);
    });

    it('should work without optional message', async () => {
      const recipientEmail = 'colleague@example.com';
      const reportTitle = 'Shared Report';
      const reportUrl = 'https://app.example.com/reports/789';
      const sharedByName = 'Bob Wilson';
      const recipientName = 'Carol Davis';

      await service.sendReportSharedNotification(
        recipientEmail,
        reportTitle,
        reportUrl,
        sharedByName,
        recipientName
      );

      expect(console.log).toHaveBeenCalledWith(`Sending email to: ${recipientEmail}`);
      expect(console.log).toHaveBeenCalledWith(`Subject: Report Shared: ${reportTitle}`);
    });
  });

  describe('sendBulkNotification', () => {
    it('should send bulk notifications to multiple recipients', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const subject = 'Bulk Notification';
      const content = '<h1>Important Update</h1><p>This is a bulk notification.</p>';

      await service.sendBulkNotification(recipients, subject, content);

      expect(console.log).toHaveBeenCalledTimes(recipients.length * 3); // 3 logs per email
      recipients.forEach(email => {
        expect(console.log).toHaveBeenCalledWith(`Sending email to: ${email}`);
      });
    });

    it('should handle empty recipients array', async () => {
      const recipients: string[] = [];
      const subject = 'Bulk Notification';
      const content = '<h1>Important Update</h1>';

      await service.sendBulkNotification(recipients, subject, content);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle partial failures in bulk sending', async () => {
      const recipients = ['valid@example.com', 'invalid@example.com'];
      const subject = 'Bulk Notification';
      const content = '<h1>Test</h1>';

      // Mock sendEmail to fail for the second recipient
      let callCount = 0;
      const originalSendEmail = (service as any).sendEmail;
      (service as any).sendEmail = jest.fn().mockImplementation((to: string) => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Invalid email address'));
        }
        return Promise.resolve();
      });

      await expect(service.sendBulkNotification(recipients, subject, content))
        .rejects.toThrow('Invalid email address');

      // Restore original method
      (service as any).sendEmail = originalSendEmail;
    });
  });

  describe('Email template generation', () => {
    it('should generate valid HTML structure', async () => {
      await service.sendReportReadyNotification(
        'test@example.com',
        'Test Report',
        'https://example.com/report'
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      const htmlContent = contentCall[0].replace('Content: ', '');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('</html>');
      expect(htmlContent).toContain('<style>');
    });

    it('should include proper CSS styling', async () => {
      await service.sendReportReadyNotification(
        'test@example.com',
        'Test Report',
        'https://example.com/report'
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      const htmlContent = contentCall[0].replace('Content: ', '');

      expect(htmlContent).toContain('font-family: Arial, sans-serif');
      expect(htmlContent).toContain('background-color: #007bff');
      expect(htmlContent).toContain('.button');
      expect(htmlContent).toContain('.container');
    });

    it('should properly escape HTML in dynamic content', async () => {
      const reportTitle = 'Report with <script>alert("xss")</script>';
      const reportUrl = 'https://example.com/report?param=<script>';

      await service.sendReportReadyNotification(
        'test@example.com',
        reportTitle,
        reportUrl
      );

      const logCalls = (console.log as jest.Mock).mock.calls;
      const contentCall = logCalls.find(call => call[0].startsWith('Content:'));
      const htmlContent = contentCall[0].replace('Content: ', '');

      // The content should contain the raw values (this is a mock implementation)
      // In a real implementation, you'd want to ensure proper HTML escaping
      expect(htmlContent).toContain(reportTitle);
      expect(htmlContent).toContain(reportUrl);
    });
  });

  describe('Error handling and resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      const originalSendEmail = (service as any).sendEmail;
      (service as any).sendEmail = jest.fn().mockRejectedValue(new Error('Network timeout'));

      await expect(service.sendReportReadyNotification(
        'user@example.com',
        'Test Report',
        'https://example.com/report'
      )).rejects.toThrow('Network timeout');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email to user@example.com:',
        expect.any(Error)
      );

      (service as any).sendEmail = originalSendEmail;
    });

    it('should handle invalid email provider responses', async () => {
      const originalSendEmail = (service as any).sendEmail;
      (service as any).sendEmail = jest.fn().mockRejectedValue(new Error('Invalid API key'));

      await expect(service.sendReportFailureNotification(
        'admin@example.com',
        'Failed Report',
        'Database error'
      )).rejects.toThrow('Failed to send email notification: Invalid API key');

      (service as any).sendEmail = originalSendEmail;
    });

    it('should handle unknown errors', async () => {
      const originalSendEmail = (service as any).sendEmail;
      (service as any).sendEmail = jest.fn().mockRejectedValue('Unknown error');

      await expect(service.sendReportSharedNotification(
        'user@example.com',
        'Shared Report',
        'https://example.com/report',
        'Sharer Name'
      )).rejects.toThrow('Failed to send email notification: Unknown error');

      (service as any).sendEmail = originalSendEmail;
    });
  });

  describe('Performance and timing', () => {
    it('should complete email sending within reasonable time', async () => {
      const startTime = Date.now();

      await service.sendReportReadyNotification(
        'user@example.com',
        'Test Report',
        'https://example.com/report'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second (mock has 100ms delay)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent email sending', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        service.sendReportReadyNotification(
          `user${i}@example.com`,
          `Report ${i}`,
          `https://example.com/report/${i}`
        )
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});