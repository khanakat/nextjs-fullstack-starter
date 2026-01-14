import { ISearchService } from '../../domain/search/isearch.service';
import { SearchQuery } from '../../domain/search/search-query.vo';
import { SearchResult } from '../../domain/search/search-result.vo';
import { SearchDocument } from '../../domain/search/search-document.entity';
import { DocumentId } from '../../domain/search/document-id.vo';
import { IndexName } from '../../domain/search/index-name.vo';
import { Result } from '../../domain/result';

/**
 * Elasticsearch Integration Service
 *
 * This service provides integration with Elasticsearch/Meilisearch search engines.
 * It implements the ISearchService interface to support document indexing, searching,
 * and index management operations.
 *
 * Features:
 * - Document CRUD operations
 * - Bulk operations for efficient indexing
 * - Full-text search with filters and sorting
 * - Index management (create, delete, stats)
 * - Search suggestions/autocomplete
 *
 * In production, this would use:
 * - @elastic/elasticsearch for Elasticsearch
 * - or meilisearch-js for Meilisearch
 *
 * For now, this is a placeholder implementation with in-memory storage.
 */
export class ElasticsearchIntegrationService implements ISearchService {
  private documents: Map<string, any> = new Map();
  private indices: Map<string, any> = new Map();

  // Document operations

  async indexDocument(document: SearchDocument): Promise<Result<SearchDocument>> {
    const key = `${document.indexName.value}:${document.id.value}`;

    this.documents.set(key, {
      id: document.id.value,
      indexName: document.indexName.value,
      data: document.data,
      indexedAt: new Date().toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    });

    const indexedDoc = document.markAsIndexed();
    if (indexedDoc.isFailure) {
      return Result.failure<SearchDocument>(indexedDoc.error);
    }

    return Result.success<SearchDocument>(indexedDoc.value);
  }

  async updateDocument(document: SearchDocument): Promise<Result<SearchDocument>> {
    const key = `${document.indexName.value}:${document.id.value}`;
    const existing = this.documents.get(key);

    if (!existing) {
      return Result.failure<SearchDocument>(`Document not found: ${document.id.value}`);
    }

    const updatedData = { ...existing.data, ...document.data };
    document.updateData(updatedData);

    this.documents.set(key, {
      ...existing,
      data: updatedData,
      updatedAt: new Date().toISOString(),
    });

    return Result.success<SearchDocument>(document);
  }

  async deleteDocument(documentId: DocumentId, indexName: IndexName): Promise<Result<void>> {
    const key = `${indexName.value}:${documentId.value}`;

    if (!this.documents.has(key)) {
      return Result.failure<void>(`Document not found: ${documentId.value}`);
    }

    this.documents.delete(key);
    return Result.success<void>(undefined);
  }

  async getDocument(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>> {
    const key = `${indexName.value}:${documentId.value}`;
    const doc = this.documents.get(key);

    if (!doc) {
      return Result.success<SearchDocument | null>(null);
    }

    const document = SearchDocument.create({
      id: DocumentId.create(doc.id),
      indexName: IndexName.create(doc.indexName),
      data: doc.data,
      indexedAt: doc.indexedAt ? new Date(doc.indexedAt) : undefined,
      updatedAt: new Date(doc.updatedAt),
    });

    if (document.isFailure) {
      return Result.failure<SearchDocument | null>(document.error);
    }

    return Result.success<SearchDocument | null>(document.value);
  }

  // Bulk operations

  async bulkIndexDocuments(documents: SearchDocument[]): Promise<Result<SearchDocument[]>> {
    const results: SearchDocument[] = [];

    for (const document of documents) {
      const result = await this.indexDocument(document);
      if (result.isSuccess) {
        results.push(result.value);
      }
    }

    return Result.success<SearchDocument[]>(results);
  }

  async bulkDeleteDocuments(documentIds: DocumentId[], indexName: IndexName): Promise<Result<void>> {
    for (const documentId of documentIds) {
      const key = `${indexName.value}:${documentId.value}`;
      this.documents.delete(key);
    }

    return Result.success<void>(undefined);
  }

  // Search operations

  async search(query: SearchQuery, indexName: IndexName): Promise<Result<SearchResult>> {
    const startTime = Date.now();

    // Get all documents for the index
    const indexDocuments = Array.from(this.documents.values()).filter(
      (doc) => doc.indexName === indexName.value
    );

    // Filter by query text
    const queryLower = query.query.toLowerCase();
    let hits = indexDocuments.filter((doc) => {
      const searchText = JSON.stringify(doc.data).toLowerCase();
      return searchText.includes(queryLower);
    });

    // Apply filters if provided
    if (query.filters) {
      hits = hits.filter((doc) => {
        return Object.entries(query.filters!).every(([key, value]) => {
          const docValue = this.getNestedValue(doc.data, key);
          return docValue === value;
        });
      });
    }

    // Apply sorting if provided
    if (query.sort && query.sort.length > 0) {
      hits.sort((a, b) => {
        for (const sortItem of query.sort!) {
          const aValue = this.getNestedValue(a.data, sortItem.field);
          const bValue = this.getNestedValue(b.data, sortItem.field);

          if (aValue !== bValue) {
            const comparison = aValue < bValue ? -1 : 1;
            return sortItem.order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const totalHits = hits.length;
    const totalPages = Math.ceil(totalHits / query.limit);

    // Apply pagination
    const paginatedHits = hits.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit
    );

    const executionTime = Date.now() - startTime;

    const searchResult = SearchResult.create({
      totalHits,
      hits: paginatedHits.map((hit) => ({
        id: hit.id,
        score: 1.0, // Placeholder score
        document: hit.data,
      })),
      currentPage: query.page,
      totalPages,
      query: query.query,
      executionTime,
    });

    if (searchResult.isFailure) {
      return Result.failure<SearchResult>(searchResult.error);
    }

    return Result.success<SearchResult>(searchResult.value);
  }

  async searchMultipleIndices(query: SearchQuery, indexNames: IndexName[]): Promise<Result<SearchResult>> {
    const startTime = Date.now();
    const allHits: any[] = [];

    // Search across all indices
    for (const indexName of indexNames) {
      const result = await this.search(query, indexName);
      if (result.isSuccess) {
        allHits.push(...result.value.hits);
      }
    }

    // Merge and sort results by score
    allHits.sort((a, b) => b.score - a.score);

    const totalHits = allHits.length;
    const totalPages = Math.ceil(totalHits / query.limit);

    // Apply pagination
    const paginatedHits = allHits.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit
    );

    const executionTime = Date.now() - startTime;

    const searchResult = SearchResult.create({
      totalHits,
      hits: paginatedHits,
      currentPage: query.page,
      totalPages,
      query: query.query,
      executionTime,
    });

    if (searchResult.isFailure) {
      return Result.failure<SearchResult>(searchResult.error);
    }

    return Result.success<SearchResult>(searchResult.value);
  }

  // Index operations

  async createIndex(indexName: IndexName, mappings: Record<string, any>): Promise<Result<void>> {
    if (this.indices.has(indexName.value)) {
      return Result.failure<void>(`Index already exists: ${indexName.value}`);
    }

    this.indices.set(indexName.value, {
      name: indexName.value,
      mappings: mappings.properties || mappings,
      settings: mappings.settings || {},
      createdAt: new Date().toISOString(),
    });

    return Result.success<void>(undefined);
  }

  async deleteIndex(indexName: IndexName): Promise<Result<void>> {
    if (!this.indices.has(indexName.value)) {
      return Result.failure<void>(`Index not found: ${indexName.value}`);
    }

    // Delete all documents in the index
    await this.deleteByIndexName(indexName);

    // Delete the index
    this.indices.delete(indexName.value);

    return Result.success<void>(undefined);
  }

  async indexExists(indexName: IndexName): Promise<Result<boolean>> {
    return Result.success<boolean>(this.indices.has(indexName.value));
  }

  async getIndexStats(indexName: IndexName): Promise<Result<Record<string, any>>> {
    const index = this.indices.get(indexName.value);

    if (!index) {
      return Result.failure<Record<string, any>>(`Index not found: ${indexName.value}`);
    }

    const documentCount = await this.countDocumentsInIndex(indexName);

    return Result.success<Record<string, any>>({
      indexName: indexName.value,
      documentCount,
      mappings: index.mappings,
      settings: index.settings,
      createdAt: index.createdAt,
      health: 'green' as const, // Placeholder health status
      storageSize: 0, // Placeholder storage size
      primaryShards: 1, // Placeholder shard count
      replicaShards: 0, // Placeholder replica count
    });
  }

  // Suggestion operations

  async getSuggestions(prefix: string, indexName?: IndexName, limit: number = 10): Promise<Result<string[]>> {
    const prefixLower = prefix.toLowerCase();
    const suggestions = new Set<string>();

    // If index name is specified, only search that index
    const documentsToSearch = indexName
      ? Array.from(this.documents.values()).filter((doc) => doc.indexName === indexName.value)
      : Array.from(this.documents.values());

    // Extract suggestions from document data
    for (const doc of documentsToSearch) {
      const searchInObject = (obj: any, depth: number = 0) => {
        if (depth > 2) return; // Limit recursion depth

        if (typeof obj === 'string' && obj.toLowerCase().startsWith(prefixLower)) {
          suggestions.add(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach((item) => searchInObject(item, depth + 1));
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach((value) => searchInObject(value, depth + 1));
        }
      };

      searchInObject(doc.data);

      if (suggestions.size >= limit) {
        break;
      }
    }

    return Result.success<string[]>(Array.from(suggestions).slice(0, limit));
  }

  // Helper methods

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async deleteByIndexName(indexName: IndexName): Promise<void> {
    const keysToDelete = Array.from(this.documents.keys()).filter((key) =>
      key.startsWith(`${indexName.value}:`)
    );

    keysToDelete.forEach((key) => this.documents.delete(key));
  }

  private async countDocumentsInIndex(indexName: IndexName): Promise<number> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.indexName === indexName.value
    ).length;
  }
}
