import { NextRequest, NextResponse } from 'next/server';
import { CreateDashboardCommand } from '../../application/commands/create-dashboard-command';
import { DashboardId } from '../../domain/value-objects/dashboard-id';

/**
 * Create Dashboard API Route
 * POST /api/analytics/dashboards
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.layout || !body.organizationId || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, layout, organizationId, createdBy' },
        { status: 400 }
      );
    }

    // Create command
    const command = new CreateDashboardCommand(
      {
        name: body.name,
        description: body.description,
        layout: body.layout,
        settings: body.settings || '{}',
        isPublic: body.isPublic ?? false,
        isTemplate: body.isTemplate ?? false,
        tags: body.tags || '',
        organizationId: body.organizationId,
        createdBy: body.createdBy,
        status: body.status,
      },
      body.userId
    );

    // TODO: Inject and execute use case
    // const useCase = container.get<CreateDashboardUseCase>('CreateDashboardUseCase');
    // const result = await useCase.execute(command);

    // if (!result.isSuccess) {
    //   return NextResponse.json(
    //     { error: result.error?.message || 'Failed to create dashboard' },
    //     { status: 400 }
    //   );
    // }

    // return NextResponse.json(result.value, { status: 201 });

    // Temporary response until DI container is set up
    return NextResponse.json(
      {
        message: 'Dashboard API route created - DI container integration pending',
        command: {
          name: command.props.name,
          description: command.props.description,
          layout: command.props.layout,
        },
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
