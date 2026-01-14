export interface SearchDocumentDto {
  id: string;
  indexName: string;
  data: Record<string, any>;
  indexedAt?: string;
  updatedAt: string;
}

export interface CreateSearchDocumentDto {
  indexName: string;
  documentId?: string;
  data: Record<string, any>;
}

export interface UpdateSearchDocumentDto {
  indexName: string;
  documentId: string;
  data: Record<string, any>;
}
