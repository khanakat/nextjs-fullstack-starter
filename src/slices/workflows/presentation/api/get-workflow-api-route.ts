import { NextRequest, NextResponse } from 'next/server';
import { GetWorkflowQuery } from '../../application/queries/get-workflow-query';
import { GetWorkflowUseCase } from '../../application/use-cases/get-workflow-use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Get Workflow API Route
 * GET /api/workflows/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create query
    const userId = request.headers.get('x-user-id') || undefined;
    const query = new GetWorkflowQuery(
      { workflowId: params.id },
      userId
    );

    // Create use case (in production, this would be injected via DI)
    const useCase = new GetWorkflowUseCase(null as any);

    // Execute use case
    const result = await useCase.execute(query);

    // Handle result
    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to get workflow' },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json(
      { data: result.value },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
