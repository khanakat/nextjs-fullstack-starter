import { DomainEvent } from '../../base/domain-event';

export interface ReportCreatedEventData {
  title: string;
  createdBy: string;
  organizationId?: string;
  templateId?: string;
}

/**
 * Domain Event: Report Created
 * Fired when a new report is created
 */
export class ReportCreatedEvent extends DomainEvent {
  constructor(
    public readonly reportId: string,
    public readonly data: ReportCreatedEventData
  ) {
    super('ReportCreated', reportId);
  }

  getEventName(): string {
    return 'ReportCreated';
  }
}