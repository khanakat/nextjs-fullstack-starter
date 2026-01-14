import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Workflow Task ID Value Object
 */
export class WorkflowTaskId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new WorkflowTaskId
   */
  static create(): WorkflowTaskId {
    const id = UniqueId.create();
    return new WorkflowTaskId(id.value);
  }

  /**
   * Create from existing string value
   */
  static fromValue(value: string): WorkflowTaskId {
    return new WorkflowTaskId(value);
  }

  /**
   * Validate workflow task ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Workflow Task ID cannot be empty');
    }
  }
}
