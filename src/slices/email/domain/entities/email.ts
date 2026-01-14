/**
 * Email Entity
 * Represents an email in the domain layer
 */

export enum EmailStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BOUNCED = 'bounced',
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EmailType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  NEWSLETTER = 'newsletter',
  SYSTEM = 'system',
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
}

export interface EmailMetadata {
  campaign?: string;
  source?: string;
  tags?: string[];
  [key: string]: any;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  status?: EmailStatus;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bounced?: boolean;
  complained?: boolean;
}

export class Email {
  id: string;
  organizationId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  status: EmailStatus;
  type: EmailType;
  priority: EmailPriority;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  tags?: string[];
  metadata?: EmailMetadata;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  recipients?: EmailRecipient[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    organizationId: string;
    subject: string;
    htmlContent: string;
    from: EmailAddress;
    to: EmailAddress | EmailAddress[];
    status: EmailStatus;
    type: EmailType;
    priority: EmailPriority;
    createdBy: string;
    textContent?: string;
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    templateId?: string;
    templateData?: Record<string, any>;
    attachments?: EmailAttachment[];
    tags?: string[];
    metadata?: EmailMetadata;
    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
    bounceReason?: string;
    recipients?: EmailRecipient[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.subject = props.subject;
    this.htmlContent = props.htmlContent;
    this.textContent = props.textContent;
    this.from = props.from;
    this.to = props.to;
    this.cc = props.cc;
    this.bcc = props.bcc;
    this.status = props.status;
    this.type = props.type;
    this.priority = props.priority;
    this.templateId = props.templateId;
    this.templateData = props.templateData;
    this.attachments = props.attachments;
    this.tags = props.tags;
    this.metadata = props.metadata;
    this.scheduledAt = props.scheduledAt;
    this.sentAt = props.sentAt;
    this.deliveredAt = props.deliveredAt;
    this.openedAt = props.openedAt;
    this.clickedAt = props.clickedAt;
    this.bouncedAt = props.bouncedAt;
    this.bounceReason = props.bounceReason;
    this.recipients = props.recipients;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  canTransitionTo(newStatus: EmailStatus): boolean {
    const validTransitions: Record<EmailStatus, EmailStatus[]> = {
      [EmailStatus.DRAFT]: [EmailStatus.SCHEDULED, EmailStatus.SENDING, EmailStatus.CANCELLED],
      [EmailStatus.SCHEDULED]: [EmailStatus.SENDING, EmailStatus.CANCELLED, EmailStatus.DRAFT],
      [EmailStatus.SENDING]: [EmailStatus.SENT, EmailStatus.FAILED],
      [EmailStatus.SENT]: [EmailStatus.DELIVERED, EmailStatus.BOUNCED],
      [EmailStatus.DELIVERED]: [],
      [EmailStatus.FAILED]: [EmailStatus.SCHEDULED, EmailStatus.DRAFT],
      [EmailStatus.CANCELLED]: [EmailStatus.SCHEDULED, EmailStatus.DRAFT],
      [EmailStatus.BOUNCED]: [],
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  transitionTo(newStatus: EmailStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    this.updatedAt = new Date();

    // Set timestamp based on status
    switch (newStatus) {
      case EmailStatus.SENT:
        this.sentAt = new Date();
        break;
      case EmailStatus.DELIVERED:
        this.deliveredAt = new Date();
        break;
      case EmailStatus.BOUNCED:
        this.bouncedAt = new Date();
        break;
    }
  }

  canBeDeleted(): boolean {
    return [EmailStatus.DRAFT, EmailStatus.CANCELLED, EmailStatus.FAILED].includes(this.status);
  }

  toObject() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      subject: this.subject,
      htmlContent: this.htmlContent,
      textContent: this.textContent,
      from: this.from,
      to: this.to,
      cc: this.cc,
      bcc: this.bcc,
      status: this.status,
      type: this.type,
      priority: this.priority,
      templateId: this.templateId,
      templateData: this.templateData,
      attachments: this.attachments,
      tags: this.tags,
      metadata: this.metadata,
      scheduledAt: this.scheduledAt?.toISOString(),
      sentAt: this.sentAt?.toISOString(),
      deliveredAt: this.deliveredAt?.toISOString(),
      openedAt: this.openedAt?.toISOString(),
      clickedAt: this.clickedAt?.toISOString(),
      bouncedAt: this.bouncedAt?.toISOString(),
      bounceReason: this.bounceReason,
      recipients: this.recipients,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
