/**
 * Email Templates Registry
 * Registers all email templates with the template manager
 */

import { templateManager } from './template-manager';
import { welcomeTemplate } from './welcome';
import { passwordResetTemplate } from './password-reset';
import { reportNotificationTemplate } from './report-notification';
import { systemAlertTemplate } from './system-alert';

// Register all templates
export function initializeEmailTemplates(): void {
  templateManager.registerTemplate(welcomeTemplate.name, welcomeTemplate.html);
  templateManager.registerTemplate(passwordResetTemplate.name, passwordResetTemplate.html);
  templateManager.registerTemplate(reportNotificationTemplate.name, reportNotificationTemplate.html);
  templateManager.registerTemplate(systemAlertTemplate.name, systemAlertTemplate.html);

  console.log('[EmailTemplates] All templates registered successfully');
}

// Export templates for direct access if needed
export {
  welcomeTemplate,
  passwordResetTemplate,
  reportNotificationTemplate,
  systemAlertTemplate,
};

// Export template manager
export { templateManager } from './template-manager';

// Template helper functions
export const EmailTemplates = {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(emailService: any, userData: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const templateData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    const renderedHtml = templateManager.render('welcome', templateData);
    const renderedSubject = welcomeTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = templateData[key as keyof typeof templateData];
      return value !== undefined ? String(value) : match;
    });
    
    return await emailService.sendEmail({
      to: { email: userData.email, name: userData.firstName },
      subject: renderedSubject,
      html: renderedHtml,
      text: welcomeTemplate.text || '',
      tags: ['welcome', 'onboarding'],
    });
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(emailService: any, userData: {
    firstName: string;
    email: string;
    resetUrl: string;
    expiresIn?: string;
  }) {
    const templateData = {
      firstName: userData.firstName,
      email: userData.email,
      resetUrl: userData.resetUrl,
      expiresIn: userData.expiresIn || '1 hour',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    const renderedHtml = templateManager.render('password-reset', templateData);
    const renderedSubject = passwordResetTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = templateData[key as keyof typeof templateData];
      return value !== undefined ? String(value) : match;
    });
    
    return await emailService.sendEmail({
      to: { email: userData.email, name: userData.firstName },
      subject: renderedSubject,
      html: renderedHtml,
      text: passwordResetTemplate.text || '',
      tags: ['password-reset', 'security'],
    });
  },

  /**
   * Send report notification email
   */
  async sendReportNotificationEmail(emailService: any, reportData: {
    firstName: string;
    email: string;
    reportName: string;
    reportType: string;
    downloadUrl: string;
    generatedAt: Date;
    expiresAt: Date;
    reportDescription?: string;
    fileSize?: string;
  }) {
    const templateData = {
      firstName: reportData.firstName,
      reportName: reportData.reportName,
      reportType: reportData.reportType,
      downloadUrl: reportData.downloadUrl,
      generatedAt: reportData.generatedAt,
      expiresAt: reportData.expiresAt,
      reportDescription: reportData.reportDescription,
      fileSize: reportData.fileSize,
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    const renderedHtml = templateManager.render('report-notification', templateData);
    const renderedSubject = reportNotificationTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = templateData[key as keyof typeof templateData];
      return value !== undefined ? String(value) : match;
    });
    
    return await emailService.sendEmail({
      to: { email: reportData.email, name: reportData.firstName },
      subject: renderedSubject,
      html: renderedHtml,
      text: reportNotificationTemplate.text || '',
      tags: ['report', 'notification'],
    });
  },

  /**
   * Send system alert email
   */
  async sendSystemAlertEmail(emailService: any, alertData: {
    firstName: string;
    email: string;
    alertType: string;
    alertTitle: string;
    alertMessage: string;
    severity: 'info' | 'warning' | 'high' | 'critical' | 'success';
    timestamp: Date;
    actionRequired?: string;
    actionUrl?: string;
  }) {
    const templateData = {
      firstName: alertData.firstName,
      alertType: alertData.alertType,
      alertTitle: alertData.alertTitle,
      alertMessage: alertData.alertMessage,
      severity: alertData.severity,
      timestamp: alertData.timestamp,
      actionRequired: alertData.actionRequired,
      actionUrl: alertData.actionUrl,
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    const renderedHtml = templateManager.render('system-alert', templateData);
    const renderedSubject = systemAlertTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = templateData[key as keyof typeof templateData];
      return value !== undefined ? String(value) : match;
    });
    
    return await emailService.sendEmail({
      to: { email: alertData.email, name: alertData.firstName },
      subject: renderedSubject,
      html: renderedHtml,
      text: systemAlertTemplate.text || '',
      tags: ['system', 'alert'],
      priority: 'high',
    });
  },
};

// Auto-initialize templates when module is imported
initializeEmailTemplates();