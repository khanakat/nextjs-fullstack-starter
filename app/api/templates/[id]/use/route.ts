import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/shared/infrastructure/di/container";
import { ReportTypes } from "@/shared/infrastructure/di/reporting.types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Safely parse request body; align with tests expecting 400 on invalid/missing title
    let body: any = {};
    try {
      body = await request.json();
      if (body === null || typeof body !== "object") {
        throw new Error("Invalid JSON");
      }
    } catch (e) {
      body = {};
    }
    const { title, description } = body ?? {};
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 },
      );
    }

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportTemplatesApiController);

    const result = await controller.useTemplate(
      params.id,
      userId,
      orgId || undefined,
      title,
      description
    );

    if (!result.success || !result.data) {
      const error = result.error || 'Failed to use template';
      if (error === 'Template not found') {
        return NextResponse.json(
          { success: false, error: "Template not found" },
          { status: 404 },
        );
      }
      if (error.includes('permission')) {
        return NextResponse.json(
          { success: false, error: "You do not have permission to use this template" },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: { report: result.data.report, template: result.data.template } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
