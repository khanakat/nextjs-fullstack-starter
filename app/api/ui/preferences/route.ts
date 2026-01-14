import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { PreferencesApiController } from "@/src/slices/ui/presentation/api/preferences-api.controller";

// GET /api/ui/preferences - Get user preferences
export async function GET(_request: NextRequest) {
  const controller = container.get<PreferencesApiController>(PreferencesApiController);
  return controller.getPreferences(_request);
}

// POST /api/ui/preferences - Create user preferences
export async function POST(_request: NextRequest) {
  const controller = container.get<PreferencesApiController>(PreferencesApiController);
  return controller.createPreferences(_request);
}

// PUT /api/ui/preferences - Update user preferences
export async function PUT(_request: NextRequest) {
  const controller = container.get<PreferencesApiController>(PreferencesApiController);
  return controller.updatePreferences(_request);
}

// DELETE /api/ui/preferences - Delete user preferences
export async function DELETE(_request: NextRequest) {
  const controller = container.get<PreferencesApiController>(PreferencesApiController);
  return controller.deletePreferences(_request);
}

// PATCH /api/ui/preferences - Partially update user preferences
export async function PATCH(_request: NextRequest) {
  const controller = container.get<PreferencesApiController>(PreferencesApiController);
  return controller.patchPreferences(_request);
}
