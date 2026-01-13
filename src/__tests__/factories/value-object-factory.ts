import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { Email } from 'src/shared/domain/value-objects/email';
import { DateRange } from 'src/shared/domain/value-objects/date-range';
import { NotificationChannel, ChannelType } from 'src/shared/domain/notifications/value-objects/notification-channel';
import { ReportConfig } from 'src/shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from 'src/shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from 'src/shared/domain/reporting/value-objects/report-styling';
import { createId } from '@paralleldrive/cuid2';

/**
 * Factory for creating Value Object test instances
 */
export class ValueObjectFactory {
  // UniqueId Factory
  static createUniqueId(value?: string): UniqueId {
    return new UniqueId(value || createId());
  }

  static createUniqueIds(count: number): UniqueId[] {
    return Array.from({ length: count }, () => this.createUniqueId());
  }

  // Email Factory
  static createEmail(email?: string): Email {
    return new Email(email || `test${Math.random().toString(36).substr(2, 9)}@example.com`);
  }

  static createValidEmails(): Email[] {
    return [
      new Email('user@example.com'),
      new Email('admin@company.org'),
      new Email('test.user+tag@domain.co.uk'),
      new Email('user123@test-domain.com'),
    ];
  }

  // DateRange Factory
  static createDateRange(overrides: Partial<{
    startDate: Date;
    endDate: Date;
  }> = {}): DateRange {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    return new DateRange(
      overrides.startDate || defaultStart,
      overrides.endDate || defaultEnd
    );
  }

  static createPastDateRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    return new DateRange(start, end);
  }

  static createFutureDateRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    return new DateRange(start, end);
  }

  // NotificationChannel Factory
  static createNotificationChannel(
    type: ChannelType = ChannelType.IN_APP,
    enabled: boolean = true,
    config?: Record<string, any>
  ): NotificationChannel {
    return NotificationChannel.create(type, enabled, config);
  }

  static createAllChannelTypes(): NotificationChannel[] {
    return Object.values(ChannelType).map(type => {
      if (type === ChannelType.WEBHOOK) {
        return NotificationChannel.create(type, true, { url: 'https://example.com' });
      }
      return NotificationChannel.create(type, true);
    });
  }

  static createEnabledChannels(): NotificationChannel[] {
    return [
      NotificationChannel.create(ChannelType.IN_APP, true),
      NotificationChannel.create(ChannelType.EMAIL, true),
      NotificationChannel.create(ChannelType.PUSH, true),
    ];
  }

  // ReportLayout Factory
  static createReportLayout(overrides: Partial<{
    type: string;
    components: any[];
    grid: any;
    responsive: any;
  }> = {}): ReportLayout {
    const defaultLayout = {
      type: 'grid',
      components: [],
      grid: {
        columns: 12,
        rows: 10,
        gap: 16,
      },
      responsive: {
        breakpoints: {
          sm: 640,
          md: 768,
          lg: 1024,
          xl: 1280,
        },
      },
      ...overrides,
    };

    return ReportLayout.create(defaultLayout);
  }

  static createComplexLayout(): ReportLayout {
    return ReportLayout.create({
      type: 'grid',
      components: [
        {
          id: 'header',
          type: 'text',
          position: { x: 0, y: 0, width: 12, height: 1 },
          props: { text: 'Report Header', style: 'h1' },
        },
        {
          id: 'chart1',
          type: 'chart',
          position: { x: 0, y: 1, width: 6, height: 4 },
          props: { chartType: 'bar', dataSource: 'sales' },
        },
        {
          id: 'chart2',
          type: 'chart',
          position: { x: 6, y: 1, width: 6, height: 4 },
          props: { chartType: 'line', dataSource: 'trends' },
        },
      ],
      grid: {
        columns: 12,
        rows: 10,
        gap: 16,
      },
    });
  }

  // ReportStyling Factory
  static createReportStyling(overrides: Partial<{
    theme: string;
    colors: any;
    fonts: any;
    spacing: any;
  }> = {}): ReportStyling {
    const defaultStyling = {
      theme: 'default',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        background: '#ffffff',
        text: '#212529',
        border: '#dee2e6',
      },
      fonts: {
        family: 'Inter, sans-serif',
        sizes: { 
          xs: 10, 
          sm: 12, 
          md: 14, 
          lg: 16, 
          xl: 18, 
          xxl: 24 
        },
        weights: { 
          light: 300, 
          normal: 400, 
          medium: 500, 
          bold: 600, 
          black: 700 
        },
      },
      spacing: {
        unit: 'px',
        scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
      },
      ...overrides,
    };

    return ReportStyling.create(defaultStyling);
  }

  static createDarkThemeStyling(): ReportStyling {
    return ReportStyling.create({
      theme: 'dark',
      colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        accent: '#198754',
        background: '#212529',
        text: '#ffffff',
        border: '#495057',
      },
      fonts: {
        family: 'Inter, sans-serif',
        sizes: { sm: 12, md: 14, lg: 16 },
        weights: { normal: 400, bold: 600 },
      },
      spacing: {
        unit: 'rem',
        scale: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4],
      },
    });
  }

  // ReportConfig Factory
  static createReportConfig(overrides: Partial<{
    title: string;
    description: string;
    filters: any;
    parameters: any;
    layout: ReportLayout;
    styling: ReportStyling;
  }> = {}): ReportConfig {
    const defaultConfig = {
      title: 'Test Report Configuration',
      description: 'A test report configuration for testing purposes',
      filters: {
        dateRange: 'last_30_days',
        status: 'active',
      },
      parameters: {
        showTotals: true,
        groupBy: 'category',
        sortBy: 'date',
        sortOrder: 'desc',
      },
      layout: this.createReportLayout(),
      styling: this.createReportStyling(),
      ...overrides,
    };

    return ReportConfig.create(defaultConfig);
  }

  static createMinimalConfig(): ReportConfig {
    return ReportConfig.create({
      title: 'Minimal Config',
      description: 'Minimal configuration for testing',
      filters: {},
      parameters: {},
      layout: this.createReportLayout({ type: 'simple' }),
      styling: this.createReportStyling({ theme: 'minimal' }),
    });
  }

  static createComplexConfig(): ReportConfig {
    return ReportConfig.create({
      title: 'Complex Report Configuration',
      description: 'A complex configuration with multiple filters and parameters',
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        categories: ['sales', 'marketing', 'support'],
        regions: ['north', 'south', 'east', 'west'],
        status: ['active', 'pending'],
      },
      parameters: {
        showTotals: true,
        showAverages: true,
        showTrends: true,
        groupBy: ['category', 'region'],
        sortBy: 'total_value',
        sortOrder: 'desc',
        limit: 100,
        includeSubcategories: true,
      },
      layout: this.createComplexLayout(),
      styling: this.createDarkThemeStyling(),
    });
  }
}

// Keep Jest satisfied with at least one assertion in the file
describe('ValueObjectFactory', () => {
  it('creates a valid UniqueId', () => {
    const id = ValueObjectFactory.createUniqueId();
    expect(UniqueId.isValid(id.id)).toBe(true);
  });
});
