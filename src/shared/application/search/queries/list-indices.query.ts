import { Query } from '../../base/query';

export interface ListIndicesQueryProps {
  page?: number;
  limit?: number;
}

export class ListIndicesQuery extends Query {
  readonly page: number;
  readonly limit: number;

  constructor(props: ListIndicesQueryProps = {}, userId?: string) {
    super(userId);
    this.page = props.page || 1;
    this.limit = props.limit || 10;
  }
}
