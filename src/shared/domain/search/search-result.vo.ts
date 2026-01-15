import { ValueObject } from '@/shared/domain/base';

export interface SearchResultHit {
  id: string;
  score: number;
  document: Record<string, any>;
  highlights?: Record<string, string[]>;
}

export interface SearchResultProps {
  totalHits: number;
  hits: SearchResultHit[];
  currentPage: number;
  totalPages: number;
  query: string;
  executionTime: number;
}

export class SearchResult extends ValueObject<SearchResultProps> {
  get props(): SearchResultProps {
    return this.value;
  }

  get totalHits(): number {
    return this.props.totalHits;
  }

  get hits(): SearchResultHit[] {
    return this.props.hits;
  }

  get currentPage(): number {
    return this.props.currentPage;
  }

  get totalPages(): number {
    return this.props.totalPages;
  }

  get query(): string {
    return this.props.query;
  }

  get executionTime(): number {
    return this.props.executionTime;
  }

  private constructor(props: SearchResultProps) {
    super(props);
  }

  protected validate(value: SearchResultProps): void {
    if (value.totalHits < 0) {
      throw new Error('Total hits cannot be negative');
    }

    if (value.currentPage < 1) {
      throw new Error('Current page must be greater than 0');
    }

    if (value.totalPages < 0) {
      throw new Error('Total pages cannot be negative');
    }

    if (value.executionTime < 0) {
      throw new Error('Execution time cannot be negative');
    }
  }

  static create(props: SearchResultProps): SearchResult {
    return new SearchResult(props);
  }
}
