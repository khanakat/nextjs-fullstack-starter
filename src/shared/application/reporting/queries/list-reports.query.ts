import { Query } from '../../base/query';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface ListReportsQueryProps {
  userId?: string;
  organizationId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class ListReportsQuery extends Query {
  readonly filterUserId?: UniqueId;
  readonly organizationId?: UniqueId;
  readonly status?: string;
  readonly page: number;
  readonly limit: number;

  constructor(props: ListReportsQueryProps = {}, userId?: string) {
    super(userId);
    this.filterUserId = props.userId ? UniqueId.create(props.userId) : undefined;
    this.organizationId = props.organizationId ? UniqueId.create(props.organizationId) : undefined;
    this.status = props.status;
    this.page = props.page || 1;
    this.limit = props.limit || 10;
  }
}
