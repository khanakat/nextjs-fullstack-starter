import { NextRequest, NextResponse } from 'next/server';
import { UpdateWorkflowCommand } from '../../application/commands/update-workflow-command';
import { UpdateWorkflowUseCase } from '../../application/use-cases/update-workflow-use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Update Workflow API Route
 * PUT /api/workflows/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;

    // Create command
    const command = new UpdateWorkflowCommand(
      {
        workflowId: params.id,
        name: body.name,
        description: body.description,
        definition: body.definition,
        settings: body.settings,
        variables: body.variables,
        status: body.status,
        isTemplate: body.isTemplate,
        isPublic: body.isPublic,
        updatedBy: body.updatedBy,
      },
      userId
    );

    // Create use case (in production, this would be injected via DI)
    const useCase = new UpdateWorkflowUseCase(null as any);

    // Execute use case
    const result = await useCase.execute(command);

    // Handle result
    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update workflow' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { data: result.value },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
