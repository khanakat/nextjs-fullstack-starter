import { ValueObject } from '../../../../shared/domain/base/value-object';
import { Result } from '../../../../shared/application/base/result';

/**
 * File Type Value Object
 * Represents the MIME type of a file
 */
export class FileType extends ValueObject<string> {
  private readonly VALID_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<FileType> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new Error('File type cannot be empty'));
    }

    return Result.success(new FileType(value));
  }

  public static fromValue(value: string): FileType {
    return new FileType(value);
  }

  public getValue(): string {
    return this._value;
  }

  public isImage(): boolean {
    return this._value.startsWith('image/');
  }

  public isVideo(): boolean {
    return this._value.startsWith('video/');
  }

  public isAudio(): boolean {
    return this._value.startsWith('audio/');
  }

  public isDocument(): boolean {
    return this._value.includes('pdf') ||
           this._value.includes('word') ||
           this._value.includes('excel') ||
           this._value.includes('powerpoint') ||
           this._value.includes('text');
  }

  public isArchive(): boolean {
    return this._value.includes('zip') ||
           this._value.includes('rar') ||
           this._value.includes('7z');
  }

  public getExtension(): string {
    const parts = this._value.split('/');
    return parts[parts.length - 1] || '';
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('File type cannot be empty');
    }
  }
}
