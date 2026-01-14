import { ValueObject } from '../../base/value-object';

export interface CommentReactionProps {
  emoji: string;
  userId: string;
}

export class CommentReaction extends ValueObject<CommentReactionProps> {
  readonly emoji: string;
  readonly userId: string;

  private constructor(props: CommentReactionProps) {
    super(props);
    this.emoji = props.emoji;
    this.userId = props.userId;
  }

  static create(emoji: string, userId: string): CommentReaction {
    if (!emoji || emoji.trim().length === 0) {
      throw new Error('Emoji cannot be empty');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // Validate emoji (basic validation for common emojis)
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{2702}-\u{27B0}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
    if (!emojiRegex.test(emoji)) {
      throw new Error('Invalid emoji format');
    }

    return new CommentReaction({ emoji: emoji.trim(), userId: userId.trim() });
  }

  equals(other: CommentReaction): boolean {
    return this.emoji === other.emoji && this.userId === other.userId;
  }

  toJSON(): { emoji: string; userId: string } {
    return {
      emoji: this.emoji,
      userId: this.userId,
    };
  }
}
