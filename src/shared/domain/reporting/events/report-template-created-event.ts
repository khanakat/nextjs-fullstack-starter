import { DomainEvent } from '../../base/domain-event';

export interface ReportTemplateCreatedEventData {
  name: string;
  type: string;
  category: string;
  createdBy: string;
  organizationId?: string;
  isSystem: boolean;
}

/**
 * Domain Event: Report Template Created
 * Fired when a new report template is created
 */
export class ReportTemplateCreatedEvent extends DomainEvent {
  constructor(
    public readonly templateId: string,
    public readonly data: ReportTemplateCreatedEventData
  ) {
    super('ReportTemplateCreated', templateId);
  }

  getEventName(): string {
    return 'ReportTemplateCreatedEvent';
  }

  get name(): string {
    return this.getEventName();
  }
}