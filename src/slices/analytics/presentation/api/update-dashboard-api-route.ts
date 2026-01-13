import { NextRequest, NextResponse } from 'next/server';
import { UpdateDashboardCommand } from '../../application/commands/update-dashboard-command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Update Dashboard API Route
 * PUT /api/analytics/dashboards/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Dashboard ID is required' },
        { status: 400 }
      );
    }

    // Create command
    const command = new UpdateDashboardCommand(
      UniqueId.create(id),
      {
        name: body.name,
        description: body.description,
        layout: body.layout,
        settings: body.settings,
        isPublic: body.isPublic,
        isTemplate: body.isTemplate,
        tags: body.tags,
        status: body.status,
      },
      body.userId
    );

    // TODO: Inject and execute use case
    // const useCase = container.get<UpdateDashboardUseCase>('UpdateDashboardUseCase');
    // const result = await useCase.execute(command);

    // if (!result.isSuccess) {
    //   if (result.error?.message === 'Dashboard not found') {
    //     return NextResponse.json(
    //       { error: result.error?.message },
    //       { status: 404 }
    //     );
    //   }
    //   return NextResponse.json(
    //     { error: result.error?.message || 'Failed to update dashboard' },
    //     { status: 400 }
    //   );
    // }

    // return NextResponse.json(result.value);

    // Temporary response until DI container is set up
    return NextResponse.json(
      {
        message: 'Update Dashboard API route created - DI container integration pending',
        dashboardId: command.dashboardId.value,
        updates: {
          name: command.props.name,
          description: command.props.description,
          layout: command.props.layout,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
