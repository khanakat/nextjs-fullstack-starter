import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { TemplatesApiController } from "@/src/slices/ui/presentation/api/templates-api.controller";

// GET /api/ui/templates - Get layout templates
export async function GET(_request: NextRequest) {
  const controller = container.get<TemplatesApiController>(TemplatesApiController);
  return controller.getTemplates(_request);
}

// POST /api/ui/templates - Create new template
export async function POST(_request: NextRequest) {
  const controller = container.get<TemplatesApiController>(TemplatesApiController);
  return controller.createTemplate(_request);
}

// PUT /api/ui/templates - Update template
export async function PUT(_request: NextRequest) {
  const controller = container.get<TemplatesApiController>(TemplatesApiController);
  return controller.updateTemplate(_request);
}

// DELETE /api/ui/templates - Delete template
export async function DELETE(_request: NextRequest) {
  const controller = container.get<TemplatesApiController>(TemplatesApiController);
  return controller.deleteTemplate(_request);
}

// PATCH /api/ui/templates - Clone or duplicate template
export async function PATCH(_request: NextRequest) {
  const controller = container.get<TemplatesApiController>(TemplatesApiController);
  return controller.cloneTemplate(_request);
}
