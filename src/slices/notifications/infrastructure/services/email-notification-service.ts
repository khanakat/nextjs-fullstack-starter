import { injectable } from 'inversify';
import { Notification } from '../../../../shared/domain/notifications/entities/notification';
import { NotificationPreferences } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailNotificationConfig {
  from: string;
  replyTo?: string;
  baseUrl: string;
  templates: {
    notification: EmailTemplate;
    digest: EmailTemplate;
  };
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<void>;
  sendBulkEmails(emails: Array<{ to: string; subject: string; html: string; text?: string }>): Promise<void>;
}

@injectable()
export class EmailNotificationService {
  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly config: EmailNotificationConfig
  ) {}

  /**
   * Send individual notification via email
   */
  async sendNotification(
    notification: Notification,
    userEmail: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Check if email channel is enabled for this notification
    const emailChannel = notification.channels.find(c => c.type === ChannelType.EMAIL);
    if (!emailChannel || !emailChannel.enabled) {
      return;
    }

    // Check if user has email notifications enabled for this category
    const categoryPref = preferences.categoryPreferences.find(p => p.category === notification.category);
    if (categoryPref && !categoryPref.channels.includes(ChannelType.EMAIL)) {
      return;
    }

    // Check if we're in quiet hours
    if (this.isInQuietHours(preferences)) {
      return;
    }

    const template = this.generateNotificationTemplate(notification, preferences);
    
    await this.emailProvider.sendEmail(
      userEmail,
      template.subject,
      template.html,
      template.text
    );
  }

  /**
   * Send digest email with multiple notifications
   */
  async sendDigestEmail(
    userEmail: string,
    notifications: Notification[],
    preferences: NotificationPreferences,
    digestType: 'daily' | 'weekly'
  ): Promise<void> {
    if (notifications.length === 0) {
      return;
    }

    const template = this.generateDigestTemplate(notifications, preferences, digestType);
    
    await this.emailProvider.sendEmail(
      userEmail,
      template.subject,
      template.html,
      template.text
    );
  }

  /**
   * Send bulk digest emails
   */
  async sendBulkDigestEmails(
    digests: Array<{
      userEmail: string;
      notifications: Notification[];
      preferences: NotificationPreferences;
      digestType: 'daily' | 'weekly';
    }>
  ): Promise<void> {
    const emails = digests.map(digest => {
      const template = this.generateDigestTemplate(
        digest.notifications,
        digest.preferences,
        digest.digestType
      );
      
      return {
        to: digest.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };
    });

    await this.emailProvider.sendBulkEmails(emails);
  }

  private generateNotificationTemplate(
    notification: Notification,
    preferences: NotificationPreferences
  ): EmailTemplate {
    const baseTemplate = this.config.templates.notification;
    
    const actionButton = notification.actionUrl ? `
      <div style="margin: 20px 0; text-align: center;">
        <a href="${notification.actionUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Details
        </a>
      </div>
    ` : '';

    const priorityColor = this.getPriorityColor(notification.priority);
    const categoryIcon = this.getCategoryIcon(notification.category);

    const html = baseTemplate.html
      .replace('{{title}}', notification.title)
      .replace('{{message}}', notification.message)
      .replace('{{category}}', notification.category)
      .replace('{{categoryIcon}}', categoryIcon)
      .replace('{{priority}}', notification.priority)
      .replace('{{priorityColor}}', priorityColor)
      .replace('{{actionButton}}', actionButton)
      .replace('{{baseUrl}}', this.config.baseUrl)
      .replace('{{unsubscribeUrl}}', `${this.config.baseUrl}/notifications/preferences`)
      .replace('{{createdAt}}', notification.createdAt.toLocaleDateString(preferences.language));

    const text = baseTemplate.text
      .replace('{{title}}', notification.title)
      .replace('{{message}}', notification.message)
      .replace('{{category}}', notification.category)
      .replace('{{priority}}', notification.priority)
      .replace('{{actionUrl}}', notification.actionUrl || '')
      .replace('{{baseUrl}}', this.config.baseUrl)
      .replace('{{createdAt}}', notification.createdAt.toLocaleDateString(preferences.language));

    const subject = baseTemplate.subject
      .replace('{{title}}', notification.title)
      .replace('{{category}}', notification.category);

    return { subject, html, text };
  }

  private generateDigestTemplate(
    notifications: Notification[],
    preferences: NotificationPreferences,
    digestType: 'daily' | 'weekly'
  ): EmailTemplate {
    const baseTemplate = this.config.templates.digest;
    
    const notificationsList = notifications.map(notification => {
      const priorityColor = this.getPriorityColor(notification.priority);
      const categoryIcon = this.getCategoryIcon(notification.category);
      
      return `
        <div style="border-left: 4px solid ${priorityColor}; padding: 16px; margin: 12px 0; background-color: #f8f9fa;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px;">${categoryIcon}</span>
            <strong>${notification.title}</strong>
            <span style="margin-left: auto; font-size: 12px; color: #666;">
              ${notification.createdAt.toLocaleDateString(preferences.language)}
            </span>
          </div>
          <p style="margin: 8px 0; color: #333;">${notification.message}</p>
          ${notification.actionUrl ? `
            <a href="${notification.actionUrl}" style="color: #007bff; text-decoration: none;">
              View Details →
            </a>
          ` : ''}
        </div>
      `;
    }).join('');

    const notificationsText = notifications.map(notification => `
      ${notification.title}
      ${notification.message}
      Category: ${notification.category}
      Priority: ${notification.priority}
      Created: ${notification.createdAt.toLocaleDateString(preferences.language)}
      ${notification.actionUrl ? `Link: ${notification.actionUrl}` : ''}
      ---
    `).join('\n');

    const html = baseTemplate.html
      .replace('{{digestType}}', digestType)
      .replace('{{notificationCount}}', notifications.length.toString())
      .replace('{{notificationsList}}', notificationsList)
      .replace('{{baseUrl}}', this.config.baseUrl)
      .replace('{{unsubscribeUrl}}', `${this.config.baseUrl}/notifications/preferences`);

    const text = baseTemplate.text
      .replace('{{digestType}}', digestType)
      .replace('{{notificationCount}}', notifications.length.toString())
      .replace('{{notificationsList}}', notificationsText)
      .replace('{{baseUrl}}', this.config.baseUrl);

    const subject = baseTemplate.subject
      .replace('{{digestType}}', digestType)
      .replace('{{notificationCount}}', notifications.length.toString());

    return { subject, html, text };
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) {
      return false;
    }

    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: preferences.quietHours.timezone }));
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  private getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'billing': return '💳';
      case 'user_activity': return '👤';
      case 'marketing': return '📢';
      case 'product_update': return '🚀';
      case 'reminder': return '⏰';
      default: return '📢';
    }
  }
}