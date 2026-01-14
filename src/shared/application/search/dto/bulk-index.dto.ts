export interface BulkIndexDocumentDto {
  documentId?: string;
  data: Record<string, any>;
}

export interface BulkIndexDocumentsDto {
  indexName: string;
  documents: BulkIndexDocumentDto[];
}

export interface BulkIndexResultDto {
  successful: number;
  failed: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;
}
