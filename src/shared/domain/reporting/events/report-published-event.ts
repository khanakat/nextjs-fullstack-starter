import { DomainEvent } from '../../base/domain-event';

export interface ReportPublishedEventData {
  title: string;
  publishedBy: string;
  organizationId?: string;
}

/**
 * Domain Event: Report Published
 * Fired when a report is published
 */
export class ReportPublishedEvent extends DomainEvent {
  constructor(
    public readonly reportId: string,
    public readonly data: ReportPublishedEventData
  ) {
    super('ReportPublished', reportId);
  }

  getEventName(): string {
    return 'ReportPublished';
  }
}