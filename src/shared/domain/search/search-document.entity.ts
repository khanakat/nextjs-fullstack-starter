import { Entity } from '../entity.base';
import { DocumentId } from './document-id.vo';
import { IndexName } from './index-name.vo';
import { Result } from '../result';

export interface SearchDocumentProps {
  id: DocumentId;
  indexName: IndexName;
  data: Record<string, any>;
  indexedAt?: Date;
  updatedAt: Date;
}

export class SearchDocument extends Entity<SearchDocumentProps> {
  get id(): DocumentId {
    return this.props.id;
  }

  get indexName(): IndexName {
    return this.props.indexName;
  }

  get data(): Record<string, any> {
    return this.props.data;
  }

  get indexedAt(): Date | undefined {
    return this.props.indexedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: SearchDocumentProps) {
    super(props);
  }

  static create(props: SearchDocumentProps): Result<SearchDocument> {
    if (!props.data || Object.keys(props.data).length === 0) {
      return Result.failure<SearchDocument>('Document data cannot be empty');
    }

    return Result.success<SearchDocument>(new SearchDocument(props));
  }

  updateData(newData: Record<string, any>): Result<SearchDocument> {
    if (!newData || Object.keys(newData).length === 0) {
      return Result.failure<SearchDocument>('New data cannot be empty');
    }

    this.props.data = { ...this.props.data, ...newData };
    this.props.updatedAt = new Date();

    return Result.success<SearchDocument>(this);
  }

  markAsIndexed(): Result<SearchDocument> {
    this.props.indexedAt = new Date();
    return Result.success<SearchDocument>(this);
  }
}
