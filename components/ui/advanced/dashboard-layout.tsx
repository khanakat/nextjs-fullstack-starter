"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Search,
  User,
  Settings,
  Sun,
  Moon,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveSidebar, SidebarSection } from "./sidebar";
import { Container, Grid } from "./grid";

// Types
export interface DashboardUser {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "info" | "warning" | "error" | "success";
}

export interface DashboardHeaderProps {
  title?: string;
  user?: DashboardUser;
  notifications?: DashboardNotification[];
  onSearch?: (query: string) => void;
  onThemeToggle?: () => void;
  onUserMenuClick?: (action: string) => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showThemeToggle?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarSections?: SidebarSection[];
  header?: React.ReactNode;
  headerProps?: DashboardHeaderProps;
  footer?: React.ReactNode;
  className?: string;
  containerSize?: "sm" | "default" | "lg" | "xl" | "full";
  spacing?: "sm" | "default" | "lg" | "xl";
}

export interface DashboardCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export interface DashboardStatsProps {
  stats: Array<{
    id: string;
    label: string;
    value: string | number;
    change?: {
      value: number;
      type: "increase" | "decrease";
      period?: string;
    };
    icon?: React.ComponentType<{ className?: string }>;
    color?: "default" | "primary" | "success" | "warning" | "destructive";
  }>;
  className?: string;
}

// Dashboard Header Component
export function DashboardHeader({
  title = "Dashboard",
  user,
  notifications = [],
  onSearch,
  onThemeToggle,
  onUserMenuClick,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showThemeToggle = true,
  className,
  children,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Title and custom content */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          {children}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          {showSearch && onSearch && (
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
            </form>
          )}

          {/* Theme Toggle */}
          {showThemeToggle && onThemeToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="h-9 w-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Notifications */}
          {showNotifications && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 p-0"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex flex-col space-y-1 p-3 hover:bg-muted",
                          !notification.read && "bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          {showUserMenu && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.initials || user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUserMenuClick?.("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUserMenuClick?.("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUserMenuClick?.("help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUserMenuClick?.("logout")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

// Dashboard Card Component
export function DashboardCard({
  title,
  description,
  children,
  className,
  headerActions,
  footer,
  loading = false,
  error,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {(title || description || headerActions) && (
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">{headerActions}</div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && <div className="flex items-center p-6 pt-0">{footer}</div>}
    </div>
  );
}

// Dashboard Stats Component
export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <Grid
      cols={{ sm: 1, md: 2, lg: stats.length > 2 ? 4 : stats.length }}
      className={className}
    >
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        const isIncrease = stat.change?.type === "increase";

        return (
          <DashboardCard key={stat.id} className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </h3>
              {IconComponent && (
                <IconComponent
                  className={cn("h-4 w-4", {
                    "text-primary": stat.color === "primary",
                    "text-green-600": stat.color === "success",
                    "text-yellow-600": stat.color === "warning",
                    "text-red-600": stat.color === "destructive",
                    "text-muted-foreground":
                      stat.color === "default" || !stat.color,
                  })}
                />
              )}
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p
                  className={cn(
                    "text-xs",
                    isIncrease ? "text-green-600" : "text-red-600",
                  )}
                >
                  {isIncrease ? "+" : ""}
                  {stat.change.value}%
                  {stat.change.period && (
                    <span className="text-muted-foreground">
                      {" "}
                      from {stat.change.period}
                    </span>
                  )}
                </p>
              )}
            </div>
          </DashboardCard>
        );
      })}
    </Grid>
  );
}

// Main Dashboard Layout Component
export function DashboardLayout({
  children,
  sidebar,
  sidebarSections,
  header,
  headerProps,
  footer,
  className,
  containerSize = "full",
  spacing = "default",
}: DashboardLayoutProps) {
  const sidebarContent =
    sidebar ||
    (sidebarSections && (
      <ResponsiveSidebar sections={sidebarSections} className="h-full" />
    ));

  const headerContent =
    header || (headerProps && <DashboardHeader {...headerProps} />);

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        {sidebarContent}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          {headerContent}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <Container size={containerSize}>
              <div
                className={cn({
                  "py-4": spacing === "sm",
                  "py-6": spacing === "default",
                  "py-8": spacing === "lg",
                  "py-12": spacing === "xl",
                })}
              >
                {children}
              </div>
            </Container>
          </main>

          {/* Footer */}
          {footer && (
            <footer className="border-t bg-background">
              <Container size={containerSize}>
                <div className="py-4">{footer}</div>
              </Container>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

// Dashboard Page Template
export function DashboardPageTemplate({
  title,
  description,
  actions,
  children,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}

// Quick Dashboard Templates
export function AnalyticsDashboard({
  stats,
  charts,
  tables,
  className,
}: {
  stats?: React.ComponentProps<typeof DashboardStats>["stats"];
  charts?: React.ReactNode;
  tables?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {stats && <DashboardStats stats={stats} />}

      {charts && (
        <Grid cols={{ sm: 1, lg: 2 }} gap={6}>
          {charts}
        </Grid>
      )}

      {tables && (
        <DashboardCard title="Recent Activity">{tables}</DashboardCard>
      )}
    </div>
  );
}

export function OverviewDashboard({
  welcomeMessage,
  quickActions,
  recentItems,
  stats,
  className,
}: {
  welcomeMessage?: React.ReactNode;
  quickActions?: React.ReactNode;
  recentItems?: React.ReactNode;
  stats?: React.ComponentProps<typeof DashboardStats>["stats"];
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {welcomeMessage && <DashboardCard>{welcomeMessage}</DashboardCard>}

      {stats && <DashboardStats stats={stats} />}

      <Grid cols={{ sm: 1, lg: 2 }} gap={6}>
        {quickActions && (
          <DashboardCard title="Quick Actions">{quickActions}</DashboardCard>
        )}

        {recentItems && (
          <DashboardCard title="Recent Items">{recentItems}</DashboardCard>
        )}
      </Grid>
    </div>
  );
}
