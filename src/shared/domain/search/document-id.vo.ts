import { ValueObject } from '../value-object.base';

export interface DocumentIdProps {
  value: string;
}

export class DocumentId extends ValueObject<DocumentIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: DocumentIdProps) {
    super(props);
  }

  static create(id: string): DocumentId {
    if (!id || id.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }

    return new DocumentId({ value: id.trim() });
  }
}
