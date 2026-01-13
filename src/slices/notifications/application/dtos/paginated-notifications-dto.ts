import { PaginatedResultDto, PaginationMetaDto } from '../../../../shared/application/base/dto';
import { NotificationDto } from './notification-dto';

export class PaginatedNotificationsDto implements PaginatedResultDto<NotificationDto> {
  public readonly data: NotificationDto[];
  public readonly pagination: PaginationMetaDto;
  public readonly total: number;

  constructor(props: {
    data: NotificationDto[];
    pagination: PaginationMetaDto;
  }) {
    this.data = props.data;
    this.pagination = props.pagination;
    this.total = props.pagination.total;
  }

  public toObject() {
    return {
      data: this.data.map(dto => dto.toObject()),
      pagination: this.pagination,
      total: this.total,
    };
  }
}
