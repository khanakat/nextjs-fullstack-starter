/**
 * Email Tracking Event Entity
 * Represents email tracking events (opens, clicks, bounces, etc.)
 */

export enum TrackingEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
}

export interface TrackingEventMetadata {
  location?: string;
  device?: string;
  browser?: string;
  platform?: string;
  [key: string]: any;
}

export class EmailTrackingEvent {
  id: string;
  emailId: string;
  organizationId?: string;
  eventType: TrackingEventType;
  timestamp: Date;
  recipientEmail: string;
  metadata?: TrackingEventMetadata;
  userAgent?: string;
  ipAddress?: string;
  linkUrl?: string; // For click events
  createdAt: Date;

  constructor(props: {
    id: string;
    emailId: string;
    eventType: TrackingEventType;
    recipientEmail: string;
    organizationId?: string;
    timestamp?: Date;
    metadata?: TrackingEventMetadata;
    userAgent?: string;
    ipAddress?: string;
    linkUrl?: string;
    createdAt?: Date;
  }) {
    this.id = props.id;
    this.emailId = props.emailId;
    this.organizationId = props.organizationId;
    this.eventType = props.eventType;
    this.timestamp = props.timestamp ?? new Date();
    this.recipientEmail = props.recipientEmail;
    this.metadata = props.metadata;
    this.userAgent = props.userAgent;
    this.ipAddress = props.ipAddress;
    this.linkUrl = props.linkUrl;
    this.createdAt = props.createdAt ?? new Date();
  }

  toObject() {
    return {
      id: this.id,
      emailId: this.emailId,
      organizationId: this.organizationId,
      eventType: this.eventType,
      timestamp: this.timestamp.toISOString(),
      recipientEmail: this.recipientEmail,
      metadata: this.metadata,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      linkUrl: this.linkUrl,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
