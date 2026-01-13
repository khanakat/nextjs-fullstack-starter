import { NextRequest, NextResponse } from 'next/server';
import { DeleteDashboardCommand } from '../../application/commands/delete-dashboard-command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Delete Dashboard API Route
 * DELETE /api/analytics/dashboards/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Dashboard ID is required' },
        { status: 400 }
      );
    }

    // Create command
    const command = new DeleteDashboardCommand(UniqueId.create(id));

    // TODO: Inject and execute use case
    // const useCase = container.get<DeleteDashboardUseCase>('DeleteDashboardUseCase');
    // const result = await useCase.execute(command);

    // if (!result.isSuccess) {
    //   if (result.error?.message === 'Dashboard not found') {
    //     return NextResponse.json(
    //       { error: result.error?.message },
    //       { status: 404 }
    //     );
    //   }
    //   return NextResponse.json(
    //     { error: result.error?.message || 'Failed to delete dashboard' },
    //     { status: 400 }
    //   );
    // }

    // return NextResponse.json({ success: true }, { status: 200 });

    // Temporary response until DI container is set up
    return NextResponse.json(
      {
        message: 'Delete Dashboard API route created - DI container integration pending',
        dashboardId: command.dashboardId.value,
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
