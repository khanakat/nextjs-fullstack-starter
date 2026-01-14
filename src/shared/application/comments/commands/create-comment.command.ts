import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface CreateCommentCommandProps {
  documentId: string;
  authorId: string;
  authorName: string;
  content: string;
  contentType: 'text' | 'code' | 'suggestion';
  position?: {
    pageNumber?: number;
    x?: number;
    y?: number;
    selection?: { start: number; end: number };
  };
  parentId?: string;
  metadata?: Record<string, any>;
}

export class CreateCommentCommand extends Command<CreateCommentCommandProps> {
  readonly documentId: UniqueId;
  readonly authorId: string;
  readonly authorName: string;
  readonly content: string;
  readonly contentType: 'text' | 'code' | 'suggestion';
  readonly position?: CreateCommentCommandProps['position'];
  readonly parentId?: CommentId;
  readonly metadata?: Record<string, any>;

  constructor(props: CreateCommentCommandProps) {
    super(props);
    this.documentId = UniqueId.create(props.documentId);
    this.authorId = props.authorId;
    this.authorName = props.authorName;
    this.content = props.content;
    this.contentType = props.contentType;
    this.position = props.position;
    this.parentId = props.parentId ? CommentId.create(props.parentId) : undefined;
    this.metadata = props.metadata;
  }
}
