import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * Audit Action Value Object
 * Represents the type of action performed
 */
export class AuditAction extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): AuditAction {
    if (!value || value.trim().length === 0) {
      throw new Error('Audit action cannot be empty');
    }

    return new AuditAction(value);
  }

  public static CREATE(): AuditAction {
    return new AuditAction('CREATE');
  }

  public static UPDATE(): AuditAction {
    return new AuditAction('UPDATE');
  }

  public static DELETE(): AuditAction {
    return new AuditAction('DELETE');
  }

  public static LOGIN(): AuditAction {
    return new AuditAction('LOGIN');
  }

  public static LOGOUT(): AuditAction {
    return new AuditAction('LOGOUT');
  }

  public static EXPORT(): AuditAction {
    return new AuditAction('EXPORT');
  }

  public static IMPORT(): AuditAction {
    return new AuditAction('IMPORT');
  }

  public getValue(): string {
    return this._value;
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Audit action cannot be empty');
    }
  }
}
