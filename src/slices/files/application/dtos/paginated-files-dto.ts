export class PaginatedFilesDto {
  public readonly files: any[];
  public readonly total: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly totalPages: number;

  constructor(props: {
    files: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }) {
    this.files = props.files;
    this.total = props.total;
    this.page = props.page;
    this.pageSize = props.pageSize;
    this.totalPages = props.totalPages;
  }

  public toObject() {
    return {
      files: this.files,
      total: this.total,
      page: this.page,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
    };
  }
}
