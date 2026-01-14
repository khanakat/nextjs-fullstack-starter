import { UniqueId } from '../../value-objects/unique-id';

export class CommentId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): CommentId {
    return new CommentId(value || UniqueId.generate().value);
  }
}
