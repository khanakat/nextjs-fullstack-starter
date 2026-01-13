/**
 * Base Value Object class following DDD principles
 * Value objects are immutable and defined by their attributes
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = Object.freeze(value);
  }

  get value(): T {
    return this._value;
  }

  // Convenience accessor expected by some tests
  public getValue(): T {
    return this._value;
  }

  protected abstract validate(value: T): void;

  public equals(vo: ValueObject<T>): boolean {
    if (!(vo instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this._value) === JSON.stringify(vo._value);
  }

  public toString(): string {
    return `${this.constructor.name}(${JSON.stringify(this._value)})`;
  }

  /**
   * Creates a deep copy of the value object
   */
  public clone(): this {
    const Constructor = this.constructor as new (value: T) => this;
    return new Constructor(this._value);
  }
}