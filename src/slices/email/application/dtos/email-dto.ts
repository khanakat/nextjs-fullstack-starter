/**
 * Email DTOs
 * Data Transfer Objects for email operations
 */

import { EmailStatus, EmailPriority, EmailType } from '../../domain/entities/email';

export interface SendEmailDto {
  to: string | { email: string; name?: string };
  from?: { email: string; name?: string };
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<any>;
  priority?: EmailPriority;
  tags?: string[];
  useQueue?: boolean;
  delay?: number;
}

export interface BulkEmailDto {
  emails: Array<{
    to: string | { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
    priority?: EmailPriority;
  }>;
  batchSize?: number;
  useQueue?: boolean;
  delay?: number;
}

export interface UpdateEmailStatusDto {
  status: EmailStatus;
  scheduledAt?: string;
  cancelReason?: string;
}

export interface EmailListDto {
  name: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  allowSelfSubscribe?: boolean;
  requireDoubleOptIn?: boolean;
  welcomeEmailTemplateId?: string;
  unsubscribeRedirectUrl?: string;
}

export interface EmailTemplateDto {
  name: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  variables?: string[];
  isActive?: boolean;
  description?: string;
}

export interface BulkEmailSendDto {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: string;
  priority?: EmailPriority;
  tags?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailTestDto {
  type: 'welcome' | 'password-reset' | 'email-verification' | 'notification' | 'custom';
  data?: {
    title?: string;
    message?: string;
    subject?: string;
    html?: string;
    text?: string;
    actionUrl?: string;
    actionText?: string;
  };
}

export interface TrackingEventDto {
  emailId: string;
  eventType: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  linkUrl?: string;
}

export interface EmailStatisticsDto {
  page?: number;
  limit?: number;
  type?: string;
}

export interface EmailListQueryDto {
  isPublic?: string;
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
}

export interface EmailTemplateQueryDto {
  category?: string;
  isActive?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface TrackingQueryDto {
  emailId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
