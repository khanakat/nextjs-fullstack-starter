import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { ThemesApiController } from "@/src/slices/ui/presentation/api/themes-api.controller";

// GET /api/ui/themes - Get themes
export async function GET(_request: NextRequest) {
  const controller = container.get<ThemesApiController>(ThemesApiController);
  return controller.getThemes(_request);
}

// POST /api/ui/themes - Create new theme
export async function POST(_request: NextRequest) {
  const controller = container.get<ThemesApiController>(ThemesApiController);
  return controller.createTheme(_request);
}

// PUT /api/ui/themes - Update theme
export async function PUT(_request: NextRequest) {
  const controller = container.get<ThemesApiController>(ThemesApiController);
  return controller.updateTheme(_request);
}

// DELETE /api/ui/themes - Delete theme
export async function DELETE(_request: NextRequest) {
  const controller = container.get<ThemesApiController>(ThemesApiController);
  return controller.deleteTheme(_request);
}
