import { DomainEvent } from '../../base/domain-event';

export interface ScheduledReportExecutedEventData {
  executedAt: string;
  success: boolean;
  nextExecutionAt: string;
  executionCount: number;
  errorMessage?: string;
  executionDuration?: number;
  reportSize?: number;
}

export class ScheduledReportExecutedEvent extends DomainEvent {
  constructor(
    public readonly scheduledReportId: string,
    public readonly data: ScheduledReportExecutedEventData
  ) {
    super('ScheduledReportExecuted', scheduledReportId, data);
  }

  getEventName(): string {
    return 'ScheduledReportExecuted';
  }
}