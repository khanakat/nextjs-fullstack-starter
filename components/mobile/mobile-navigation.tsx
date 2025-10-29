"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  Workflow,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Search,
  Bell,
  User,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

interface MobileNavigationProps {
  className?: string;
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
}

const bottomNavItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "showcase", label: "Showcase", icon: Layers, href: "/showcase" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
  { id: "workflows", label: "Workflows", icon: Workflow, href: "/workflows" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

const sideNavItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/" },
  { id: "showcase", label: "Showcase", icon: Layers, href: "/showcase" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
  {
    id: "workflows",
    label: "Workflows",
    icon: Workflow,
    href: "/showcase/features/workflows",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    icon: Users,
    href: "/showcase/features/collaboration",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Settings,
    href: "/showcase/features/integrations",
  },
  { id: "mobile", label: "Mobile", icon: User, href: "/showcase/features/mobile" },
  { id: "offline", label: "Offline", icon: Bell, href: "/showcase/features/offline" },
  { id: "install", label: "Install PWA", icon: Bell, href: "/install" },
];

/**
 * Mobile Bottom Navigation Component
 */
export function MobileBottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    // Add haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    router.push(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700",
        "safe-area-inset-bottom",
        className,
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative",
                "transition-colors duration-200 rounded-lg mx-1",
                "touch-manipulation select-none",
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "scale-110")} />
              <span className="text-xs font-medium truncate">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile Top Navigation Component
 */
export function MobileTopNavigation({
  className,
  showBackButton = false,
  title,
  onBackClick,
}: MobileNavigationProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBackClick = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const toggleMenu = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
          "safe-area-inset-top",
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="p-2 -ml-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            {title && (
              <h1 className="text-lg font-semibold truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="w-5 h-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 w-2 h-2 p-0"
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <MobileSideMenu onClose={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Mobile Side Menu Component
 */
function MobileSideMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    router.push(href);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Menu</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        {sideNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left",
                "transition-colors duration-200 touch-manipulation",
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <User className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">John Doe</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              john@example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Mobile Navigation Layout
 */
export function MobileNavigation({
  children,
  showBottomNav = true,
  showTopNav = true,
  title,
  showBackButton = false,
  onBackClick,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showTopNav?: boolean;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showTopNav && (
        <MobileTopNavigation
          title={title}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
        />
      )}

      <main
        className={cn(
          "flex-1",
          showTopNav && "pt-16",
          showBottomNav && "pb-20",
        )}
      >
        {children}
      </main>

      {showBottomNav && <MobileBottomNavigation />}
    </div>
  );
}
