import { ValueObject } from '../value-object.base';

export interface SearchQueryProps {
  query: string;
  filters?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  page?: number;
  limit?: number;
}

export class SearchQuery extends ValueObject<SearchQueryProps> {
  get query(): string {
    return this.props.query;
  }

  get filters(): Record<string, any> | undefined {
    return this.props.filters;
  }

  get sort(): Array<{ field: string; order: 'asc' | 'desc' }> | undefined {
    return this.props.sort;
  }

  get page(): number {
    return this.props.page || 1;
  }

  get limit(): number {
    return this.props.limit || 10;
  }

  private constructor(props: SearchQueryProps) {
    super(props);
  }

  static create(props: SearchQueryProps): SearchQuery {
    if (props.page !== undefined && props.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (props.limit !== undefined && (props.limit < 1 || props.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }

    return new SearchQuery({
      query: props.query,
      filters: props.filters,
      sort: props.sort,
      page: props.page,
      limit: props.limit,
    });
  }
}
