import { Entity } from '../../../../shared/domain/base/entity';
import { FileId } from '../value-objects/file-id';
import { FileType } from '../value-objects/file-type';

/**
 * File Entity
 * Represents a file uploaded to system
 */
export class File extends Entity<FileId> {
  private readonly _filename: string;
  private readonly _originalName: string;
  private readonly _mimeType: FileType;
  private readonly _size: number;
  private _url: string;
  private readonly _uploadedById: string | null;
  private readonly _createdAt: Date;

  private constructor(props: {
    id: FileId;
    filename: string;
    originalName: string;
    mimeType: FileType;
    size: number;
    url: string;
    uploadedById: string | null;
    createdAt: Date;
  }) {
    super(props.id);
    this._filename = props.filename;
    this._originalName = props.originalName;
    this._mimeType = props.mimeType;
    this._size = props.size;
    this._url = props.url;
    this._uploadedById = props.uploadedById;
    this._createdAt = props.createdAt;
  }

  public static create(props: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedById?: string;
  }): File {
    const fileTypeResult = FileType.create(props.mimeType);
    if (!fileTypeResult.isSuccess) {
      throw new Error(fileTypeResult.error?.message || 'Invalid file type');
    }

    return new File({
      id: FileId.fromValue(crypto.randomUUID()),
      filename: props.filename,
      originalName: props.originalName,
      mimeType: fileTypeResult.value,
      size: props.size,
      url: props.url,
      uploadedById: props.uploadedById || null,
      createdAt: new Date(),
    });
  }

  public static fromPrisma(data: any): File {
    const fileTypeResult = FileType.create(data.mimeType);
    if (!fileTypeResult.isSuccess) {
      throw new Error(fileTypeResult.error?.message || 'Invalid file type');
    }

    return new File({
      id: FileId.fromValue(data.id),
      filename: data.filename,
      originalName: data.originalName,
      mimeType: fileTypeResult.value,
      size: data.size,
      url: data.url,
      uploadedById: data.uploadedById || null,
      createdAt: data.createdAt || new Date(),
    });
  }

  // Getters
  public get filename(): string {
    return this._filename;
  }

  public get originalName(): string {
    return this._originalName;
  }

  public get mimeType(): FileType {
    return this._mimeType;
  }

  public get size(): number {
    return this._size;
  }

  public get url(): string {
    return this._url;
  }

  public get uploadedById(): string | null {
    return this._uploadedById;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // Business methods
  public getExtension(): string {
    return this._mimeType.getExtension();
  }

  public isImage(): boolean {
    return this._mimeType.isImage();
  }

  public isVideo(): boolean {
    return this._mimeType.isVideo();
  }

  public isAudio(): boolean {
    return this._mimeType.isAudio();
  }

  public isDocument(): boolean {
    return this._mimeType.isDocument();
  }

  public isArchive(): boolean {
    return this._mimeType.isArchive();
  }

  public getSizeInKB(): number {
    return Math.round(this._size / 1024);
  }

  public getSizeInMB(): number {
    return Math.round(this._size / (1024 * 1024) * 100) / 100;
  }

  public getSizeInGB(): number {
    return Math.round(this._size / (1024 * 1024 * 1024) * 100) / 100;
  }

  public getFormattedSize(): string {
    if (this._size < 1024) {
      return `${this._size} B`;
    } else if (this._size < 1024 * 1024) {
      return `${this.getSizeInKB()} KB`;
    } else if (this._size < 1024 * 1024 * 1024) {
      return `${this.getSizeInMB()} MB`;
    } else {
      return `${this.getSizeInGB()} GB`;
    }
  }

  public updateUrl(newUrl: string): void {
    this._url = newUrl;
  }
}
