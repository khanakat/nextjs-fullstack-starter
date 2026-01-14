import { ValueObject } from '../../base/value-object';

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

  static create(props: CommentPositionProps = {}): CommentPosition {
    if (props.pageNumber !== undefined && props.pageNumber < 0) {
      throw new Error('Page number cannot be negative');
    }

    if (props.x !== undefined && (props.x < 0 || props.x > 100)) {
      throw new Error('X position must be between 0 and 100');
    }

    if (props.y !== undefined && (props.y < 0 || props.y > 100)) {
      throw new Error('Y position must be between 0 and 100');
    }

    if (props.selection) {
      if (props.selection.start < 0 || props.selection.end < 0) {
        throw new Error('Selection positions cannot be negative');
      }
      if (props.selection.end < props.selection.start) {
        throw new Error('Selection end must be greater than or equal to start');
      }
    }

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
