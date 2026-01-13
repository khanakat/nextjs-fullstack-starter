import { NextRequest, NextResponse } from 'next/server';
import { CreateSettingHandler } from '../../application/handlers/create-setting-handler';
import { UpdateSettingHandler } from '../../application/handlers/update-setting-handler';
import { DeleteSettingHandler } from '../../application/handlers/delete-setting-handler';
import { GetSettingHandler } from '../../application/handlers/get-setting-handler';
import { ListSettingsHandler } from '../../application/handlers/list-settings-handler';
import { GetSettingsHandler } from '../../application/handlers/get-settings-handler';
import { CreateSettingCommand, UpdateSettingCommand, DeleteSettingCommand, GetSettingQuery, ListSettingsQuery, GetSettingsQuery } from '../../application/commands/create-setting-command';
import { SettingDto } from '../../application/dtos/setting-dto';
import { Result } from '../../../../shared/application/base/result';
import { container } from '../../../../shared/infrastructure/di/container';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Settings API Route
 * Handles HTTP requests for settings management
 */
export class SettingsApiRoute {
  /**
   * GET /api/settings - Get all settings
   */
  async GET(request: NextRequest): Promise<NextResponse> {
    const handler = container.get<GetSettingsHandler>(TYPES.GetSettingsHandler);
    const result = await handler.handle(new GetSettingsQuery());

    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    const settings = result.value.map(setting =>
      SettingDto.fromObject({
        key: setting.getKey(),
        value: setting.getSettingValue(),
      }),
    );

    return NextResponse.json({ settings });
  }

  /**
   * GET /api/settings/[key] - Get a specific setting
   */
  async GET_BY_KEY(request: NextRequest, { params }: { params: { key: string } }): Promise<NextResponse> {
    const handler = container.get<GetSettingHandler>(TYPES.GetSettingHandler);
    const result = await handler.handle(new GetSettingQuery({ key: params.key }));

    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 404 },
      );
    }

    const setting = result.value;
    const dto = SettingDto.fromObject({
      key: setting.getKey(),
      value: setting.getSettingValue(),
    });

    return NextResponse.json({ setting: dto.toObject() });
  }

  /**
   * POST /api/settings - Create a new setting
   */
  async POST(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const handler = container.get<CreateSettingHandler>(TYPES.CreateSettingHandler);
      const command = new CreateSettingCommand({
        key: body.key,
        value: body.value,
        description: body.description,
      });

      const result = await handler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 },
        );
      }

      const setting = result.value;
      const dto = SettingDto.fromObject({
        key: setting.getKey(),
        value: setting.getSettingValue(),
      });

      return NextResponse.json(
        { setting: dto.toObject() },
        { status: 201 },
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }
  }

  /**
   * PUT /api/settings/[key] - Update a setting
   */
  async PUT_BY_KEY(request: NextRequest, { params }: { params: { key: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();
      const handler = container.get<UpdateSettingHandler>(TYPES.UpdateSettingHandler);
      const command = new UpdateSettingCommand({
        key: params.key,
        value: body.value,
        description: body.description,
      });

      const result = await handler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 },
        );
      }

      const setting = result.value;
      const dto = SettingDto.fromObject({
        key: setting.getKey(),
        value: setting.getSettingValue(),
      });

      return NextResponse.json({ setting: dto.toObject() });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }
  }

  /**
   * DELETE /api/settings/[key] - Delete a setting
   */
  async DELETE_BY_KEY(request: NextRequest, { params }: { params: { key: string } }): Promise<NextResponse> {
    const handler = container.get<DeleteSettingHandler>(TYPES.DeleteSettingHandler);
    const result = await handler.handle(new DeleteSettingCommand({ key: params.key }));

    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  }
}

// Export handler functions for Next.js
export const GET = async (request: NextRequest) => {
  const route = new SettingsApiRoute();
  return route.GET(request);
};

export const GET_BY_KEY = async (request: NextRequest, context: { params: { key: string } }) => {
  const route = new SettingsApiRoute();
  return route.GET_BY_KEY(request, context);
};

export const POST = async (request: NextRequest) => {
  const route = new SettingsApiRoute();
  return route.POST(request);
};

export const PUT_BY_KEY = async (request: NextRequest, context: { params: { key: string } }) => {
  const route = new SettingsApiRoute();
  return route.PUT_BY_KEY(request, context);
};

export const DELETE_BY_KEY = async (request: NextRequest, context: { params: { key: string } }) => {
  const route = new SettingsApiRoute();
  return route.DELETE_BY_KEY(request, context);
};
