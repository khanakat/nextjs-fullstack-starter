"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Settings,
  BarChart3,
  Workflow,
  Zap,
  Home,
  Mail,
  Bell,
  User,
  LogOut,
  Plus,
  Download,
  Upload,
  Keyboard,
} from "lucide-react";

import { logger } from "@/lib/logger";

// Command Types
export interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
  category?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CommandGroup {
  heading: string;
  commands: Command[];
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  commands?: CommandGroup[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

// Default Commands
const defaultCommands: CommandGroup[] = [
  {
    heading: "Navigation",
    commands: [
      {
        id: "nav-home",
        title: "Go to Dashboard",
        description: "Navigate to the main dashboard",
        icon: <Home className="h-4 w-4" />,
        keywords: ["home", "dashboard", "main"],
        action: () => (window.location.href = "/"),
        shortcut: "Ctrl+H",
      },
      {
        id: "nav-analytics",
        title: "Analytics",
        description: "View analytics and reports",
        icon: <BarChart3 className="h-4 w-4" />,
        keywords: ["analytics", "reports", "charts", "data"],
        action: () => (window.location.href = "/analytics"),
        shortcut: "Ctrl+A",
      },
      {
        id: "nav-workflows",
        title: "Workflows",
        description: "Manage workflows and processes",
        icon: <Workflow className="h-4 w-4" />,
        keywords: ["workflows", "processes", "automation"],
        action: () => (window.location.href = "/showcase/features/workflows"),
        shortcut: "Ctrl+W",
      },
      {
        id: "nav-integrations",
        title: "Integrations",
        description: "Manage external integrations",
        icon: <Zap className="h-4 w-4" />,
        keywords: ["integrations", "connections", "apis"],
        action: () => (window.location.href = "/showcase/features/integrations"),
        shortcut: "Ctrl+I",
      },
      {
        id: "nav-settings",
        title: "Settings",
        description: "Application settings and preferences",
        icon: <Settings className="h-4 w-4" />,
        keywords: ["settings", "preferences", "config"],
        action: () => (window.location.href = "/settings"),
        shortcut: "Ctrl+,",
      },
    ],
  },
  {
    heading: "Actions",
    commands: [
      {
        id: "action-new-report",
        title: "Create New Report",
        description: "Create a new analytics report",
        icon: <Plus className="h-4 w-4" />,
        keywords: ["create", "new", "report", "analytics"],
        action: () => (window.location.href = "/reports/new"),
        badge: "New",
      },
      {
        id: "action-new-workflow",
        title: "Create New Workflow",
        description: "Design a new workflow process",
        icon: <Plus className="h-4 w-4" />,
        keywords: ["create", "new", "workflow", "process"],
        action: () => (window.location.href = "/showcase/features/workflows"),
        badge: "New",
      },
      {
        id: "action-export-data",
        title: "Export Data",
        description: "Export data to CSV or Excel",
        icon: <Download className="h-4 w-4" />,
        keywords: ["export", "download", "csv", "excel", "data"],
        action: () =>
          logger.userAction("Export data requested", undefined, {
            source: "command-palette",
          }),
      },
      {
        id: "action-import-data",
        title: "Import Data",
        description: "Import data from file",
        icon: <Upload className="h-4 w-4" />,
        keywords: ["import", "upload", "csv", "excel", "data"],
        action: () =>
          logger.userAction("Import data requested", undefined, {
            source: "command-palette",
          }),
      },
    ],
  },
  {
    heading: "User",
    commands: [
      {
        id: "user-profile",
        title: "View Profile",
        description: "View and edit your profile",
        icon: <User className="h-4 w-4" />,
        keywords: ["profile", "user", "account"],
        action: () => (window.location.href = "/profile"),
      },
      {
        id: "user-notifications",
        title: "Notifications",
        description: "View your notifications",
        icon: <Bell className="h-4 w-4" />,
        keywords: ["notifications", "alerts", "messages"],
        action: () =>
          logger.userAction("Show notifications requested", undefined, {
            source: "command-palette",
          }),
      },
      {
        id: "user-logout",
        title: "Sign Out",
        description: "Sign out of your account",
        icon: <LogOut className="h-4 w-4" />,
        keywords: ["logout", "signout", "exit"],
        action: () =>
          logger.userAction("Sign out requested", undefined, {
            source: "command-palette",
          }),
      },
    ],
  },
  {
    heading: "Help",
    commands: [
      {
        id: "help-docs",
        title: "Documentation",
        description: "View help documentation",
        icon: <FileText className="h-4 w-4" />,
        keywords: ["help", "docs", "documentation", "guide"],
        action: () => window.open("/docs", "_blank"),
      },
      {
        id: "help-shortcuts",
        title: "Keyboard Shortcuts",
        description: "View all keyboard shortcuts",
        icon: <Keyboard className="h-4 w-4" />,
        keywords: ["shortcuts", "hotkeys", "keyboard"],
        action: () =>
          logger.userAction("Show shortcuts requested", undefined, {
            source: "command-palette",
          }),
      },
      {
        id: "help-support",
        title: "Contact Support",
        description: "Get help from our support team",
        icon: <Mail className="h-4 w-4" />,
        keywords: ["support", "help", "contact"],
        action: () => window.open("mailto:support@example.com"),
      },
    ],
  },
];

export function CommandPalette({
  open = false,
  onOpenChange,
  commands = defaultCommands,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = onOpenChange ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setOpen]);

  const handleCommandSelect = useCallback(
    (command: Command) => {
      setOpen(false);
      command.action();
    },
    [setOpen],
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>

        {commands.map((group) => (
          <React.Fragment key={group.heading}>
            <CommandGroup heading={group.heading}>
              {group.commands
                .filter((command) => !command.disabled)
                .map((command) => (
                  <CommandItem
                    key={command.id}
                    value={`${command.title} ${command.description} ${command.keywords?.join(" ")}`}
                    onSelect={() => handleCommandSelect(command)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      {command.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{command.title}</span>
                        {command.description && (
                          <span className="text-sm text-muted-foreground">
                            {command.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {command.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {command.badge}
                        </Badge>
                      )}
                      {command.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {command.shortcut}
                        </kbd>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Hook for using command palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    toggle,
    show,
    hide,
  };
}

// Command builder utility
export const commandBuilder = {
  navigation: (
    title: string,
    href: string,
    options?: Partial<Command>,
  ): Command => ({
    id: `nav-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    icon: <Home className="h-4 w-4" />,
    action: () => (window.location.href = href),
    ...options,
  }),

  action: (
    title: string,
    action: () => void,
    options?: Partial<Command>,
  ): Command => ({
    id: `action-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    icon: <Zap className="h-4 w-4" />,
    action,
    ...options,
  }),

  external: (
    title: string,
    url: string,
    options?: Partial<Command>,
  ): Command => ({
    id: `external-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    icon: <Zap className="h-4 w-4" />,
    action: () => window.open(url, "_blank"),
    ...options,
  }),
};

// Predefined command sets
export const commandSets = {
  analytics: [
    commandBuilder.navigation("Analytics Dashboard", "/analytics", {
      description: "View analytics dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      keywords: ["analytics", "dashboard", "charts"],
    }),
    commandBuilder.navigation("Create Report", "/reports/new", {
      description: "Create a new report",
      icon: <Plus className="h-4 w-4" />,
      keywords: ["create", "report", "new"],
      badge: "New",
    }),
  ],

  workflows: [
    commandBuilder.navigation("Workflow Designer", "/workflows", {
      description: "Design and manage workflows",
      icon: <Workflow className="h-4 w-4" />,
      keywords: ["workflow", "designer", "automation"],
    }),
    commandBuilder.navigation("Create Workflow", "/workflows/new", {
      description: "Create a new workflow",
      icon: <Plus className="h-4 w-4" />,
      keywords: ["create", "workflow", "new"],
      badge: "New",
    }),
  ],

  integrations: [
    commandBuilder.navigation("Integration Hub", "/integrations", {
      description: "Manage external integrations",
      icon: <Zap className="h-4 w-4" />,
      keywords: ["integrations", "hub", "connections"],
    }),
    commandBuilder.navigation("Add Integration", "/integrations/new", {
      description: "Add a new integration",
      icon: <Plus className="h-4 w-4" />,
      keywords: ["add", "integration", "new"],
      badge: "New",
    }),
  ],
};
