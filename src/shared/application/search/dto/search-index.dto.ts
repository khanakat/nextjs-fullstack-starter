export type IndexStatusDto = 'creating' | 'active' | 'updating' | 'deleting' | 'error';

export interface FieldMappingDto {
  type: 'text' | 'keyword' | 'number' | 'boolean' | 'date' | 'geo_point';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  aggregatable?: boolean;
}

export interface IndexSettingsDto {
  replicas?: number;
  shards?: number;
  refreshInterval?: string;
}

export interface SearchIndexDto {
  name: string;
  status: IndexStatusDto;
  fields: Record<string, FieldMappingDto>;
  settings?: IndexSettingsDto;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSearchIndexDto {
  indexName: string;
  mappings: Record<string, FieldMappingDto>;
  settings?: IndexSettingsDto;
}
