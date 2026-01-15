import { Query } from '../../base/query';
import { UniqueId } from '../../../domain/value-objects/unique-id';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface ListCommentsQueryProps {
  documentId?: string;
  sessionId?: string;
  threadId?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

export class ListCommentsQuery extends Query {
  readonly documentId?: UniqueId;
  readonly sessionId?: string;
  readonly threadId?: CommentId;
  readonly resolved?: boolean;
  readonly page: number;
  readonly limit: number;
  readonly offset: number;
  readonly sortBy: string;
  readonly sortOrder: string;

  constructor(props: ListCommentsQueryProps = {}, userId?: string) {
    super(userId);
    this.documentId = props.documentId ? UniqueId.create(props.documentId) : undefined;
    this.sessionId = props.sessionId;
    this.threadId = props.threadId ? CommentId.create(props.threadId) : undefined;
    this.resolved = props.resolved;
    this.page = props.page || 1;
    this.limit = props.limit || 50;
    this.offset = props.offset || 0;
    this.sortBy = props.sortBy || 'createdAt';
    this.sortOrder = props.sortOrder || 'desc';
  }
}
