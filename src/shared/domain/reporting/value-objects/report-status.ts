import { ValueObject } from '../../base/value-object';

/**
 * Report Status Value Object
 * Represents the lifecycle status of a report
 */
export class ReportStatus extends ValueObject<string> {
  public static readonly DRAFT = 'DRAFT';
  public static readonly PUBLISHED = 'PUBLISHED';
  public static readonly ARCHIVED = 'ARCHIVED';

  private constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!isValidReportStatusString(value)) {
      throw new Error(`Invalid report status: ${value}`);
    }
  }

  public static draft(): ReportStatus {
    return new ReportStatus(ReportStatus.DRAFT);
  }

  public static published(): ReportStatus {
    return new ReportStatus(ReportStatus.PUBLISHED);
  }

  public static archived(): ReportStatus {
    return new ReportStatus(ReportStatus.ARCHIVED);
  }

  public static fromString(value: string): ReportStatus {
    return new ReportStatus(value);
  }

  public isDraft(): boolean {
    return this._value === ReportStatus.DRAFT;
  }

  public isPublished(): boolean {
    return this._value === ReportStatus.PUBLISHED;
  }

  public isArchived(): boolean {
    return this._value === ReportStatus.ARCHIVED;
  }

  public toString(): string {
    return this._value;
  }

  public getDisplayName(): string {
    switch (this._value) {
      case ReportStatus.DRAFT:
        return 'Draft';
      case ReportStatus.PUBLISHED:
        return 'Published';
      case ReportStatus.ARCHIVED:
        return 'Archived';
      default:
        return this._value;
    }
  }

  public canTransitionTo(newStatus: ReportStatus): boolean {
    return isValidStatusTransition(this, newStatus);
  }
}

/**
 * Type guard to check if a string is a valid ReportStatus
 */
export function isValidReportStatusString(status: string): boolean {
  return [ReportStatus.DRAFT, ReportStatus.PUBLISHED, ReportStatus.ARCHIVED].includes(status);
}

/**
 * Get all available report statuses
 */
export function getAllReportStatuses(): ReportStatus[] {
  return [
    ReportStatus.draft(),
    ReportStatus.published(),
    ReportStatus.archived()
  ];
}

/**
 * Get display name for report status
 */
export function getReportStatusDisplayName(status: ReportStatus): string {
  return status.getDisplayName();
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(from: ReportStatus, to: ReportStatus): boolean {
  const validTransitions: Record<string, string[]> = {
    [ReportStatus.DRAFT]: [ReportStatus.PUBLISHED, ReportStatus.ARCHIVED],
    [ReportStatus.PUBLISHED]: [ReportStatus.ARCHIVED],
    [ReportStatus.ARCHIVED]: [], // No transitions from archived
  };

  return validTransitions[from.toString()].includes(to.toString());
}