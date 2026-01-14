import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Job Priority Enumeration
 * Represents the priority of a background job
 */
export enum JobPriorityEnum {
  LOW = 1,
  NORMAL = 5,
  MEDIUM = 10,
  HIGH = 15,
  CRITICAL = 20,
}

/**
 * Job Priority Value Object
 * Represents the priority of a background job
 */
export class JobPriority extends ValueObject<JobPriorityEnum> {
  private constructor(value: JobPriorityEnum) {
    super(value);
  }

  protected validate(value: JobPriorityEnum): void {
    if (!Object.values(JobPriorityEnum).includes(value)) {
      throw new ValidationError('jobPriority', `Invalid job priority: ${value}`);
    }
  }

  public static create(value: JobPriorityEnum | number): JobPriority {
    const priorityValue = typeof value === 'number'
      ? this.fromNumber(value)
      : value;

    return new JobPriority(priorityValue);
  }

  public static fromNumber(value: number): JobPriorityEnum {
    const validPriorities = Object.values(JobPriorityEnum);
    if (validPriorities.includes(value as JobPriorityEnum)) {
      return value as JobPriorityEnum;
    }
    // Default to NORMAL if invalid
    return JobPriorityEnum.NORMAL;
  }

  public static low(): JobPriority {
    return new JobPriority(JobPriorityEnum.LOW);
  }

  public static normal(): JobPriority {
    return new JobPriority(JobPriorityEnum.NORMAL);
  }

  public static medium(): JobPriority {
    return new JobPriority(JobPriorityEnum.MEDIUM);
  }

  public static high(): JobPriority {
    return new JobPriority(JobPriorityEnum.HIGH);
  }

  public static critical(): JobPriority {
    return new JobPriority(JobPriorityEnum.CRITICAL);
  }

  public getValue(): JobPriorityEnum {
    return this._value;
  }

  public isLow(): boolean {
    return this._value === JobPriorityEnum.LOW;
  }

  public isNormal(): boolean {
    return this._value === JobPriorityEnum.NORMAL;
  }

  public isMedium(): boolean {
    return this._value === JobPriorityEnum.MEDIUM;
  }

  public isHigh(): boolean {
    return this._value === JobPriorityEnum.HIGH;
  }

  public isCritical(): boolean {
    return this._value === JobPriorityEnum.CRITICAL;
  }

  public get priority(): JobPriorityEnum {
    return this.value;
  }

  public get numericValue(): number {
    return this.value;
  }
}
