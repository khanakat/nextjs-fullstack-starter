import { ValueObject } from '../value-object.base';

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

  static create(props: SearchResultProps): SearchResult {
    if (props.totalHits < 0) {
      throw new Error('Total hits cannot be negative');
    }

    if (props.currentPage < 1) {
      throw new Error('Current page must be greater than 0');
    }

    if (props.totalPages < 0) {
      throw new Error('Total pages cannot be negative');
    }

    if (props.executionTime < 0) {
      throw new Error('Execution time cannot be negative');
    }

    return new SearchResult(props);
  }
}
