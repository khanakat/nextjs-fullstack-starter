import { ValueObject } from '../value-object.base';

export interface IndexNameProps {
  value: string;
}

export class IndexName extends ValueObject<IndexNameProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: IndexNameProps) {
    super(props);
  }

  static create(name: string): IndexName {
    // Validate index name format
    const validName = name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (validName.length === 0) {
      throw new Error('Index name cannot be empty');
    }

    if (validName.length > 255) {
      throw new Error('Index name cannot exceed 255 characters');
    }

    return new IndexName({ value: validName });
  }
}
