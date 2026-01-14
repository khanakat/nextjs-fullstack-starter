import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Workflow Instance ID Value Object
 */
export class WorkflowInstanceId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new WorkflowInstanceId
   */
  static create(): WorkflowInstanceId {
    const id = UniqueId.create();
    return new WorkflowInstanceId(id.value);
  }

  /**
   * Create from existing string value
   */
  static fromValue(value: string): WorkflowInstanceId {
    return new WorkflowInstanceId(value);
  }

  /**
   * Validate workflow instance ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Workflow Instance ID cannot be empty');
    }
  }
}
