import { ValueObject } from '@/shared/domain/base';

export interface IndexNameProps {
  value: string;
}

export class IndexName extends ValueObject<IndexNameProps> {
  get props(): IndexNameProps {
    return this.value;
  }

  private constructor(props: IndexNameProps) {
    super(props);
  }

  protected validate(value: IndexNameProps): void {
    if (!value.value || value.value.length === 0) {
      throw new Error('Index name cannot be empty');
    }

    if (value.value.length > 255) {
      throw new Error('Index name cannot exceed 255 characters');
    }
  }

  static create(name: string): IndexName {
    // Normalize index name format
    const validName = name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return new IndexName({ value: validName });
  }
}
