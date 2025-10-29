import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportTemplatesService } from "@/lib/services/report-templates-service";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  type: z.enum([
    "dashboard",
    "analytics",
    "financial",
    "operational",
    "custom",
  ]),
  category: z.enum(["standard", "premium", "enterprise"]),
  config: z.object({
    layout: z.enum(["single-page", "multi-page", "dashboard"]),
    orientation: z.enum(["portrait", "landscape"]),
    sections: z.array(z.any()), // Complex validation would be done separately
    styling: z.object({
      theme: z.enum(["light", "dark", "corporate", "minimal"]),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
    }),
    branding: z.object({
      showLogo: z.boolean().optional(),
      showCompanyName: z.boolean().optional(),
      showGeneratedDate: z.boolean().optional(),
      showPageNumbers: z.boolean().optional(),
      customHeader: z.string().optional(),
      customFooter: z.string().optional(),
    }),
  }),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const filters = {
      type: searchParams.get("type") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await ReportTemplatesService.getAvailableTemplates(
      organizationId,
      filters,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch report templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, ...data } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Validate the request body
    const validatedData = createTemplateSchema.parse(data);

    // Create the custom template
    const template = await ReportTemplatesService.createCustomTemplate(
      session.user.id,
      organizationId,
      validatedData,
    );

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating report template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create report template" },
      { status: 500 },
    );
  }
}
