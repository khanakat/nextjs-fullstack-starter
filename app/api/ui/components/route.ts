import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { ComponentsApiController } from "@/src/slices/ui/presentation/api/components-api.controller";

// GET /api/ui/components - Get all component configurations or a specific one
export async function GET(_request: NextRequest) {
  const controller = container.get<ComponentsApiController>(ComponentsApiController);
  return controller.getComponents(_request);
}

// POST /api/ui/components - Create a new component configuration
export async function POST(_request: NextRequest) {
  const controller = container.get<ComponentsApiController>(ComponentsApiController);
  return controller.createComponent(_request);
}

// PUT /api/ui/components - Update a component configuration
export async function PUT(_request: NextRequest) {
  const controller = container.get<ComponentsApiController>(ComponentsApiController);
  return controller.updateComponent(_request);
}

// DELETE /api/ui/components - Delete a component configuration
export async function DELETE(_request: NextRequest) {
  const controller = container.get<ComponentsApiController>(ComponentsApiController);
  return controller.deleteComponent(_request);
}
