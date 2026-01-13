import { DomainEvent } from '../../base/domain-event';

export interface ReportArchivedEventData {
  title: string;
  archivedBy: string;
  organizationId?: string;
}

/**
 * Domain Event: Report Archived
 * Fired when a report is archived
 */
export class ReportArchivedEvent extends DomainEvent {
  constructor(
    public readonly reportId: string,
    public readonly data: ReportArchivedEventData
  ) {
    super('ReportArchived', reportId);
  }

  getEventName(): string {
    return 'ReportArchived';
  }
}