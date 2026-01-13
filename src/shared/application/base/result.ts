/**
 * Result pattern implementation for handling success/failure scenarios
 * Provides a type-safe way to handle operations that can fail
 */
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: Error
  ) {}

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  get error(): Error {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static failure<T>(error: Error): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  /**
   * Maps the result value if successful, otherwise returns the failure
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.failure<U>(this.error);
    }
    try {
      return Result.success(fn(this.value));
    } catch (error) {
      return Result.failure<U>(error as Error);
    }
  }

  /**
   * Chains results together, useful for sequential operations
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.failure<U>(this.error);
    }
    return fn(this.value);
  }

  /**
   * Executes a function if the result is successful
   */
  public onSuccess(fn: (value: T) => void): Result<T> {
    if (this.isSuccess) {
      fn(this.value);
    }
    return this;
  }

  /**
   * Executes a function if the result is a failure
   */
  public onFailure(fn: (error: Error) => void): Result<T> {
    if (this.isFailure) {
      fn(this.error);
    }
    return this;
  }
}