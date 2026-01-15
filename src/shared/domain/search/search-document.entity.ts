import { Entity } from '../base/entity';
import { DocumentId } from '@/shared/domain/search/document-id.vo';
import { IndexName } from '@/shared/domain/search/index-name.vo';
import { Result } from '../../application/base/result';

export interface SearchDocumentProps {
  id: DocumentId;
  indexName: IndexName;
  data: Record<string, any>;
  indexedAt?: Date;
  updatedAt: Date;
}

export class SearchDocument extends Entity<string> {
  private _props: SearchDocumentProps;

  get documentId(): DocumentId {
    return this._props.id;
  }

  get indexName(): IndexName {
    return this._props.indexName;
  }

  get data(): Record<string, any> {
    return this._props.data;
  }

  get indexedAt(): Date | undefined {
    return this._props.indexedAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  private constructor(id: string, props: SearchDocumentProps) {
    super(id);
    this._props = props;
  }

  static create(props: SearchDocumentProps): Result<SearchDocument> {
    if (!props.data || Object.keys(props.data).length === 0) {
      return Result.failure<SearchDocument>(new Error('Document data cannot be empty'));
    }

    const id = props.id.props.value;
    return Result.success<SearchDocument>(new SearchDocument(id, props));
  }

  updateData(newData: Record<string, any>): Result<SearchDocument> {
    if (!newData || Object.keys(newData).length === 0) {
      return Result.failure<SearchDocument>(new Error('New data cannot be empty'));
    }

    this._props.data = { ...this._props.data, ...newData };
    this._props.updatedAt = new Date();

    return Result.success<SearchDocument>(this);
  }

  markAsIndexed(): Result<SearchDocument> {
    this._props.indexedAt = new Date();
    return Result.success<SearchDocument>(this);
  }
}
