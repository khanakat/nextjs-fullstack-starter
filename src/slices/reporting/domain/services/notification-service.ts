/**
 * Interface for notification services in the reporting domain
 */
export interface INotificationService {
  /**
   * Send notification when a report is ready
   */
  sendReportReadyNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    recipientName?: string
  ): Promise<void>;

  /**
   * Send notification for scheduled reports
   */
  sendScheduledReportNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    scheduleName: string,
    recipientName?: string
  ): Promise<void>;

  /**
   * Send notification when report generation fails
   */
  sendReportFailureNotification(
    recipientEmail: string,
    reportTitle: string,
    errorMessage: string,
    recipientName?: string
  ): Promise<void>;

  /**
   * Send notification when a report is shared
   */
  sendReportSharedNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    sharedByName: string,
    recipientName?: string,
    message?: string
  ): Promise<void>;

  /**
   * Send bulk notifications to multiple recipients
   */
  sendBulkNotification(
    recipients: string[],
    subject: string,
    content: string
  ): Promise<void>;
}