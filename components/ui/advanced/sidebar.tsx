"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Settings,
  User,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: SidebarItem[];
  disabled?: boolean;
  active?: boolean;
}

export interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface SidebarProps {
  sections: SidebarSection[];
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: string;
  collapsedWidth?: string;
  position?: "left" | "right";
  variant?: "default" | "floating" | "bordered";
  showToggle?: boolean;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: SidebarItem) => void;
}

export interface MobileSidebarProps
  extends Omit<SidebarProps, "collapsed" | "onCollapsedChange"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

// Sidebar Item Component
function SidebarItemComponent({
  item,
  collapsed = false,
  level = 0,
  onItemClick,
}: {
  item: SidebarItem;
  collapsed?: boolean;
  level?: number;
  onItemClick?: (item: SidebarItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const IconComponent = item.icon;

  const handleClick = () => {
    if (item.disabled) return;

    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onItemClick?.(item);
      item.onClick?.();
    }
  };

  const itemClasses = cn(
    "flex items-center w-full text-left transition-colors rounded-md",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
    item.active && "bg-accent text-accent-foreground",
    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
    collapsed ? "justify-center p-2" : "justify-between px-3 py-2",
    level > 0 && !collapsed && `ml-${level * 4}`,
  );

  const content = (
    <div className="flex items-center flex-1 min-w-0">
      {IconComponent && (
        <IconComponent
          className={cn(
            "flex-shrink-0",
            collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
          )}
        />
      )}
      {!collapsed && (
        <span className="truncate text-sm font-medium">{item.label}</span>
      )}
    </div>
  );

  const rightContent = !collapsed && (
    <div className="flex items-center space-x-1">
      {item.badge && (
        <Badge variant="secondary" className="text-xs">
          {item.badge}
        </Badge>
      )}
      {hasChildren && (
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      )}
    </div>
  );

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={itemClasses}
            onClick={handleClick}
            disabled={item.disabled}
          >
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                {content}
                {rightContent}
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => (
              <SidebarItemComponent
                key={child.id}
                item={child}
                collapsed={collapsed}
                level={level + 1}
                onItemClick={onItemClick}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      className={itemClasses}
      onClick={handleClick}
      disabled={item.disabled}
      asChild={!!item.href}
    >
      {item.href ? (
        <a href={item.href}>
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              {content}
              {rightContent}
            </>
          )}
        </a>
      ) : (
        <>
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              {content}
              {rightContent}
            </>
          )}
        </>
      )}
    </Button>
  );
}

// Sidebar Section Component
function SidebarSectionComponent({
  section,
  collapsed = false,
  onItemClick,
}: {
  section: SidebarSection;
  collapsed?: boolean;
  onItemClick?: (item: SidebarItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true);

  if (section.collapsible && !collapsed) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {section.title && (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {section.title}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent className="space-y-1">
          {section.items.map((item) => (
            <SidebarItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-1">
      {section.title && !collapsed && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </h3>
        </div>
      )}
      {section.items.map((item) => (
        <SidebarItemComponent
          key={item.id}
          item={item}
          collapsed={collapsed}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

// Main Sidebar Component
export function Sidebar({
  sections,
  collapsed = false,
  onCollapsedChange,
  width = "280px",
  collapsedWidth = "60px",
  position = "left",
  variant = "default",
  showToggle = true,
  className,
  header,
  footer,
  onItemClick,
}: SidebarProps) {
  const sidebarClasses = cn(
    "flex flex-col bg-background transition-all duration-300 ease-in-out",
    {
      "border-r": variant === "default" || variant === "bordered",
      "border border-border rounded-lg m-2": variant === "floating",
      "shadow-lg": variant === "floating",
    },
    className,
  );

  const sidebarStyle = {
    width: collapsed ? collapsedWidth : width,
  };

  return (
    <aside className={sidebarClasses} style={sidebarStyle}>
      {/* Header */}
      {header && (
        <div className={cn("flex-shrink-0 p-4", collapsed && "px-2")}>
          {header}
        </div>
      )}

      {/* Toggle Button */}
      {showToggle && onCollapsedChange && (
        <div
          className={cn("flex justify-end p-2", collapsed && "justify-center")}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {position === "left" ? (
              collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )
            ) : collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-2 py-2">
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              <SidebarSectionComponent
                section={section}
                collapsed={collapsed}
                onItemClick={onItemClick}
              />
              {index < sections.length - 1 && !collapsed && (
                <Separator className="my-2" />
              )}
            </React.Fragment>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {footer && (
        <div className={cn("flex-shrink-0 p-4 border-t", collapsed && "px-2")}>
          {footer}
        </div>
      )}
    </aside>
  );
}

// Mobile Sidebar Component
export function MobileSidebar({
  sections,
  open,
  onOpenChange,
  trigger,
  header,
  footer,
  onItemClick,
}: MobileSidebarProps) {
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const triggerElement = document.getElementById("mobile-sidebar-trigger");

      if (
        open &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        triggerElement &&
        !triggerElement.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  const handleItemClick = (item: SidebarItem) => {
    onItemClick?.(item);
    onOpenChange(false); // Close mobile sidebar after item click
  };

  return (
    <>
      {/* Trigger */}
      {trigger || (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(!open)}
          className="md:hidden"
          id="mobile-sidebar-trigger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-80 transform transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col bg-background border-r">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b">
            {header || <div className="font-semibold">Menu</div>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2">
            <nav className="space-y-2 py-2">
              {sections.map((section, index) => (
                <React.Fragment key={section.id}>
                  <SidebarSectionComponent
                    section={section}
                    collapsed={false}
                    onItemClick={handleItemClick}
                  />
                  {index < sections.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          {footer && <div className="flex-shrink-0 p-4 border-t">{footer}</div>}
        </div>
      </div>
    </>
  );
}

// Sidebar with responsive behavior
export function ResponsiveSidebar({
  sections,
  className,
  ...props
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          sections={sections}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          className={className}
          {...props}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        sections={sections}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        className={className}
        {...props}
      />
    </>
  );
}

// Sidebar Layout Wrapper
export function SidebarLayout({
  sidebar,
  children,
  className,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-screen overflow-hidden", className)}>
      {sidebar}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

// Example sidebar sections for common use cases
export const defaultSidebarSections: SidebarSection[] = [
  {
    id: "main",
    items: [
      {
        id: "home",
        label: "Home",
        icon: Home,
        href: "/",
        active: true,
      },
      {
        id: "search",
        label: "Search",
        icon: Search,
        href: "/search",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        badge: 3,
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        href: "/profile",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        children: [
          {
            id: "general",
            label: "General",
            href: "/settings/general",
          },
          {
            id: "security",
            label: "Security",
            href: "/settings/security",
          },
          {
            id: "notifications-settings",
            label: "Notifications",
            href: "/settings/notifications",
          },
        ],
      },
    ],
  },
];
