import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * WorkflowId Value Object
 * Represents a unique workflow identifier
 */
export class WorkflowId extends ValueObject<string> {
  private static readonly LENGTH = 36; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new WorkflowId
   */
  static create(): WorkflowId {
    const id = UniqueId.create();
    return new WorkflowId(id.value);
  }

  /**
   * Create from existing string value
   */
  static fromValue(value: string): WorkflowId {
    return new WorkflowId(value);
  }

  /**
   * Validate workflow ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Workflow ID cannot be empty');
    }
    if (value.length > WorkflowId.LENGTH) {
      throw new Error(`Workflow ID cannot exceed ${WorkflowId.LENGTH} characters`);
    }
  }
}
