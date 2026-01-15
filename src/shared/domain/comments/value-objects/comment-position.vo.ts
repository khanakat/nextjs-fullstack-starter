import { ValueObject } from '@/shared/domain/base';

export interface CommentPositionProps {
  pageNumber?: number;
  x?: number;
  y?: number;
  selection?: {
    start: number;
    end: number;
  };
}

export class CommentPosition extends ValueObject<CommentPositionProps> {
  get props(): CommentPositionProps {
    return this.value;
  }

  readonly pageNumber?: number;
  readonly x?: number;
  readonly y?: number;
  readonly selection?: {
    start: number;
    end: number;
  };

  private constructor(props: CommentPositionProps) {
    super(props);
    this.pageNumber = props.pageNumber;
    this.x = props.x;
    this.y = props.y;
    this.selection = props.selection;
  }

  protected validate(value: CommentPositionProps): void {
    if (value.pageNumber !== undefined && value.pageNumber < 0) {
      throw new Error('Page number cannot be negative');
    }

    if (value.x !== undefined && (value.x < 0 || value.x > 100)) {
      throw new Error('X position must be between 0 and 100');
    }

    if (value.y !== undefined && (value.y < 0 || value.y > 100)) {
      throw new Error('Y position must be between 0 and 100');
    }

    if (value.selection) {
      if (value.selection.start < 0 || value.selection.end < 0) {
        throw new Error('Selection positions cannot be negative');
      }
      if (value.selection.end < value.selection.start) {
        throw new Error('Selection end must be greater than or equal to start');
      }
    }
  }

  static create(props: CommentPositionProps = {}): CommentPosition {
    return new CommentPosition(props);
  }

  isEmpty(): boolean {
    return (
      this.pageNumber === undefined &&
      this.x === undefined &&
      this.y === undefined &&
      this.selection === undefined
    );
  }

  toJSON(): Record<string, any> {
    const json: Record<string, any> = {};
    if (this.pageNumber !== undefined) json.pageNumber = this.pageNumber;
    if (this.x !== undefined) json.x = this.x;
    if (this.y !== undefined) json.y = this.y;
    if (this.selection) json.selection = this.selection;
    return json;
  }
}
