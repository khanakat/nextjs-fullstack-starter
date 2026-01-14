import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateOrganizationCommand } from '../../application/commands/create-organization-command';
import { GetOrganizationsQuery } from '../../application/queries/get-organizations-query';
import { CreateOrganizationHandler } from '../../application/handlers/create-organization-handler';
import { GetOrganizationsHandler } from '../../application/handlers/get-organizations-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Organizations API Controller
 * Handles HTTP requests for organization management
 */
@injectable()
export class OrganizationsApiController {
  constructor(
    @inject(TYPES.CreateOrganizationHandler) private createOrganizationHandler: CreateOrganizationHandler,
    @inject(TYPES.GetOrganizationsHandler) private getOrganizationsHandler: GetOrganizationsHandler
  ) {}

  /**
   * GET /api/organizations
   * Get organizations for the current user
   */
  async getOrganizations(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId') || undefined;
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

      const query = new GetOrganizationsQuery({
        ownerId: userId,
        page,
        limit,
      });

      const result = await this.getOrganizationsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in OrganizationsApiController.getOrganizations:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/organizations
   * Create a new organization
   */
  async createOrganization(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateOrganizationCommand({
        name: body.name,
        slug: body.slug,
        description: body.description,
        imageUrl: body.imageUrl,
        website: body.website,
        plan: body.plan,
        maxMembers: body.maxMembers,
        settings: body.settings ? JSON.stringify(body.settings) : '{}',
        ownerId: body.userId,
      });

      const result = await this.createOrganizationHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in OrganizationsApiController.createOrganization:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
