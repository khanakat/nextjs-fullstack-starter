import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db as prisma } from "@/lib/db";
import { providerRegistry } from "../../../../api/services/integrations/ProviderRegistry";
import { z } from "zod";

const ListTemplatesSchema = z.object({
  provider: z.string().optional(),
  category: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

/**
 * GET /api/integrations/templates - List integration templates
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryParams = {
      provider: searchParams.get("provider") || undefined,
      category: searchParams.get("category") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const validatedParams = ListTemplatesSchema.parse(queryParams);

    // Build where clause
    const where: any = {
      OR: [
        { organizationId }, // Organization-specific templates
        { organizationId: null }, // Global templates
      ],
    };

    if (validatedParams.provider) {
      where.provider = validatedParams.provider;
    }
    if (validatedParams.category) {
      where.category = validatedParams.category;
    }

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.integrationTemplate.findMany({
        where,
        orderBy: [
          { isBuiltIn: "desc" }, // Built-in templates first
          { name: "asc" },
        ],
        skip: (validatedParams.page - 1) * validatedParams.limit,
        take: validatedParams.limit,
      }),
      prisma.integrationTemplate.count({ where }),
    ]);

    // Get provider metadata for each template
    const templatesWithMetadata = templates.map((template) => {
      const providerMetadata = providerRegistry.getProviderMetadata(
        template.provider as any,
      );

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        provider: template.provider,
        category: template.category,
        config: template.template,
        isGlobal: template.isPublic,
        createdAt: template.createdAt,
        providerMetadata: {
          name: providerMetadata.displayName,
          description: providerMetadata.description,
          icon: providerMetadata.iconUrl,
          websiteUrl: providerMetadata.websiteUrl,
          documentationUrl: providerMetadata.documentationUrl,
          setupInstructions: providerMetadata.setupInstructions,
        },
      };
    });

    return NextResponse.json({
      templates: templatesWithMetadata,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error("Failed to list templates:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations/templates - Create integration from template
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await _request.json();

    const { templateId, name, customConfig } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Get template
    const template = await prisma.integrationTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isBuiltIn: false }, // Custom templates
          { isPublic: true }, // Public templates
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Merge template config with custom config
    const templateConfig = JSON.parse(template.template as string);
    const finalConfig = {
      ...templateConfig,
      ...customConfig,
    };

    // Create integration from template
    const integration = await prisma.integration.create({
      data: {
        name: name || template.name,
        provider: template.provider,
        type: providerRegistry.getProvider(template.provider as any).type,
        category: template.category,
        config: JSON.stringify(finalConfig),
        status: "pending",
        organizationId,
        createdBy: session.user.id,
      },
    });

    // Log template usage
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: "created_from_template",
        status: "success",
        errorDetails: JSON.stringify({
          templateId,
          templateName: template.name,
          customConfig: !!customConfig,
        }),
        responseData: JSON.stringify({
          integrationId: integration.id,
          provider: integration.provider,
        }),
      },
    });

    return NextResponse.json(
      {
        id: integration.id,
        name: integration.name,
        provider: integration.provider,
        type: integration.type,
        status: integration.status,
        config: finalConfig,
        createdAt: integration.createdAt,
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.apiError("Error processing template request", "template", error, {
      endpoint: "/api/integrations/templates",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process template request", 500);
  }
}
