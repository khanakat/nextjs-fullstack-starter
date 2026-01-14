export interface SearchResultHitDto {
  id: string;
  score: number;
  document: Record<string, any>;
  highlights?: Record<string, string[]>;
}

export interface SearchResultDto {
  totalHits: number;
  hits: SearchResultHitDto[];
  currentPage: number;
  totalPages: number;
  query: string;
  executionTime: number;
}

export interface SearchRequestDto {
  query: string;
  filters?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  page?: number;
  limit?: number;
}
