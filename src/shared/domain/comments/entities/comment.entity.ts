import { AggregateRoot } from '../../base/aggregate-root';
import { UniqueId } from '../../value-objects/unique-id';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentContent } from '../value-objects/comment-content.vo';
import { CommentPosition } from '../value-objects/comment-position.vo';
import { CommentReaction } from '../value-objects/comment-reaction.vo';
import { ValidationError } from '../../exceptions/validation-error';
import { BusinessRuleViolationError } from '../../exceptions/business-rule-violation-error';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { CommentDeletedEvent } from '../events/comment-deleted.event';
import { CommentResolvedEvent } from '../events/comment-resolved.event';
import { CommentReactionAddedEvent } from '../events/comment-reaction-added.event';
import { CommentReactionRemovedEvent } from '../events/comment-reaction-removed.event';

export interface CommentProps {
  id: CommentId;
  documentId: UniqueId;
  authorId: string;
  authorName: string;
  content: CommentContent;
  contentType: 'text' | 'code' | 'suggestion';
  position?: CommentPosition;
  parentId?: CommentId;
  resolved: boolean;
  reactions: Map<string, string[]>; // emoji -> array of user IDs
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Comment Aggregate Root
 * Represents a comment on a document with threading and reactions
 */
export class Comment extends AggregateRoot<CommentId> {
  private constructor(
    id: CommentId,
    private props: CommentProps
  ) {
    super(id);
  }

  public static create(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'reactions'>,
    id?: CommentId
  ): Comment {
    Comment.validateCreation(props);

    const commentId = id || CommentId.create();
    const now = new Date();

    const commentProps: CommentProps = {
      ...props,
      id: commentId,
      resolved: false,
      reactions: new Map<string, string[]>(),
      createdAt: now,
      updatedAt: now,
    };

    const comment = new Comment(commentId, commentProps);

    comment.addDomainEvent(
      new CommentCreatedEvent({
        commentId: commentId.id,
        documentId: props.documentId.id,
        authorId: props.authorId,
        parentId: props.parentId?.id,
        occurredAt: now,
      })
    );

    return comment;
  }

  public static reconstitute(id: CommentId, props: CommentProps): Comment {
    return new Comment(id, props);
  }

  private static validateCreation(props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'reactions'>): void {
    if (!props.documentId) {
      throw new ValidationError('documentId', 'Document ID is required');
    }

    if (!props.authorId || props.authorId.trim().length === 0) {
      throw new ValidationError('authorId', 'Author ID is required');
    }

    if (!props.authorName || props.authorName.trim().length === 0) {
      throw new ValidationError('authorName', 'Author name is required');
    }

    if (!props.content) {
      throw new ValidationError('content', 'Comment content is required');
    }

    const validTypes = ['text', 'code', 'suggestion'];
    if (!validTypes.includes(props.contentType)) {
      throw new ValidationError('contentType', `Content type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Getters
  get documentId(): UniqueId {
    return this.props.documentId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get authorName(): string {
    return this.props.authorName;
  }

  get content(): CommentContent {
    return this.props.content;
  }

  get contentType(): 'text' | 'code' | 'suggestion' {
    return this.props.contentType;
  }

  get position(): CommentPosition | undefined {
    return this.props.position;
  }

  get parentId(): CommentId | undefined {
    return this.props.parentId;
  }

  get resolved(): boolean {
    return this.props.resolved;
  }

  get reactions(): Map<string, string[]> {
    return new Map(this.props.reactions);
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // Business methods
  public updateContent(newContent: string): void {
    if (this.isDeleted()) {
      throw new BusinessRuleViolationError('CANNOT_UPDATE_DELETED', 'Cannot update a deleted comment');
    }

    const content = CommentContent.create(newContent);
    const oldContent = this.props.content.value;

    this.props.content = content;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new CommentUpdatedEvent({
        commentId: this.id.id,
        field: 'content',
        oldValue: oldContent,
        newValue: newContent,
        occurredAt: new Date(),
      })
    );
  }

  public resolve(): void {
    if (this.props.resolved) {
      throw new BusinessRuleViolationError('ALREADY_RESOLVED', 'Comment is already resolved');
    }

    this.props.resolved = true;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new CommentResolvedEvent({
        commentId: this.id.id,
        documentId: this.props.documentId.id,
        occurredAt: new Date(),
      })
    );
  }

  public unresolve(): void {
    if (!this.props.resolved) {
      throw new BusinessRuleViolationError('NOT_RESOLVED', 'Comment is not resolved');
    }

    this.props.resolved = false;
    this.props.updatedAt = new Date();
  }

  public addReaction(emoji: string, userId: string): void {
    if (this.isDeleted()) {
      throw new BusinessRuleViolationError('CANNOT_REACT_TO_DELETED', 'Cannot react to a deleted comment');
    }

    const reaction = CommentReaction.create(emoji, userId);

    if (!this.props.reactions.has(reaction.emoji)) {
      this.props.reactions.set(reaction.emoji, []);
    }

    const userReactions = this.props.reactions.get(reaction.emoji)!;
    if (userReactions.includes(reaction.userId)) {
      throw new BusinessRuleViolationError('REACTION_EXISTS', 'User has already reacted with this emoji');
    }

    userReactions.push(reaction.userId);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new CommentReactionAddedEvent({
        commentId: this.id.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        occurredAt: new Date(),
      })
    );
  }

  public removeReaction(emoji: string, userId: string): void {
    if (this.isDeleted()) {
      throw new BusinessRuleViolationError('CANNOT_REACT_TO_DELETED', 'Cannot react to a deleted comment');
    }

    if (!this.props.reactions.has(emoji)) {
      throw new BusinessRuleViolationError('REACTION_NOT_FOUND', 'No reactions found for this emoji');
    }

    const userReactions = this.props.reactions.get(emoji)!;
    const index = userReactions.indexOf(userId);

    if (index === -1) {
      throw new BusinessRuleViolationError('USER_REACTION_NOT_FOUND', 'User has not reacted with this emoji');
    }

    userReactions.splice(index, 1);

    if (userReactions.length === 0) {
      this.props.reactions.delete(emoji);
    }

    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new CommentReactionRemovedEvent({
        commentId: this.id.id,
        emoji,
        userId,
        occurredAt: new Date(),
      })
    );
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new BusinessRuleViolationError('ALREADY_DELETED', 'Comment is already deleted');
    }

    this.props.content = this.props.content.markAsDeleted();
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new CommentDeletedEvent({
        commentId: this.id.id,
        documentId: this.props.documentId.id,
        softDelete: true,
        occurredAt: new Date(),
      })
    );
  }

  public hardDelete(): void {
    if (this.isDeleted()) {
      throw new BusinessRuleViolationError('ALREADY_DELETED', 'Comment is already deleted');
    }

    this.addDomainEvent(
      new CommentDeletedEvent({
        commentId: this.id.id,
        documentId: this.props.documentId.id,
        softDelete: false,
        occurredAt: new Date(),
      })
    );
  }

  public hasReplies(): boolean {
    return this.props.parentId === undefined;
  }

  public isReply(): boolean {
    return this.props.parentId !== undefined;
  }

  public isDeleted(): boolean {
    return this.props.deletedAt !== undefined || this.props.content.isDeleted();
  }

  public canBeEditedBy(userId: string): boolean {
    return this.props.authorId === userId && !this.isDeleted();
  }

  public canBeDeletedBy(userId: string): boolean {
    return this.props.authorId === userId && !this.isDeleted();
  }

  public getReactionCount(emoji: string): number {
    return this.props.reactions.get(emoji)?.length || 0;
  }

  public getTotalReactions(): number {
    let total = 0;
    for (const users of this.props.reactions.values()) {
      total += users.length;
    }
    return total;
  }

  public getUserReaction(userId: string): string | undefined {
    for (const [emoji, users] of this.props.reactions.entries()) {
      if (users.includes(userId)) {
        return emoji;
      }
    }
    return undefined;
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  public equals(other: Comment): boolean {
    return this.id.equals(other.id);
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id.id,
      documentId: this.props.documentId.id,
      authorId: this.props.authorId,
      authorName: this.props.authorName,
      content: this.props.content.value,
      contentType: this.props.contentType,
      position: this.props.position?.toJSON(),
      parentId: this.props.parentId?.id,
      resolved: this.props.resolved,
      reactions: Object.fromEntries(this.props.reactions),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      deletedAt: this.props.deletedAt?.toISOString(),
    };
  }
}
