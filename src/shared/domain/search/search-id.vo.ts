import { UniqueId } from '../unique-id/unique-id.vo';

export class SearchId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): SearchId {
    return new SearchId(value || UniqueId.generate().value);
  }
}
