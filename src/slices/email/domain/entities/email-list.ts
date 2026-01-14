/**
 * Email List Entity
 * Represents an email mailing list
 */

export enum EmailListStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export interface EmailListStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  bounced: number;
  lastEmailSent?: Date;
}

export class EmailList {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: EmailListStatus;
  tags?: string[];
  isPublic: boolean;
  allowSelfSubscribe: boolean;
  requireDoubleOptIn: boolean;
  welcomeEmailTemplateId?: string;
  unsubscribeRedirectUrl?: string;
  stats: EmailListStats;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    organizationId: string;
    name: string;
    status: EmailListStatus;
    createdBy: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    allowSelfSubscribe?: boolean;
    requireDoubleOptIn?: boolean;
    welcomeEmailTemplateId?: string;
    unsubscribeRedirectUrl?: string;
    stats?: EmailListStats;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.name = props.name;
    this.description = props.description;
    this.status = props.status;
    this.tags = props.tags;
    this.isPublic = props.isPublic ?? false;
    this.allowSelfSubscribe = props.allowSelfSubscribe ?? true;
    this.requireDoubleOptIn = props.requireDoubleOptIn ?? true;
    this.welcomeEmailTemplateId = props.welcomeEmailTemplateId;
    this.unsubscribeRedirectUrl = props.unsubscribeRedirectUrl;
    this.stats = props.stats ?? {
      totalSubscribers: 0,
      activeSubscribers: 0,
      unsubscribed: 0,
      bounced: 0,
    };
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  canBeAccessedByUser(userId: string): boolean {
    // Lists can be accessed by members of the same organization
    // Additional business logic can be added here
    return true;
  }

  updateLastEmailSent(): void {
    this.stats.lastEmailSent = new Date();
    this.updatedAt = new Date();
  }

  toObject() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      name: this.name,
      description: this.description,
      status: this.status,
      tags: this.tags,
      isPublic: this.isPublic,
      allowSelfSubscribe: this.allowSelfSubscribe,
      requireDoubleOptIn: this.requireDoubleOptIn,
      welcomeEmailTemplateId: this.welcomeEmailTemplateId,
      unsubscribeRedirectUrl: this.unsubscribeRedirectUrl,
      stats: {
        ...this.stats,
        lastEmailSent: this.stats.lastEmailSent?.toISOString(),
      },
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
