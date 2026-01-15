import { ValueObject } from '@/shared/domain/base';

export interface DocumentIdProps {
  value: string;
}

export class DocumentId extends ValueObject<DocumentIdProps> {
  get props(): DocumentIdProps {
    return this.value;
  }

  private constructor(props: DocumentIdProps) {
    super(props);
  }

  protected validate(value: DocumentIdProps): void {
    if (!value.value || value.value.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }
  }

  static create(id: string): DocumentId {
    return new DocumentId({ value: id.trim() });
  }
}
