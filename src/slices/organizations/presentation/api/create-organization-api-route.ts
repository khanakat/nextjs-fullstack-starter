import { NextRequest, NextResponse } from 'next/server';
import { CreateOrganizationCommand } from '../../application/commands/create-organization-command';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization-use-case';
import { OrganizationDto } from '../../application/dtos/organization-dto';

/**
 * Create Organization API Route
 * POST /api/organizations
 */
export async function createOrganizationApiRoute(request: NextRequest) {
  try {
    const body = await request.json();

    // Create command
    const command = new CreateOrganizationCommand(
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        imageUrl: body.imageUrl,
        website: body.website,
        plan: body.plan,
        maxMembers: body.maxMembers,
        settings: body.settings,
        ownerId: body.ownerId,
      },
      body.userId
    );

    // Execute use case
    // TODO: Use DI container to get use case
    // const useCase = container.get<CreateOrganizationUseCase>('CreateOrganizationUseCase');
    // const result = await useCase.execute(command);

    // For now, return a mock response
    const mockDto: OrganizationDto = {
      id: 'mock-id',
      name: body.name,
      slug: body.slug,
      description: body.description,
      imageUrl: body.imageUrl,
      website: body.website,
      role: 'OWNER' as any,
      status: 'ACTIVE' as any,
      maxMembers: body.maxMembers || 5,
      plan: body.plan || 'free',
      settings: body.settings || '{}',
      createdAt: new Date(),
    } as any;

    return NextResponse.json({
      success: true,
      data: mockDto.toPlainObject(),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
