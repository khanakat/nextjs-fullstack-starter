import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Workflow Template ID Value Object
 */
export class WorkflowTemplateId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new WorkflowTemplateId
   */
  static create(): WorkflowTemplateId {
    const id = UniqueId.create();
    return new WorkflowTemplateId(id.value);
  }

  /**
   * Create from existing string value
   */
  static fromValue(value: string): WorkflowTemplateId {
    return new WorkflowTemplateId(value);
  }

  /**
   * Validate workflow template ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Workflow Template ID cannot be empty');
    }
  }
}
