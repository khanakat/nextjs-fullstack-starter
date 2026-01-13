import { DomainEvent } from '../../base/domain-event';

export interface ScheduledReportUpdatedEventData {
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
}

export class ScheduledReportUpdatedEvent extends DomainEvent {
  constructor(
    public readonly scheduledReportId: string,
    public readonly data: ScheduledReportUpdatedEventData
  ) {
    super('ScheduledReportUpdated', scheduledReportId, data);
  }

  getEventName(): string {
    return 'ScheduledReportUpdated';
  }
}