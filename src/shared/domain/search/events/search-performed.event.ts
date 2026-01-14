import { DomainEvent } from '../../domain-event.base';
import { SearchQuery } from '../search-query.vo';
import { SearchResult } from '../search-result.vo';

export interface SearchPerformedEventProps {
  query: SearchQuery;
  result: SearchResult;
  userId?: string;
  occurredAt: Date;
}

export class SearchPerformedEvent extends DomainEvent {
  readonly query: SearchQuery;
  readonly result: SearchResult;
  readonly userId?: string;

  constructor(props: SearchPerformedEventProps) {
    super(props.occurredAt);
    this.query = props.query;
    this.result = props.result;
    this.userId = props.userId;
  }
}
