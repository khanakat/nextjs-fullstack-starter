import { DomainEvent } from '../../base/domain-event';

export interface ReportTemplateUpdatedEventData {
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
}

/**
 * Domain Event: Report Template Updated
 * Fired when a report template is updated
 */
export class ReportTemplateUpdatedEvent extends DomainEvent {
  constructor(
    public readonly templateId: string,
    public readonly data: ReportTemplateUpdatedEventData
  ) {
    super('ReportTemplateUpdated', templateId);
  }

  getEventName(): string {
    return 'ReportTemplateUpdatedEvent';
  }

  get name(): string {
    return this.getEventName();
  }
}