type EmailProvider = {
  send: (payload: { from: string; to: string; subject: string; html: string }) => Promise<{ messageId: string; status: string }>;
  sendBulk: (batch: Array<{ to: string; subject: string; html: string }>) => Promise<{ sent: number; failed: number; results: Array<{ messageId?: string; status: string; error?: string }> }>;
  validateEmail: (email: string) => Promise<{ valid: boolean; reason?: string }>;
  getDeliveryStatus: (messageId: string) => Promise<{ messageId: string; status: string; deliveredAt?: Date; events?: Array<{ type: string; timestamp: Date }> }>;
  testConnection?: () => Promise<boolean>;
};

type TemplateEngine = {
  render: (templateName: string, data: any) => Promise<string>;
  compile: (content: string) => Promise<{ render: (data?: any) => string }>;
  registerHelper?: (name: string, fn: Function) => void;
};

type Logger = {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
  debug?: (...args: any[]) => void;
};

type EmailServiceConfig = {
  smtp?: any;
  from: { name: string; email: string };
  templates?: { path?: string; cache?: boolean };
  retries?: { maxAttempts: number; backoffMs: number };
  rateLimit?: { maxPerSecond: number };
  fallbackProvider?: { send: (payload: { from: string; to: string; subject: string; html: string }) => Promise<{ messageId: string; status: string }> };
};

export class EmailService {
  private readonly provider: EmailProvider;
  private readonly templateEngine: TemplateEngine;
  private readonly logger: Logger;
  private readonly config: EmailServiceConfig;
  private lastSendAt?: number;

  constructor(provider: EmailProvider, templateEngine: TemplateEngine, logger: Logger, config: EmailServiceConfig) {
    this.provider = provider;
    this.templateEngine = templateEngine;
    this.logger = logger;
    this.config = config;
  }

  public getConfig(): EmailServiceConfig {
    return this.config;
  }

  public async testConnection(): Promise<boolean> {
    if (typeof this.provider.testConnection === 'function') {
      return this.provider.testConnection();
    }
    // Assume OK if provider doesn't support explicit testing
    return true;
  }

  private async applyRateLimit(): Promise<void> {
    const rate = this.config.rateLimit?.maxPerSecond;
    if (!rate || rate <= 0) return;
    const minIntervalMs = 1000 / rate;
    const now = Date.now();
    if (this.lastSendAt) {
      const elapsed = now - this.lastSendAt;
      if (elapsed < minIntervalMs) {
        await new Promise(res => setTimeout(res, minIntervalMs - elapsed));
      }
    }
    this.lastSendAt = Date.now();
  }

  private getFromHeader(): string {
    return `${this.config.from.name} <${this.config.from.email}>`;
  }

  public async sendNotificationEmail(notification: any, user: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    await this.applyRateLimit();

    const emailData = {
      to: user.getEmail().getValue?.() ?? user.getEmail(),
      subject: notification.getTitle?.() ?? notification.title ?? 'Notification',
      template: 'notification',
      data: {
        title: notification.getTitle?.() ?? notification.title,
        message: notification.getMessage?.() ?? notification.message,
        recipientName: user.getName?.() ?? user.name,
      },
    };

    try {
      const html = await this.templateEngine.render(emailData.template, emailData.data);

      const payload = {
        from: this.getFromHeader(),
        to: emailData.to,
        subject: emailData.subject,
        html,
      };

      const attempts = Math.max(1, this.config.retries?.maxAttempts ?? 1);
      const backoffMs = Math.max(0, this.config.retries?.backoffMs ?? 0);
      let lastError: Error | undefined;

      for (let i = 0; i < attempts; i++) {
        try {
          const result = await this.provider.send(payload);
          return { success: true, messageId: result.messageId };
        } catch (err) {
          lastError = err as Error;
          if (i < attempts - 1) {
            await new Promise(res => setTimeout(res, backoffMs));
          }
        }
      }

      // Fallback provider if configured
      if (this.config.fallbackProvider) {
        try {
          const result = await this.config.fallbackProvider.send(payload);
          return { success: true, messageId: result.messageId };
        } catch (err) {
          lastError = err as Error;
        }
      }

      this.logger.error('Failed to send email', { error: lastError?.message });
      return { success: false, error: lastError?.message ?? 'Unknown error' };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error('Failed to render email template', { template: emailData.template, error: message });
      return { success: false, error: message };
    }
  }

  public async sendBulkNotificationEmails(notifications: any[], users: any[]): Promise<{ success: boolean; sent: number; failed: number; errors?: string[]; error?: string }> {
    await this.applyRateLimit();
    try {
      const html = await this.templateEngine.render('notification', {});
      const batch = users.map((user, index) => ({
        to: user.getEmail().getValue?.() ?? user.getEmail(),
        subject: notifications[index]?.getTitle?.() ?? notifications[index]?.title ?? 'Notification',
        html,
      }));

      const res = await this.provider.sendBulk(batch);
      const errors = res.results.filter(r => r.status === 'failed' && r.error).map(r => r.error!) as string[];

      return { success: true, sent: res.sent, failed: res.failed, errors };
    } catch (err) {
      return { success: false, sent: 0, failed: users.length, error: (err as Error).message };
    }
  }

  public async validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    return this.provider.validateEmail(email);
  }

  public async validateMultipleEmails(emails: string[]): Promise<Array<{ valid: boolean; reason?: string }>> {
    const results: Array<{ valid: boolean; reason?: string }> = [];
    for (const email of emails) {
      results.push(await this.validateEmail(email));
    }
    return results;
  }

  public async compileTemplate(templateName: string, content: string): Promise<void> {
    await this.templateEngine.compile(content);
  }

  public async renderTemplate(templateName: string, data: any): Promise<string> {
    return this.templateEngine.render(templateName, data);
  }

  public async getDeliveryStatus(messageId: string): Promise<{ messageId: string; status: string; deliveredAt?: Date; events?: Array<{ type: string; timestamp: Date }> }> {
    return this.provider.getDeliveryStatus(messageId);
  }
}