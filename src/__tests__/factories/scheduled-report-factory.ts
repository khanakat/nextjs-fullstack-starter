import { 
  ScheduledReport, 
  ScheduleFrequency, 
  ScheduledReportStatus, 
  ScheduleConfig, 
  DeliveryConfig,
  DeliveryMethod
} from '../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../shared/domain/value-objects/unique-id';
import { ScheduledReportDto, DeliveryConfigDto } from '../../slices/reporting/application/dtos/scheduled-report-dto';

export interface ScheduledReportFactoryProps {
  id?: UniqueId;
  name?: string;
  description?: string;
  reportId?: UniqueId;
  frequency?: ScheduleFrequency;
  scheduleConfig?: ScheduleConfig;
  deliveryConfig?: DeliveryConfig;
  status?: ScheduledReportStatus;
  isActive?: boolean;
  createdBy?: UniqueId;
  organizationId?: UniqueId;
  executionCount?: number;
  successCount?: number;
  lastExecutedAt?: Date;
  nextRunAt?: Date;
  // Alias commonly used in tests; treat as equivalent to nextRunAt
  nextExecutionAt?: Date;
  recipients?: string[];
  parameters?: Record<string, any>;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ScheduledReportFactory {
  private static normalizeFrequency(freq?: any): ScheduleFrequency {
    if (!freq) return ScheduleFrequency.DAILY;
    // Accept both enum values and lowercase aliases used in tests
    const mapping: Record<string, ScheduleFrequency> = {
      daily: ScheduleFrequency.DAILY,
      weekly: ScheduleFrequency.WEEKLY,
      monthly: ScheduleFrequency.MONTHLY,
      quarterly: ScheduleFrequency.QUARTERLY,
      yearly: ScheduleFrequency.YEARLY,
    };

    if (typeof freq === 'string') {
      const lower = freq.toLowerCase();
      if (mapping[lower]) return mapping[lower];
    }

    // If already enum or unrecognized string, fallback safely
    return Object.values(ScheduleFrequency).includes(freq)
      ? freq
      : ScheduleFrequency.DAILY;
  }

  static create(props: ScheduledReportFactoryProps = {}): ScheduledReport {
    const id = props.id || UniqueId.generate();
    const reportId = props.reportId || UniqueId.generate();
    const createdBy = props.createdBy || UniqueId.generate();
    const organizationId = props.organizationId || UniqueId.generate();

    const scheduleConfig: ScheduleConfig = props.scheduleConfig || {
      frequency: ScheduledReportFactory.normalizeFrequency(props.frequency),
      timezone: 'UTC',
      dayOfWeek: 1,
      dayOfMonth: 1,
      hour: 9,
      minute: 0,
    };

    const deliveryConfig: DeliveryConfig = props.deliveryConfig || {
      method: DeliveryMethod.EMAIL,
      recipients: props.recipients || ['test@example.com'],
      format: 'PDF',
      includeCharts: true,
    };

    // Use reconstitute to allow overriding counters/timestamps for tests
    const entity = ScheduledReport.reconstitute(id, {
      name: props.name || 'Test Scheduled Report',
      description: props.description || 'A test scheduled report',
      reportId,
      scheduleConfig,
      deliveryConfig,
      status: props.status || ScheduledReportStatus.ACTIVE,
      createdBy,
      organizationId,
      executionCount: props.executionCount ?? 0,
      failureCount: (props.executionCount ?? 0) - (props.successCount ?? 0) >= 0
        ? (props.executionCount ?? 0) - (props.successCount ?? 0)
        : 0,
      lastExecutedAt: props.lastExecutedAt,
      // Support both nextExecutionAt and nextRunAt inputs
      nextExecutionAt: props.nextExecutionAt || props.nextRunAt || new Date('2024-01-02T09:00:00Z'),
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      // Extra fields used by handler mapping/tests (not in domain type)
      parameters: props.parameters || {},
      isActive: props.isActive !== undefined ? props.isActive : true,
      isPublic: props.isPublic !== undefined ? props.isPublic : true,
    } as any);

    return entity;
  }

  create(props: ScheduledReportFactoryProps = {}): ScheduledReport {
    return ScheduledReportFactory.create(props);
  }

  static createDto(overrides: Partial<{
    id: string;
    name: string;
    reportId: string;
    frequency: ScheduleFrequency;
    isActive: boolean;
    nextExecutionAt: Date;
    lastExecutionAt: Date;
    executionCount: number;
    failureCount: number;
    createdBy: string;
    organizationId?: string;
    timezone: string;
    deliveryConfig: Partial<DeliveryConfigDto> & { method?: 'email' | 'webhook' | 'file_system' | 'cloud_storage'; format?: 'pdf' | 'excel' | 'csv' | 'json' };
    executionHistory: any[];
    createdAt: Date;
    updatedAt?: Date;
  }> = {}): ScheduledReportDto {
    const id = overrides.id || UniqueId.generate().value;
    const reportId = overrides.reportId || UniqueId.generate().value;
    const createdBy = overrides.createdBy || UniqueId.generate().value;
    const organizationId = overrides.organizationId;

    const frequency = overrides.frequency || ScheduleFrequency.DAILY;
    const isActive = overrides.isActive ?? true;
    const nextExecutionAt = overrides.nextExecutionAt || new Date(Date.now() + 3600_000);
    const lastExecutionAt = overrides.lastExecutionAt;
    const executionCount = overrides.executionCount ?? 0;
    const failureCount = overrides.failureCount ?? 0;
    const timezone = overrides.timezone || 'UTC';

    const deliveryConfig = new DeliveryConfigDto(
      overrides.deliveryConfig?.method || 'email',
      (overrides.deliveryConfig?.recipients as string[]) || ['test@example.com'],
      overrides.deliveryConfig?.format || 'pdf',
      overrides.deliveryConfig?.settings || {}
    );

    const executionHistory = (overrides.executionHistory || []).map(h => ({
      toPlainObject: () => h,
    })) as any;

    const createdAt = overrides.createdAt || new Date();
    const updatedAt = overrides.updatedAt;

    return new ScheduledReportDto(
      id,
      overrides.name || 'Test Scheduled Report',
      reportId,
      frequency as any,
      isActive,
      executionCount,
      failureCount,
      createdBy,
      timezone,
      deliveryConfig,
      executionHistory as any,
      createdAt,
      updatedAt,
      nextExecutionAt,
      lastExecutionAt,
      organizationId
    );
  }
}

// Placeholder test to ensure Jest treats this file as a valid suite when matched
describe('ScheduledReportFactory helpers', () => {
  it('exposes create and createDto', () => {
    expect(typeof ScheduledReportFactory.create).toBe('function');
    expect(typeof ScheduledReportFactory.createDto).toBe('function');
  });
});