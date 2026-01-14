import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Cache Tag Value Object
 * Represents a tag for grouping and invalidating related cache entries
 */
export class CacheTag extends ValueObject<string> {
  private static readonly MAX_TAG_LENGTH = 100;

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('cacheTag', 'Cache tag must be a non-empty string');
    }
    if (value.length < 1 || value.length > CacheTag.MAX_TAG_LENGTH) {
      throw new ValidationError(
        'cacheTag',
        `Cache tag must be between 1 and ${CacheTag.MAX_TAG_LENGTH} characters`
      );
    }
    // Validate tag format (alphanumeric, hyphens, underscores, colons)
    if (!/^[a-zA-Z0-9:_-]+$/.test(value)) {
      throw new ValidationError(
        'cacheTag',
        'Cache tag can only contain alphanumeric characters, hyphens, underscores, and colons'
      );
    }
  }

  public static create(value: string): CacheTag {
    return new CacheTag(value);
  }

  public static fromValue(value: string): CacheTag {
    return new CacheTag(value);
  }

  public getValue(): string {
    return this._value;
  }

  /**
   * Create a namespaced cache tag
   */
  public withPrefix(prefix: string): CacheTag {
    return new CacheTag(`${prefix}:${this._value}`);
  }

  /**
   * Create a namespaced cache tag with multiple segments
   */
  public withPrefixes(...prefixes: string[]): CacheTag {
    const fullPrefix = prefixes.join(':');
    return new CacheTag(`${fullPrefix}:${this._value}`);
  }

  /**
   * Common tag presets
   */
  public static readonly USER = new CacheTag('user');
  public static readonly ORGANIZATION = new CacheTag('organization');
  public static readonly REPORT = new CacheTag('report');
  public static readonly ANALYTICS = new CacheTag('analytics');
  public static readonly WORKFLOW = new CacheTag('workflow');
  public static readonly INTEGRATION = new CacheTag('integration');
  public static readonly NOTIFICATION = new CacheTag('notification');
  public static readonly FILE = new CacheTag('file');
  public static readonly SETTING = new CacheTag('setting');
  public static readonly AUDIT = new CacheTag('audit');
  public static readonly PERMISSION = new CacheTag('permission');
  public static readonly SESSION = new CacheTag('session');

  /**
   * Create a user-specific tag
   */
  public static forUser(userId: string): CacheTag {
    return new CacheTag(`user:${userId}`);
  }

  /**
   * Create an organization-specific tag
   */
  public static forOrganization(organizationId: string): CacheTag {
    return new CacheTag(`organization:${organizationId}`);
  }

  /**
   * Create a report-specific tag
   */
  public static forReport(reportId: string): CacheTag {
    return new CacheTag(`report:${reportId}`);
  }

  /**
   * Create a workflow-specific tag
   */
  public static forWorkflow(workflowId: string): CacheTag {
    return new CacheTag(`workflow:${workflowId}`);
  }

  public toString(): string {
    return this._value;
  }
}
