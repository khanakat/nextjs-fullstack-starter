import { UniqueId } from '../value-objects/unique-id';

export class SearchId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): SearchId {
    return new SearchId(value || UniqueId.generate().value);
  }
}
