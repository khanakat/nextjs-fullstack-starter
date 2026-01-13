export class UnreadCountDto {
  public readonly count: number;

  constructor(count: number) {
    this.count = count;
  }

  public toObject() {
    return {
      count: this.count,
    };
  }
}
