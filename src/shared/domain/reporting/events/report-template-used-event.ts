import { DomainEvent } from '../../base/domain-event';

export interface ReportTemplateUsedEventData {
  templateId: string;
  usageCount: number;
  usedBy: string;
  organizationId?: string;
}

/**
 * Domain Event: Report Template Used
 * Fired when a report template is used (usage count incremented)
 */
export class ReportTemplateUsedEvent extends DomainEvent {
  constructor(
    public readonly templateId: string,
    public readonly data: ReportTemplateUsedEventData
  ) {
    super('ReportTemplateUsed', templateId);
  }

  getEventName(): string {
    return 'ReportTemplateUsedEvent';
  }

  get name(): string {
    return this.getEventName();
  }
}