export class FileDto {
  public readonly id: string;
  public readonly filename: string;
  public readonly originalName: string;
  public readonly mimeType: string;
  public readonly size: number;
  public readonly url: string;
  public readonly uploadedById: string | null;
  public readonly createdAt: Date;
  public readonly extension: string;
  public readonly isImage: boolean;
  public readonly isVideo: boolean;
  public readonly isAudio: boolean;
  public readonly isDocument: boolean;
  public readonly isArchive: boolean;
  public readonly formattedSize: string;

  constructor(props: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedById: string | null;
    createdAt: Date;
    extension: string;
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
    isArchive: boolean;
    formattedSize: string;
  }) {
    this.id = props.id;
    this.filename = props.filename;
    this.originalName = props.originalName;
    this.mimeType = props.mimeType;
    this.size = props.size;
    this.url = props.url;
    this.uploadedById = props.uploadedById;
    this.createdAt = props.createdAt;
    this.extension = props.extension;
    this.isImage = props.isImage;
    this.isVideo = props.isVideo;
    this.isAudio = props.isAudio;
    this.isDocument = props.isDocument;
    this.isArchive = props.isArchive;
    this.formattedSize = props.formattedSize;
  }

  public toObject() {
    return {
      id: this.id,
      filename: this.filename,
      originalName: this.originalName,
      mimeType: this.mimeType,
      size: this.size,
      url: this.url,
      uploadedById: this.uploadedById,
      createdAt: this.createdAt.toISOString(),
      extension: this.extension,
      isImage: this.isImage,
      isVideo: this.isVideo,
      isAudio: this.isAudio,
      isDocument: this.isDocument,
      isArchive: this.isArchive,
      formattedSize: this.formattedSize,
    };
  }
}
