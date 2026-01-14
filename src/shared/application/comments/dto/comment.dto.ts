export interface CommentDto {
  id: string;
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
  resolved: boolean;
  reactions: Record<string, string[]>; // emoji -> array of user IDs
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CommentThreadDto {
  comment: CommentDto;
  replies: CommentDto[];
}

export interface CreateCommentDto {
  documentId: string;
  content: string;
  contentType?: 'text' | 'code' | 'suggestion';
  position?: {
    pageNumber?: number;
    x?: number;
    y?: number;
    selection?: { start: number; end: number };
  };
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCommentDto {
  content?: string;
  resolved?: boolean;
  metadata?: Record<string, any>;
}

export interface PaginatedCommentsDto {
  comments: CommentDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
