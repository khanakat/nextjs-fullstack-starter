import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { z } from "zod";

// Layout template validation schemas
const LayoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    "dashboard",
    "landing",
    "admin",
    "blog",
    "ecommerce",
    "portfolio",
    "documentation",
  ]),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  preview: z.string().optional(), // URL to preview image
  layout: z.object({
    type: z.enum(["grid", "flex", "sidebar", "split", "masonry", "custom"]),
    structure: z.record(z.any()), // Layout configuration
    responsive: z
      .object({
        mobile: z.record(z.any()).optional(),
        tablet: z.record(z.any()).optional(),
        desktop: z.record(z.any()).optional(),
      })
      .optional(),
  }),
  components: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      props: z.record(z.any()).optional(),
      responsive: z
        .object({
          mobile: z.record(z.any()).optional(),
          tablet: z.record(z.any()).optional(),
          desktop: z.record(z.any()).optional(),
        })
        .optional(),
    }),
  ),
  styles: z
    .object({
      theme: z.string().optional(),
      customCSS: z.string().optional(),
      variables: z.record(z.string()).optional(),
    })
    .optional(),
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      created: z.string().optional(),
      updated: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      isPublic: z.boolean().default(true),
      allowCustomization: z.boolean().default(true),
      requiresAuth: z.boolean().default(false),
    })
    .optional(),
});

const CreateTemplateSchema = LayoutTemplateSchema.omit({ id: true });
const UpdateTemplateSchema = LayoutTemplateSchema.partial().omit({ id: true });

// Mock data for layout templates
let layoutTemplates = [
  {
    id: "dashboard-analytics",
    name: "Analytics Dashboard",
    category: "dashboard" as const,
    description:
      "Comprehensive analytics dashboard with charts, metrics, and data tables",
    version: "1.0.0",
    preview: "/templates/dashboard-analytics.png",
    layout: {
      type: "grid" as const,
      structure: {
        columns: 12,
        rows: "auto",
        gap: "1rem",
        areas: [
          "header header header header header header header header header header header header",
          "sidebar main main main main main main main main main main main",
          "sidebar main main main main main main main main main main main",
        ],
      },
      responsive: {
        mobile: {
          areas: ["header", "main", "sidebar"],
        },
        tablet: {
          areas: [
            "header header header header header header",
            "sidebar main main main main main",
          ],
        },
      },
    },
    components: [
      {
        id: "header",
        type: "DashboardHeader",
        position: { x: 0, y: 0, width: 12, height: 1 },
        props: {
          title: "Analytics Dashboard",
          showSearch: true,
          showNotifications: true,
          showUserMenu: true,
        },
      },
      {
        id: "sidebar",
        type: "Sidebar",
        position: { x: 0, y: 1, width: 2, height: 2 },
        props: {
          collapsible: true,
          sections: [
            { title: "Overview", items: ["Dashboard", "Analytics", "Reports"] },
            { title: "Data", items: ["Users", "Events", "Metrics"] },
          ],
        },
      },
      {
        id: "metrics-grid",
        type: "DashboardStats",
        position: { x: 2, y: 1, width: 10, height: 1 },
        props: {
          stats: [
            { title: "Total Users", value: "12,345", change: "+12%" },
            { title: "Revenue", value: "$45,678", change: "+8%" },
            { title: "Conversion", value: "3.2%", change: "-2%" },
            { title: "Sessions", value: "8,901", change: "+15%" },
          ],
        },
      },
      {
        id: "chart-area",
        type: "ChartContainer",
        position: { x: 2, y: 2, width: 6, height: 1 },
        props: {
          title: "Revenue Trend",
          type: "line",
          data: [],
        },
      },
      {
        id: "data-table",
        type: "DataTable",
        position: { x: 8, y: 2, width: 4, height: 1 },
        props: {
          title: "Recent Activity",
          pagination: true,
          sorting: true,
        },
      },
    ],
    styles: {
      theme: "light",
      variables: {
        "--dashboard-primary": "#3b82f6",
        "--dashboard-background": "#f8fafc",
        "--dashboard-card": "#ffffff",
      },
    },
    metadata: {
      title: "Analytics Dashboard Template",
      description:
        "A comprehensive dashboard for analytics and data visualization",
      tags: ["dashboard", "analytics", "charts", "metrics"],
      author: "UI Team",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-15T00:00:00Z",
    },
    settings: {
      isPublic: true,
      allowCustomization: true,
      requiresAuth: false,
    },
  },
  {
    id: "landing-saas",
    name: "SaaS Landing Page",
    category: "landing" as const,
    description:
      "Modern SaaS landing page with hero section, features, pricing, and testimonials",
    version: "1.0.0",
    preview: "/templates/landing-saas.png",
    layout: {
      type: "flex" as const,
      structure: {
        direction: "column",
        sections: [
          { name: "hero", height: "100vh" },
          { name: "features", height: "auto" },
          { name: "pricing", height: "auto" },
          { name: "testimonials", height: "auto" },
          { name: "cta", height: "auto" },
          { name: "footer", height: "auto" },
        ],
      },
    },
    components: [
      {
        id: "navigation",
        type: "Navigation",
        position: { x: 0, y: 0, width: 12, height: 1 },
        props: {
          logo: "SaaS App",
          links: ["Features", "Pricing", "About", "Contact"],
          cta: "Get Started",
        },
      },
      {
        id: "hero-section",
        type: "HeroSection",
        position: { x: 0, y: 1, width: 12, height: 1 },
        props: {
          title: "Build Amazing Products Faster",
          subtitle: "The all-in-one platform for modern teams",
          cta: "Start Free Trial",
          image: "/hero-image.png",
        },
      },
      {
        id: "features-grid",
        type: "FeaturesGrid",
        position: { x: 0, y: 2, width: 12, height: 1 },
        props: {
          title: "Everything you need",
          features: [
            {
              title: "Fast Setup",
              description: "Get started in minutes",
              icon: "zap",
            },
            {
              title: "Secure",
              description: "Enterprise-grade security",
              icon: "shield",
            },
            {
              title: "Scalable",
              description: "Grows with your business",
              icon: "trending-up",
            },
          ],
        },
      },
      {
        id: "pricing-section",
        type: "PricingSection",
        position: { x: 0, y: 3, width: 12, height: 1 },
        props: {
          title: "Simple, transparent pricing",
          plans: [
            {
              name: "Starter",
              price: "$9",
              features: ["Feature 1", "Feature 2"],
            },
            {
              name: "Pro",
              price: "$29",
              features: ["All Starter", "Feature 3", "Feature 4"],
            },
            {
              name: "Enterprise",
              price: "Custom",
              features: ["All Pro", "Custom features"],
            },
          ],
        },
      },
    ],
    styles: {
      theme: "light",
      variables: {
        "--landing-primary": "#6366f1",
        "--landing-secondary": "#f1f5f9",
        "--landing-accent": "#10b981",
      },
    },
    metadata: {
      title: "SaaS Landing Page Template",
      description: "A modern landing page template for SaaS products",
      tags: ["landing", "saas", "marketing", "conversion"],
      author: "Marketing Team",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-10T00:00:00Z",
    },
    settings: {
      isPublic: true,
      allowCustomization: true,
      requiresAuth: false,
    },
  },
  {
    id: "admin-panel",
    name: "Admin Panel",
    category: "admin" as const,
    description:
      "Comprehensive admin panel with user management, settings, and system monitoring",
    version: "1.0.0",
    preview: "/templates/admin-panel.png",
    layout: {
      type: "sidebar" as const,
      structure: {
        sidebarWidth: "280px",
        headerHeight: "64px",
        contentPadding: "24px",
      },
    },
    components: [
      {
        id: "admin-header",
        type: "AdminHeader",
        position: { x: 0, y: 0, width: 12, height: 1 },
        props: {
          title: "Admin Panel",
          breadcrumbs: true,
          userMenu: true,
          notifications: true,
        },
      },
      {
        id: "admin-sidebar",
        type: "AdminSidebar",
        position: { x: 0, y: 1, width: 2, height: 3 },
        props: {
          sections: [
            { title: "Dashboard", icon: "home", path: "/admin" },
            { title: "Users", icon: "users", path: "/admin/users" },
            { title: "Settings", icon: "settings", path: "/admin/settings" },
            { title: "Analytics", icon: "bar-chart", path: "/admin/analytics" },
          ],
        },
      },
      {
        id: "admin-content",
        type: "AdminContent",
        position: { x: 2, y: 1, width: 10, height: 3 },
        props: {
          title: "Dashboard Overview",
          widgets: [
            { type: "stats", title: "System Stats" },
            { type: "chart", title: "Usage Trends" },
            { type: "table", title: "Recent Activity" },
          ],
        },
      },
    ],
    styles: {
      theme: "dark",
      variables: {
        "--admin-primary": "#1f2937",
        "--admin-secondary": "#374151",
        "--admin-accent": "#3b82f6",
      },
    },
    metadata: {
      title: "Admin Panel Template",
      description: "A comprehensive admin panel for system management",
      tags: ["admin", "management", "dashboard", "system"],
      author: "Admin Team",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-20T00:00:00Z",
    },
    settings: {
      isPublic: false,
      allowCustomization: true,
      requiresAuth: true,
    },
  },
];

// GET /api/ui/templates - Get layout templates
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI templates retrieval request", "ui", {
      requestId,
    });

    const { searchParams } = new URL(_request.url);
    const category = searchParams.get("category");
    const templateId = searchParams.get("templateId");
    const isPublic = searchParams.get("isPublic");

    // Get specific template
    if (templateId) {
      const template = layoutTemplates.find((t) => t.id === templateId);
      if (!template) {
        logger.warn("Template not found", "ui", { requestId, templateId });
        return StandardErrorResponse.notFound("Template not found", requestId);
      }

      logger.info("UI template retrieved successfully", "ui", {
        requestId,
        templateId,
        category: template.category,
      });

      return StandardSuccessResponse.ok(
        {
          template,
        },
        requestId,
      );
    }

    // Filter templates
    let filteredTemplates = layoutTemplates;

    if (category) {
      filteredTemplates = filteredTemplates.filter(
        (t) => t.category === category,
      );
    }

    if (isPublic !== null) {
      const publicFilter = isPublic === "true";
      filteredTemplates = filteredTemplates.filter(
        (t) => t.settings?.isPublic === publicFilter,
      );
    }

    logger.info("UI templates retrieved successfully", "ui", {
      requestId,
      count: filteredTemplates.length,
      category: category || "all",
      isPublic: isPublic || "all",
    });

    return StandardSuccessResponse.ok(
      {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        categories: [...new Set(layoutTemplates.map((t) => t.category))],
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving UI templates", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/templates",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve UI templates",
      requestId,
    );
  }
}

// POST /api/ui/templates - Create new template
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI template creation request", "ui", { requestId });

    const body = await _request.json();
    const validatedData = CreateTemplateSchema.parse(body);

    // Check if template with same name already exists
    const existingTemplate = layoutTemplates.find(
      (t) => t.name === validatedData.name,
    );
    if (existingTemplate) {
      logger.warn("Template with same name already exists", "ui", {
        requestId,
        templateName: validatedData.name,
      });
      return StandardErrorResponse.conflict(
        "Template with this name already exists",
        requestId,
      );
    }

    const newTemplate = {
      id: `template-${Date.now()}`,
      ...validatedData,
      metadata: {
        ...validatedData.metadata,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    layoutTemplates.push(newTemplate as any);

    logger.info("UI template created successfully", "ui", {
      requestId,
      templateId: newTemplate.id,
      templateName: newTemplate.name,
      category: newTemplate.category,
    });

    return StandardSuccessResponse.created(
      {
        template: newTemplate,
        message: "Template created successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in create template request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error creating UI template", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/templates",
    });

    return StandardErrorResponse.internal(
      "Failed to create UI template",
      requestId,
    );
  }
}

// PUT /api/ui/templates - Update template
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI template update request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      logger.warn("Template ID missing in update request", "ui", { requestId });
      return StandardErrorResponse.badRequest(
        "Template ID is required",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = UpdateTemplateSchema.parse(body);

    const templateIndex = layoutTemplates.findIndex((t) => t.id === templateId);
    if (templateIndex === -1) {
      logger.warn("Template not found for update", "ui", {
        requestId,
        templateId,
      });
      return StandardErrorResponse.notFound("Template not found", requestId);
    }

    // Check for name conflicts (excluding current template)
    if (validatedData.name) {
      const nameConflict = layoutTemplates.find(
        (t) => t.name === validatedData.name && t.id !== templateId,
      );
      if (nameConflict) {
        logger.warn("Template name conflict during update", "ui", {
          requestId,
          templateId,
          conflictingName: validatedData.name,
        });
        return StandardErrorResponse.conflict(
          "Template with this name already exists",
          requestId,
        );
      }
    }

    layoutTemplates[templateIndex] = {
      ...layoutTemplates[templateIndex],
      ...validatedData,
      metadata: {
        ...layoutTemplates[templateIndex].metadata,
        ...validatedData.metadata,
        updated: new Date().toISOString(),
      },
    } as any;

    logger.info("UI template updated successfully", "ui", {
      requestId,
      templateId,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(
      {
        template: layoutTemplates[templateIndex],
        message: "Template updated successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in update template request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error updating UI template", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/templates",
    });

    return StandardErrorResponse.internal(
      "Failed to update UI template",
      requestId,
    );
  }
}

// DELETE /api/ui/templates - Delete template
export async function DELETE(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI template deletion request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      logger.warn("Template ID missing in deletion request", "ui", {
        requestId,
      });
      return StandardErrorResponse.badRequest(
        "Template ID is required",
        requestId,
      );
    }

    const templateIndex = layoutTemplates.findIndex((t) => t.id === templateId);
    if (templateIndex === -1) {
      logger.warn("Template not found for deletion", "ui", {
        requestId,
        templateId,
      });
      return StandardErrorResponse.notFound("Template not found", requestId);
    }

    const deletedTemplate = layoutTemplates.splice(templateIndex, 1)[0];

    logger.info("UI template deleted successfully", "ui", {
      requestId,
      templateId,
      templateName: deletedTemplate.name,
    });

    return StandardSuccessResponse.ok(
      {
        template: deletedTemplate,
        message: "Template deleted successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error deleting UI template", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/templates",
    });

    return StandardErrorResponse.internal(
      "Failed to delete UI template",
      requestId,
    );
  }
}

// PATCH /api/ui/templates - Clone or duplicate template
export async function PATCH(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI template clone request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const templateId = searchParams.get("templateId");
    const action = searchParams.get("action");

    if (!templateId) {
      logger.warn("Template ID missing in clone request", "ui", { requestId });
      return StandardErrorResponse.badRequest(
        "Template ID is required",
        requestId,
      );
    }

    if (action !== "clone") {
      logger.warn("Invalid action specified for template operation", "ui", {
        requestId,
        action,
      });
      return StandardErrorResponse.badRequest(
        'Only "clone" action is supported',
        requestId,
      );
    }

    const template = layoutTemplates.find((t) => t.id === templateId);
    if (!template) {
      logger.warn("Template not found for cloning", "ui", {
        requestId,
        templateId,
      });
      return StandardErrorResponse.notFound("Template not found", requestId);
    }

    const body = await _request.json();
    const { name } = body;

    if (!name) {
      logger.warn("Name missing for template clone", "ui", { requestId });
      return StandardErrorResponse.badRequest(
        "Name is required for cloning",
        requestId,
      );
    }

    // Check if name already exists
    const nameExists = layoutTemplates.find((t) => t.name === name);
    if (nameExists) {
      logger.warn("Template name already exists for clone", "ui", {
        requestId,
        name,
      });
      return StandardErrorResponse.conflict(
        "Template with this name already exists",
        requestId,
      );
    }

    const clonedTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name,
      metadata: {
        ...template.metadata,
        title: `${name} (Cloned)`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    layoutTemplates.push(clonedTemplate);

    logger.info("UI template cloned successfully", "ui", {
      requestId,
      originalTemplateId: templateId,
      clonedTemplateId: clonedTemplate.id,
      clonedName: name,
    });

    return StandardSuccessResponse.created(
      {
        template: clonedTemplate,
        message: "Template cloned successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error cloning UI template", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/templates",
    });

    return StandardErrorResponse.internal(
      "Failed to clone UI template",
      requestId,
    );
  }
}
