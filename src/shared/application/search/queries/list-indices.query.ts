import { Query } from '../../query.base';

export interface ListIndicesQueryProps {
  page?: number;
  limit?: number;
}

export class ListIndicesQuery extends Query<ListIndicesQueryProps> {
  readonly page: number;
  readonly limit: number;

  constructor(props: ListIndicesQueryProps = {}) {
    super(props);
    this.page = props.page || 1;
    this.limit = props.limit || 10;
  }
}
