import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkflowCommand } from '../../application/commands/create-workflow-command';
import { CreateWorkflowUseCase } from '../../application/use-cases/create-workflow-use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Create Workflow API Route
 * POST /api/workflows
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create command
    const command = new CreateWorkflowCommand(
      {
        name: body.name,
        description: body.description,
        organizationId: body.organizationId,
        definition: body.definition,
        settings: body.settings,
        variables: body.variables,
        createdBy: body.createdBy,
        status: body.status,
        isTemplate: body.isTemplate,
        isPublic: body.isPublic,
      },
      body.userId
    );

    // Create use case (in production, this would be injected via DI)
    const useCase = new CreateWorkflowUseCase(null as any);

    // Execute use case
    const result = await useCase.execute(command);

    // Handle result
    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create workflow' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      { data: result.value },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
