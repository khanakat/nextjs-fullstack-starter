import { DomainEvent } from '../../base/domain-event';

export interface ReportUpdatedEventData {
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
}

/**
 * Domain Event: Report Updated
 * Fired when a report is updated
 */
export class ReportUpdatedEvent extends DomainEvent {
  constructor(
    public readonly reportId: string,
    public readonly data: ReportUpdatedEventData
  ) {
    super('ReportUpdated', reportId);
  }

  getEventName(): string {
    return 'ReportUpdated';
  }
}