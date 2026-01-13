import { DomainEvent } from '../../base/domain-event';

export interface ScheduledReportCreatedEventData {
  name: string;
  reportId: string;
  frequency: string;
  createdBy: string;
  organizationId?: string;
}

/**
 * Domain event fired when a scheduled report is created
 */
export class ScheduledReportCreatedEvent extends DomainEvent {
  constructor(
    public readonly scheduledReportId: string,
    public readonly data: ScheduledReportCreatedEventData
  ) {
    super('ScheduledReportCreated', scheduledReportId, data);
  }

  getEventName(): string {
    return 'ScheduledReportCreated';
  }
}