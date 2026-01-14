import { Entity } from '../entity.base';
import { IndexName } from './index-name.vo';
import { Result } from '../result';

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

export class SearchIndex extends Entity<SearchIndexProps> {
  get name(): IndexName {
    return this.props.name;
  }

  get status(): IndexStatus {
    return this.props.status;
  }

  get fields(): Record<string, FieldMapping> {
    return this.props.fields;
  }

  get settings(): IndexSettings | undefined {
    return this.props.settings;
  }

  get documentCount(): number | undefined {
    return this.props.documentCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: SearchIndexProps) {
    super(props);
  }

  static create(props: SearchIndexProps): Result<SearchIndex> {
    if (!props.fields || Object.keys(props.fields).length === 0) {
      return Result.failure<SearchIndex>('Index must have at least one field defined');
    }

    return Result.success<SearchIndex>(new SearchIndex(props));
  }

  updateStatus(status: IndexStatus): Result<SearchIndex> {
    const validStatuses: IndexStatus[] = ['creating', 'active', 'updating', 'deleting', 'error'];
    if (!validStatuses.includes(status)) {
      return Result.failure<SearchIndex>(`Invalid status: ${status}`);
    }

    this.props.status = status;
    this.props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  updateDocumentCount(count: number): Result<SearchIndex> {
    if (count < 0) {
      return Result.failure<SearchIndex>('Document count cannot be negative');
    }

    this.props.documentCount = count;
    this.props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  addField(fieldName: string, mapping: FieldMapping): Result<SearchIndex> {
    if (this.props.fields[fieldName]) {
      return Result.failure<SearchIndex>(`Field '${fieldName}' already exists`);
    }

    this.props.fields[fieldName] = mapping;
    this.props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }

  updateSettings(settings: IndexSettings): Result<SearchIndex> {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();

    return Result.success<SearchIndex>(this);
  }
}
