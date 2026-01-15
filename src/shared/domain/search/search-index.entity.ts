import { Entity } from '../base/entity';
import { IndexName } from '@/shared/domain/search/index-name.vo';
import { Result } from '../../application/base/result';

export type IndexStatus = 'creating' | 'active' | 'updating' | 'deleting' | 'error';

export interface FieldMapping {
  type: 'text' | 'keyword' | 'number' | 'boolean' | 'date' | 'geo_point';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  aggregatable?: boolean;
}

export interface IndexSettings {
  replicas?: number;
  shards?: number;
  refreshInterval?: string;
  analysis?: {
    analyzer?: Record<string, any>;
    tokenizer?: Record<string, any>;
    filter?: Record<string, any>;
  };
}

export interface SearchIndexProps {
  name: IndexName;
  status: IndexStatus;
  fields: Record<string, FieldMapping>;
  settings?: IndexSettings;
  documentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SearchIndex extends Entity<string> {
  private _props: SearchIndexProps;

  get name(): IndexName {
    return this._props.name;
  }

  get status(): IndexStatus {
    return this._props.status;
  }

  get fields(): Record<string, FieldMapping> {
    return this._props.fields;
  }

  get settings(): IndexSettings | undefined {
    return this._props.settings;
  }

  get documentCount(): number | undefined {
    return this._props.documentCount;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  private constructor(id: string, props: SearchIndexProps) {
    super(id);
    this._props = props;
  }

  static create(props: SearchIndexProps): Result<SearchIndex> {
    if (!props.fields || Object.keys(props.fields).length === 0) {
      return Result.failure<SearchIndex>(new Error('Index must have at least one field defined'));
    }

    const id = props.name.props.value;
    return Result.success<SearchIndex>(new SearchIndex(id, props));
  }

  updateStatus(status: IndexStatus): Result<SearchIndex> {
    const validStatuses: IndexStatus[] = ['creating', 'active', 'updating', 'deleting', 'error'];
    if (!validStatuses.includes(status)) {
      return Result.failure<SearchIndex>(new Error(`Invalid status: ${status}`));
    }

    this._props.status = status;
    this._props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  updateDocumentCount(count: number): Result<SearchIndex> {
    if (count < 0) {
      return Result.failure<SearchIndex>(new Error('Document count cannot be negative'));
    }

    this._props.documentCount = count;
    this._props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  addField(fieldName: string, mapping: FieldMapping): Result<SearchIndex> {
    if (this._props.fields[fieldName]) {
      return Result.failure<SearchIndex>(new Error(`Field '${fieldName}' already exists`));
    }

    this._props.fields[fieldName] = mapping;
    this._props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  updateSettings(settings: IndexSettings): Result<SearchIndex> {
    this._props.settings = { ...this._props.settings, ...settings };
    this._props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }
}
