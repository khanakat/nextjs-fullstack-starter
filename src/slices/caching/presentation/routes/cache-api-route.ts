import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { SetCacheHandler } from '../../../shared/application/handlers/set-cache-handler';
import { DeleteCacheHandler } from '../../../shared/application/handlers/delete-cache-handler';
import { InvalidateCacheHandler } from '../../../shared/application/handlers/invalidate-cache-handler';
import { ClearCacheHandler } from '../../../shared/application/handlers/clear-cache-handler';
import { GetCacheHandler } from '../../../shared/application/handlers/get-cache-handler';
import { GetCacheStatisticsHandler } from '../../../shared/application/handlers/get-cache-statistics-handler';
import { SetCacheCommand } from '../../../shared/application/commands/set-cache-command';
import { DeleteCacheCommand } from '../../../shared/application/commands/delete-cache-command';
import { InvalidateCacheCommand } from '../../../shared/application/commands/invalidate-cache-command';
import { ClearCacheCommand } from '../../../shared/application/commands/clear-cache-command';
import { GetCacheQuery } from '../../../shared/application/queries/get-cache-query';
import { GetCacheStatisticsQuery } from '../../../shared/application/queries/get-cache-statistics-query';

/**
 * Cache API Route
 * Handles HTTP requests for cache operations
 *
 * Endpoints:
 * - GET /api/cache/statistics - Get cache statistics
 * - GET /api/cache/[key] - Get value by key
 * - POST /api/cache - Set a value in cache
 * - DELETE /api/cache/[key] - Delete value by key
 * - POST /api/cache/invalidate - Invalidate cache by tag or pattern
 * - DELETE /api/cache/clear - Clear all cache
 */
@injectable()
export class CacheApiRoute {
  constructor(
    private readonly setCacheHandler: SetCacheHandler,
    private readonly deleteCacheHandler: DeleteCacheHandler,
    private readonly invalidateCacheHandler: InvalidateCacheHandler,
    private readonly clearCacheHandler: ClearCacheHandler,
    private readonly getCacheHandler: GetCacheHandler,
    private readonly getCacheStatisticsHandler: GetCacheStatisticsHandler
  ) {}

  /**
   * GET /api/cache/statistics
   * Get cache statistics
   */
  async getStatistics(request: NextRequest): Promise<NextResponse> {
    try {
      const query = new GetCacheStatisticsQuery();
      const result = await this.getCacheStatisticsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get statistics' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value?.toPlainObject() || {});
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/cache/[key]
   * Get a value by key
   */
  async get(request: NextRequest, key: string): Promise<NextResponse> {
    try {
      const query = new GetCacheQuery({ key });
      const result = await this.getCacheHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get cache value' },
          { status: 400 }
        );
      }

      if (!result.value) {
        return NextResponse.json(
          { error: 'Cache value not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ value: result.value });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/cache
   * Set a value in cache
   */
  async set(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new SetCacheCommand({
        key: body.key,
        value: body.value,
        ttl: body.ttl,
        tags: body.tags,
      });

      const result = await this.setCacheHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to set cache value' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/cache/[key]
   * Delete a value by key
   */
  async delete(request: NextRequest, key: string): Promise<NextResponse> {
    try {
      const command = new DeleteCacheCommand({ key });
      const result = await this.deleteCacheHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete cache value' },
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
   * POST /api/cache/invalidate
   * Invalidate cache by tag or pattern
   */
  async invalidate(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new InvalidateCacheCommand({
        tag: body.tag,
        pattern: body.pattern,
      });

      const result = await this.invalidateCacheHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to invalidate cache' },
          { status: 400 }
        );
      }

      return NextResponse.json({ count: result.value });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/cache/clear
   * Clear all cache
   */
  async clear(request: NextRequest): Promise<NextResponse> {
    try {
      const command = new ClearCacheCommand();
      const result = await this.clearCacheHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to clear cache' },
          { status: 400 }
        );
      }

      return NextResponse.json({ count: result.value });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

/**
 * Next.js API route handler
 * This is actual function that Next.js will call
 */
export async function GET(request: NextRequest, { params }: { params: { key?: string } }) {
  const apiRoute = new CacheApiRoute(
    {} as any, // setCacheHandler
    {} as any, // deleteCacheHandler
    {} as any, // invalidateCacheHandler
    {} as any, // clearCacheHandler
    {} as any, // getCacheHandler
    {} as any, // getCacheStatisticsHandler
  );

  if (params?.key) {
    // Get value by key
    return await apiRoute.get(request, params.key);
  }

  // Get statistics
  return await apiRoute.getStatistics(request);
}

export async function POST(request: NextRequest) {
  const apiRoute = new CacheApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return await apiRoute.set(request);
}

export async function DELETE(request: NextRequest, { params }: { params: { key?: string } }) {
  const apiRoute = new CacheApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  if (params?.key) {
    // Delete value by key
    return await apiRoute.delete(request, params.key);
  }

  // Clear all cache
  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  );
}
