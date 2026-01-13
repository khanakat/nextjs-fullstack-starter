export class FileStatisticsDto {
  public readonly totalFiles: number;
  public readonly totalSize: number;
  public readonly totalSizeFormatted: string;
  public readonly byType: Record<string, number>;

  constructor(props: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    byType: Record<string, number>;
  }) {
    this.totalFiles = props.totalFiles;
    this.totalSize = props.totalSize;
    this.totalSizeFormatted = props.totalSizeFormatted;
    this.byType = props.byType;
  }

  public toObject() {
    return {
      totalFiles: this.totalFiles,
      totalSize: this.totalSize,
      totalSizeFormatted: this.totalSizeFormatted,
      byType: this.byType,
    };
  }
}
