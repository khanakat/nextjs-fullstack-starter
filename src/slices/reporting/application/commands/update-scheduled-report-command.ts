import { Command } from '../../../../shared/application/base/command';
import { ScheduleFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { DeliveryConfigDto } from '../dtos/scheduled-report-dto';

/**
 * Command to update an existing scheduled report
 */
export class UpdateScheduledReportCommand extends Command {
  public readonly scheduledReportId: string;
  public readonly name?: string;
  public readonly description?: string;
  public readonly frequency?: ScheduleFrequency;
  public readonly timezone?: string;
  public readonly deliveryConfig?: DeliveryConfigDto;
  public readonly isActive?: boolean;

  constructor(
    scheduledReportId: string,
    userId: string,
    name?: string,
    description?: string,
    frequency?: ScheduleFrequency,
    timezone?: string,
    deliveryConfig?: DeliveryConfigDto,
    isActive?: boolean
  ) {
    super(userId);
    this.scheduledReportId = scheduledReportId;
    this.name = name;
    this.description = description;
    this.frequency = frequency;
    this.timezone = timezone;
    this.deliveryConfig = deliveryConfig;
    this.isActive = isActive;
  }

  public validate(): void {
    super.validate();
    
    if (!this.scheduledReportId || this.scheduledReportId.trim().length === 0) {
      throw new Error('Scheduled report ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (this.name !== undefined) {
      if (!this.name || this.name.trim().length === 0) {
        throw new Error('Scheduled report name cannot be empty');
      }

      if (this.name.length > 200) {
        throw new Error('Scheduled report name cannot exceed 200 characters');
      }
    }

    if (this.description !== undefined && this.description.length > 2000) {
      throw new Error('Description cannot exceed 2000 characters');
    }

    if (this.timezone !== undefined && (!this.timezone || this.timezone.trim().length === 0)) {
      throw new Error('Timezone cannot be empty');
    }

    // At least one field must be provided for update
    if (this.name === undefined && 
        this.description === undefined &&
        this.frequency === undefined && 
        this.timezone === undefined && 
        this.deliveryConfig === undefined && 
        this.isActive === undefined) {
      throw new Error('At least one field must be provided for update');
    }
  }
}