import { DomainError } from './domain-error';

/**
 * Business Rule Violation Error for domain business rule violations
 */
export class BusinessRuleViolationError extends DomainError {
  public readonly ruleName: string;
  public readonly context: Record<string, any>;

  constructor(ruleName: string, message: string, context: Record<string, any> = {}) {
    super(`Business rule violation: ${message}`, 'BUSINESS_RULE_VIOLATION');
    this.ruleName = ruleName;
    this.context = context;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      ruleName: this.ruleName,
      context: this.context,
    };
  }
}