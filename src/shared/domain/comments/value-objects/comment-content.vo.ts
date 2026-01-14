import { ValueObject } from '../../base/value-object';

export interface CommentContentProps {
  value: string;
}

export class CommentContent extends ValueObject<CommentContentProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: CommentContentProps) {
    super(props);
  }

  static create(content: string): CommentContent {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (content.length > 10000) {
      throw new Error('Comment content cannot exceed 10,000 characters');
    }

    return new CommentContent({ value: content.trim() });
  }

  isDeleted(): boolean {
    return this.props.value === '[deleted]';
  }

  markAsDeleted(): CommentContent {
    return new CommentContent({ value: '[deleted]' });
  }
}
