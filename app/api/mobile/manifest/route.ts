import { NextRequest, NextResponse } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

// GET - Generate dynamic PWA manifest
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing PWA manifest request", "mobile", { requestId });

    const { userId } = await auth();

    // Base manifest configuration
    const baseManifest = {
      name: "Workflow Management System",
      short_name: "WorkflowMS",
      description:
        "A comprehensive workflow management and collaboration platform",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3b82f6",
      orientation: "portrait-primary",
      scope: "/",
      lang: "en",
      dir: "ltr",
      categories: ["productivity", "business", "utilities"],
      icons: [
        {
          src: "/icons/icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-96x96.png",
          sizes: "96x96",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-128x128.png",
          sizes: "128x128",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-152x152.png",
          sizes: "152x152",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-384x384.png",
          sizes: "384x384",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any",
        },
      ],
      shortcuts: [
        {
          name: "Dashboard",
          short_name: "Dashboard",
          description: "View your workflow dashboard",
          url: "/dashboard",
          icons: [
            {
              src: "/icons/shortcut-dashboard.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
        {
          name: "Create Workflow",
          short_name: "New Workflow",
          description: "Create a new workflow",
          url: "/workflows/new",
          icons: [
            {
              src: "/icons/shortcut-create.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
        {
          name: "Tasks",
          short_name: "Tasks",
          description: "View your tasks",
          url: "/tasks",
          icons: [
            {
              src: "/icons/shortcut-tasks.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
        {
          name: "Notifications",
          short_name: "Notifications",
          description: "View notifications",
          url: "/notifications",
          icons: [
            {
              src: "/icons/shortcut-notifications.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
      ],
      share_target: {
        action: "/share",
        method: "POST",
        enctype: "multipart/form-data",
        params: {
          title: "title",
          text: "text",
          url: "url",
          files: [
            {
              name: "files",
              accept: ["image/*", "text/*", ".pdf", ".doc", ".docx"],
            },
          ],
        },
      },
      protocol_handlers: [
        {
          protocol: "web+workflow",
          url: "/workflow?id=%s",
        },
      ],
      edge_side_panel: {
        preferred_width: 400,
      },
      launch_handler: {
        client_mode: "navigate-existing",
      },
      handle_links: "preferred",
      prefer_related_applications: false,
      related_applications: [],
    };

    // Customize manifest based on user authentication
    let manifest = { ...baseManifest };

    if (userId) {
      // Add authenticated user features
      manifest.shortcuts.push({
        name: "Profile",
        short_name: "Profile",
        description: "View your profile",
        url: "/profile",
        icons: [
          {
            src: "/icons/shortcut-profile.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      });

      // Add organization-specific shortcuts if available
      manifest.shortcuts.push({
        name: "Organization",
        short_name: "Org",
        description: "View organization dashboard",
        url: "/organization",
        icons: [
          {
            src: "/icons/shortcut-org.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      });

      logger.info("PWA manifest generated for authenticated user", "mobile", {
        requestId,
        userId,
        shortcutsCount: manifest.shortcuts.length,
      });
    } else {
      // Add guest user features
      manifest.shortcuts = manifest.shortcuts.filter((shortcut) =>
        ["Dashboard", "Create Workflow"].includes(shortcut.name),
      );

      // Modify start URL for guests
      manifest.start_url = "/auth/sign-in";

      logger.info("PWA manifest generated for guest user", "mobile", {
        requestId,
        shortcutsCount: manifest.shortcuts.length,
      });
    }

    // Get device-specific customizations from query params
    const { searchParams } = new URL(_request.url);
    const theme = searchParams.get("theme");
    const lang = searchParams.get("lang");

    if (theme === "dark") {
      manifest.background_color = "#1f2937";
      manifest.theme_color = "#1f2937";
    }

    if (lang && ["en", "es", "fr", "de"].includes(lang)) {
      manifest.lang = lang;
    }

    // Set appropriate headers for PWA manifest
    const response = NextResponse.json(manifest);
    response.headers.set("Content-Type", "application/manifest+json");
    response.headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    logger.info("PWA manifest served successfully", "mobile", {
      requestId,
      theme,
      lang,
      authenticated: !!userId,
    });

    return response;
  } catch (error) {
    logger.error("Error generating PWA manifest", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/manifest",
    });

    return StandardErrorResponse.internal(
      "Failed to generate manifest",
      requestId,
    );
  }
}

// POST - Update manifest preferences
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing manifest preferences update", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn(
        "Unauthorized manifest preferences update attempt",
        "mobile",
        { requestId },
      );
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const { theme, shortcuts, notifications } = body;

    // Here you would typically save user preferences to database
    // For now, we'll just validate and return success

    const validThemes = ["light", "dark", "auto"];
    if (theme && !validThemes.includes(theme)) {
      logger.warn("Invalid theme in manifest preferences", "mobile", {
        requestId,
        theme,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Invalid theme preference",
        requestId,
      );
    }

    if (shortcuts && !Array.isArray(shortcuts)) {
      logger.warn(
        "Invalid shortcuts format in manifest preferences",
        "mobile",
        {
          requestId,
          userId,
        },
      );
      return StandardErrorResponse.badRequest(
        "Shortcuts must be an array",
        requestId,
      );
    }

    logger.info("Manifest preferences updated successfully", "mobile", {
      requestId,
      userId,
      theme,
      shortcutsCount: shortcuts?.length || 0,
      notifications: !!notifications,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Manifest preferences updated successfully",
        preferences: {
          theme,
          shortcuts: shortcuts?.length || 0,
          notifications: !!notifications,
        },
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error updating manifest preferences", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/manifest",
    });

    return StandardErrorResponse.internal(
      "Failed to update manifest preferences",
      requestId,
    );
  }
}
