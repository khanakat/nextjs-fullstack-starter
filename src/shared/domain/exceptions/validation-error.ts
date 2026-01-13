import { DomainError } from './domain-error';

/**
 * Validation Error for domain validation failures
 */
export class ValidationError extends DomainError {
  public readonly field: string;
  public readonly validationRule: string;

  constructor(field: string, message: string, validationRule?: string) {
    super(`Validation failed for ${field}: ${message}`, 'VALIDATION_ERROR');
    this.field = field;
    this.validationRule = validationRule || 'UNKNOWN';
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      field: this.field,
      validationRule: this.validationRule,
    };
  }
}