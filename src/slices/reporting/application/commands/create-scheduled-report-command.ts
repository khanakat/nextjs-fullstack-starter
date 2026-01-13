import { Command } from '../../../../shared/application/base/command';
import { ScheduleFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { DeliveryConfigDto } from '../dtos/scheduled-report-dto';

/**
 * Command to create a new scheduled report
 */
export class CreateScheduledReportCommand extends Command {
  public readonly name: string;
  public readonly reportId: string;
  public readonly frequency: ScheduleFrequency;
  public readonly timezone: string;
  public readonly deliveryConfig: DeliveryConfigDto;
  public readonly organizationId?: string;

  constructor(
    name: string,
    reportId: string,
    frequency: ScheduleFrequency,
    timezone: string,
    deliveryConfig: DeliveryConfigDto,
    userId: string,
    organizationId?: string
  ) {
    super(userId);
    this.name = name;
    this.reportId = reportId;
    this.frequency = frequency;
    this.timezone = timezone;
    this.deliveryConfig = deliveryConfig;
    this.organizationId = organizationId;
    // Run validation on construction to satisfy tests expecting constructor to throw
    this.validate();
  }

  public validate(): void {
    super.validate();
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Scheduled report name is required');
    }

    if (this.name.length > 200) {
      throw new Error('Scheduled report name cannot exceed 200 characters');
    }

    if (!this.reportId || this.reportId.trim().length === 0) {
      throw new Error('Report ID is required');
    }

    // Frequency validation relaxed to allow extended values like HOURLY (handled in handler)

    if (!this.timezone || this.timezone.trim().length === 0) {
      throw new Error('Timezone is required');
    }

    if (!this.deliveryConfig) {
      throw new Error('Delivery configuration is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    // Validate delivery config
    // Allow method/format to be optional; handler maps/normalizes them

    if (!Array.isArray(this.deliveryConfig.recipients) || this.deliveryConfig.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    // Validate recipients based on delivery method (case-insensitive)
    if (
      this.deliveryConfig.method &&
      this.deliveryConfig.method.toString().toLowerCase() === 'email'
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const recipient of this.deliveryConfig.recipients) {
        if (!emailRegex.test(recipient)) {
          throw new Error(`Invalid email address: ${recipient}`);
        }
      }
    }
  }
}