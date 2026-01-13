import { NextRequest, NextResponse } from 'next/server';
import { DeleteWorkflowCommand } from '../../application/commands/delete-workflow-command';
import { DeleteWorkflowUseCase } from '../../application/use-cases/delete-workflow-use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Delete Workflow API Route
 * DELETE /api/workflows/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;

    // Create command
    const command = new DeleteWorkflowCommand(
      {
        workflowId: params.id,
        deletedBy: body.deletedBy || userId || '',
      },
      userId
    );

    // Create use case (in production, this would be injected via DI)
    const useCase = new DeleteWorkflowUseCase(null as any);

    // Execute use case
    const result = await useCase.execute(command);

    // Handle result
    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete workflow' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: 'Workflow deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
