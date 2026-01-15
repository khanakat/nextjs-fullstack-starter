import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { IndexDocumentHandler } from '../../../../shared/application/search/handlers/index-document.handler';
import { UpdateDocumentHandler } from '../../../../shared/application/search/handlers/update-document.handler';
import { DeleteDocumentHandler } from '../../../../shared/application/search/handlers/delete-document.handler';
import { CreateIndexHandler } from '../../../../shared/application/search/handlers/create-index.handler';
import { DeleteIndexHandler } from '../../../../shared/application/search/handlers/delete-index.handler';
import { BulkIndexDocumentsHandler } from '../../../../shared/application/search/handlers/bulk-index-documents.handler';
import { SearchHandler } from '../../../../shared/application/search/handlers/search.handler';
import { GetDocumentHandler } from '../../../../shared/application/search/handlers/get-document.handler';
import { GetIndexHandler } from '../../../../shared/application/search/handlers/get-index.handler';
import { ListIndicesHandler } from '../../../../shared/application/search/handlers/list-indices.handler';
import { GetSuggestionsHandler } from '../../../../shared/application/search/handlers/get-suggestions.handler';
import { GetIndexStatsHandler } from '../../../../shared/application/search/handlers/get-index-stats.handler';
import { IndexDocumentCommand } from '../../../../shared/application/search/commands/index-document.command';
import { UpdateDocumentCommand } from '../../../../shared/application/search/commands/update-document.command';
import { DeleteDocumentCommand } from '../../../../shared/application/search/commands/delete-document.command';
import { CreateIndexCommand } from '../../../../shared/application/search/commands/create-index.command';
import { DeleteIndexCommand } from '../../../../shared/application/search/commands/delete-index.command';
import { BulkIndexDocumentsCommand } from '../../../../shared/application/search/commands/bulk-index-documents.command';
import { PerformSearchQuery as SearchQry } from '../../../../shared/application/search/queries/search.query';
import { GetDocumentQuery } from '../../../../shared/application/search/queries/get-document.query';
import { GetIndexQuery } from '../../../../shared/application/search/queries/get-index.query';
import { ListIndicesQuery } from '../../../../shared/application/search/queries/list-indices.query';
import { GetSuggestionsQuery } from '../../../../shared/application/search/queries/get-suggestions.query';
import { GetIndexStatsQuery } from '../../../../shared/application/search/queries/get-index-stats.query';

/**
 * Search API Route
 * Handles HTTP requests for search operations
 *
 * Endpoints:
 * - POST /api/search - Search documents
 * - POST /api/search/documents - Index a document
 * - PUT /api/search/documents - Update a document
 * - DELETE /api/search/documents/[indexName]/[documentId] - Delete a document
 * - GET /api/search/documents/[indexName]/[documentId] - Get a document
 * - POST /api/search/documents/bulk - Bulk index documents
 * - POST /api/search/indices - Create an index
 * - DELETE /api/search/indices/[indexName] - Delete an index
 * - GET /api/search/indices/[indexName] - Get an index
 * - GET /api/search/indices - List all indices
 * - GET /api/search/indices/[indexName]/stats - Get index statistics
 * - GET /api/search/suggestions - Get search suggestions
 */
@injectable()
export class SearchApiRoute {
  constructor(
    private readonly indexDocumentHandler: IndexDocumentHandler,
    private readonly updateDocumentHandler: UpdateDocumentHandler,
    private readonly deleteDocumentHandler: DeleteDocumentHandler,
    private readonly createIndexHandler: CreateIndexHandler,
    private readonly deleteIndexHandler: DeleteIndexHandler,
    private readonly bulkIndexDocumentsHandler: BulkIndexDocumentsHandler,
    private readonly searchHandler: SearchHandler,
    private readonly getDocumentHandler: GetDocumentHandler,
    private readonly getIndexHandler: GetIndexHandler,
    private readonly listIndicesHandler: ListIndicesHandler,
    private readonly getSuggestionsHandler: GetSuggestionsHandler,
    private readonly getIndexStatsHandler: GetIndexStatsHandler
  ) {}

  /**
   * POST /api/search
   * Search documents
   */
  async search(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const query = new SearchQry({
        indexName: body.indexName,
        query: body.query,
        filters: body.filters,
        sort: body.sort,
        page: body.page,
        limit: body.limit,
      });

      const result = await this.searchHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Search failed' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/search/documents
   * Index a document
   */
  async indexDocument(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new IndexDocumentCommand({
        indexName: body.indexName,
        documentId: body.documentId,
        data: body.data,
      });

      const result = await this.indexDocumentHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to index document' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          id: result.value.id,
          indexName: result.value.indexName.value.value,
          data: result.value.data,
        },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/search/documents
   * Update a document
   */
  async updateDocument(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UpdateDocumentCommand({
        indexName: body.indexName,
        documentId: body.documentId,
        data: body.data,
      });

      const result = await this.updateDocumentHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to update document' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        id: result.value.id,
        indexName: result.value.indexName.value.value,
        data: result.value.data,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/search/documents/[indexName]/[documentId]
   * Delete a document
   */
  async deleteDocument(request: NextRequest, indexName: string, documentId: string): Promise<NextResponse> {
    try {
      const command = new DeleteDocumentCommand({
        indexName,
        documentId,
      });

      const result = await this.deleteDocumentHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to delete document' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/search/documents/[indexName]/[documentId]
   * Get a document
   */
  async getDocument(request: NextRequest, indexName: string, documentId: string): Promise<NextResponse> {
    try {
      const query = new GetDocumentQuery({
        indexName,
        documentId,
      });

      const result = await this.getDocumentHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to get document' },
          { status: 400 }
        );
      }

      if (!result.value) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: result.value.id,
        indexName: result.value.indexName.value.value,
        data: result.value.data,
        indexedAt: result.value.indexedAt?.toISOString(),
        updatedAt: result.value.updatedAt.toISOString(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/search/documents/bulk
   * Bulk index documents
   */
  async bulkIndexDocuments(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new BulkIndexDocumentsCommand({
        indexName: body.indexName,
        documents: body.documents,
      });

      const result = await this.bulkIndexDocumentsHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to bulk index documents' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        successful: result.value.length,
        documents: result.value.map((doc) => ({
          id: doc.id,
          indexName: doc.indexName.value.value,
        })),
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/search/indices
   * Create an index
   */
  async createIndex(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateIndexCommand({
        indexName: body.indexName,
        mappings: body.mappings,
        settings: body.settings,
      });

      const result = await this.createIndexHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to create index' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, indexName: body.indexName },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/search/indices/[indexName]
   * Delete an index
   */
  async deleteIndex(request: NextRequest, indexName: string): Promise<NextResponse> {
    try {
      const command = new DeleteIndexCommand({
        indexName,
      });

      const result = await this.deleteIndexHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to delete index' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/search/indices/[indexName]
   * Get an index
   */
  async getIndex(request: NextRequest, indexName: string): Promise<NextResponse> {
    try {
      const query = new GetIndexQuery({
        indexName,
      });

      const result = await this.getIndexHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to get index' },
          { status: 400 }
        );
      }

      if (!result.value) {
        return NextResponse.json(
          { error: 'Index not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        name: result.value.name.value,
        status: result.value.status,
        fields: result.value.fields,
        settings: result.value.settings,
        documentCount: result.value.documentCount,
        createdAt: result.value.createdAt.toISOString(),
        updatedAt: result.value.updatedAt.toISOString(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/search/indices
   * List all indices
   */
  async listIndices(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const query = new ListIndicesQuery({ page, limit });
      const result = await this.listIndicesHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to list indices' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        indices: result.value.map((index) => ({
          name: index.name.value,
          status: index.status,
          documentCount: index.documentCount,
          createdAt: index.createdAt.toISOString(),
        })),
        count: result.value.length,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/search/indices/[indexName]/stats
   * Get index statistics
   */
  async getIndexStats(request: NextRequest, indexName: string): Promise<NextResponse> {
    try {
      const query = new GetIndexStatsQuery({
        indexName,
      });

      const result = await this.getIndexStatsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to get index stats' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/search/suggestions
   * Get search suggestions
   */
  async getSuggestions(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const prefix = searchParams.get('prefix') || '';
      const indexName = searchParams.get('indexName') || undefined;
      const limit = parseInt(searchParams.get('limit') || '10');

      const query = new GetSuggestionsQuery({
        prefix,
        indexName,
        limit,
      });

      const result = await this.getSuggestionsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error || 'Failed to get suggestions' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        suggestions: result.value,
        count: result.value.length,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
