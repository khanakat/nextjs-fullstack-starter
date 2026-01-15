import { ValueObject } from '@/shared/domain/base';

export interface CommentContentProps {
  value: string;
}

export class CommentContent extends ValueObject<CommentContentProps> {
  get props(): CommentContentProps {
    return this.value;
  }

  private constructor(props: CommentContentProps) {
    super(props);
  }

  protected validate(value: CommentContentProps): void {
    if (!value.value || value.value.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    if (value.value.length > 10000) {
      throw new Error('Comment content cannot exceed 10,000 characters');
    }
  }

  static create(content: string): CommentContent {
    return new CommentContent({ value: content.trim() });
  }

  isDeleted(): boolean {
    return this.value.value === '[deleted]';
  }

  markAsDeleted(): CommentContent {
    return new CommentContent({ value: '[deleted]' });
  }
}
