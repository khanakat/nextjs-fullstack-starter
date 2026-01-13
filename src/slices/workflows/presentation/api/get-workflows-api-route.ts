import { NextRequest, NextResponse } from 'next/server';
import { GetWorkflowsQuery } from '../../application/queries/get-workflows-query';
import { GetWorkflowsUseCase } from '../../application/use-cases/get-workflows-use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Get Workflows API Route
 * GET /api/workflows
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const isTemplate = searchParams.get('isTemplate');
    const isPublic = searchParams.get('isPublic');
    const userId = request.headers.get('x-user-id') || undefined;

    // Create query
    const query = new GetWorkflowsQuery(
      {
        organizationId: organizationId || undefined,
        status: (status as any) || undefined,
        isTemplate: isTemplate ? isTemplate === 'true' : undefined,
        isPublic: isPublic ? isPublic === 'true' : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      },
      userId
    );

    // Create use case (in production, this would be injected via DI)
    const useCase = new GetWorkflowsUseCase(null as any);

    // Execute use case
    const result = await useCase.execute(query);

    // Handle result
    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to get workflows' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { data: result.value },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
