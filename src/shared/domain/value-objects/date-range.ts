import { ValueObject } from '../base/value-object';
import { ValidationError } from '../exceptions/validation-error';

interface DateRangeProps {
  startDate: Date;
  endDate: Date;
}

/**
 * Date Range Value Object
 * Ensures valid date range with start date before end date
 */
export class DateRange extends ValueObject<DateRangeProps> {
  constructor(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new ValidationError('dateRange', 'start date must be before end date');
    }
    super({ startDate, endDate });
  }

  protected validate(props: DateRangeProps): void {
    // Validation is done in constructor
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date {
    return this._value.endDate;
  }

  get durationInDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  static create(startDate: Date, endDate: Date): DateRange {
    return new DateRange(startDate, endDate);
  }

  static createFromStrings(startDate: string, endDate: string): DateRange {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('dateRange', 'Invalid date format');
    }
    
    return new DateRange(start, end);
  }
}