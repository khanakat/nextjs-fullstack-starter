"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Star,
  User,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import NextImage from "next/image";

// Types
export interface AdvancedTooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: "default" | "info" | "warning" | "success" | "error" | "help";
  size?: "sm" | "default" | "lg";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  showArrow?: boolean;
  interactive?: boolean;
  maxWidth?: number;
}

export interface RichTooltipProps extends AdvancedTooltipProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline";
  }>;
  image?: string;
  badge?: string;
  metadata?: Array<{
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export interface HelpTooltipProps {
  children: React.ReactNode;
  title: string;
  content: string;
  learnMoreUrl?: string;
  className?: string;
}

export interface StatusTooltipProps {
  children: React.ReactNode;
  status: "online" | "offline" | "busy" | "away";
  lastSeen?: string;
  className?: string;
}

export interface UserTooltipProps {
  children: React.ReactNode;
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    status?: "online" | "offline" | "busy" | "away";
    lastSeen?: string;
    location?: string;
    joinedDate?: string;
  };
  showActions?: boolean;
  onAction?: (action: string) => void;
  className?: string;
}

// Utility functions
function getVariantStyles(variant: AdvancedTooltipProps["variant"]) {
  switch (variant) {
    case "info":
      return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";
    case "warning":
      return "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100";
    case "success":
      return "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100";
    case "error":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100";
    case "help":
      return "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100";
    default:
      return "";
  }
}

function getVariantIcon(variant: AdvancedTooltipProps["variant"]) {
  switch (variant) {
    case "info":
      return Info;
    case "warning":
      return AlertTriangle;
    case "success":
      return CheckCircle;
    case "error":
      return XCircle;
    case "help":
      return HelpCircle;
    default:
      return null;
  }
}

function getSizeStyles(size: AdvancedTooltipProps["size"]) {
  switch (size) {
    case "sm":
      return "text-xs p-2 max-w-xs";
    case "lg":
      return "text-sm p-4 max-w-md";
    default:
      return "text-sm p-3 max-w-sm";
  }
}

// Advanced Tooltip Component
export function AdvancedTooltip({
  children,
  content,
  title,
  description,
  variant = "default",
  size = "default",
  side = "top",
  align = "center",
  delayDuration = 200,
  disabled = false,
  className,
  contentClassName,
  interactive = false,
  maxWidth = 320,
}: AdvancedTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const IconComponent = getVariantIcon(variant);
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  const tooltipContent = content || (
    <div className="space-y-1">
      {title && (
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4 flex-shrink-0" />}
          <p className="font-medium">{title}</p>
        </div>
      )}
      {description && (
        <p className={cn("text-muted-foreground", title && "text-xs")}>
          {description}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(sizeStyles, variantStyles, contentClassName)}
          style={{ maxWidth }}
          {...(interactive && {
            onPointerDownOutside: (e) => e.preventDefault(),
            onPointerLeave: (e) => e.preventDefault(),
          })}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Rich Tooltip Component
export function RichTooltip({
  children,
  title,
  description,
  header,
  footer,
  actions = [],
  image,
  badge,
  metadata = [],
  variant = "default",
  side = "top",
  align = "center",
  delayDuration = 200,
  disabled = false,
  className,
  contentClassName,
  maxWidth = 400,
}: RichTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const variantStyles = getVariantStyles(variant);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("p-0 overflow-hidden", variantStyles, contentClassName)}
          style={{ maxWidth }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="space-y-0">
            {/* Header */}
            {(header || image) && (
              <div className="p-3 pb-2">
                {image && (
                  <NextImage
                    src={image}
                    alt=""
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                )}
                {header}
              </div>
            )}

            {/* Main Content */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="space-y-1 flex-1">
                  {title && (
                    <h4 className="font-medium text-sm leading-none">
                      {title}
                    </h4>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              {metadata.length > 0 && (
                <div className="space-y-1 mb-2">
                  {metadata.map((item, index) => {
                    const MetaIcon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        {MetaIcon && (
                          <MetaIcon className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground">
                          {item.label}:
                        </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <>
                <Separator />
                <div className="p-2 flex gap-1">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Footer */}
            {footer && (
              <>
                <Separator />
                <div className="p-3 pt-2">{footer}</div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Help Tooltip Component
export function HelpTooltip({
  children,
  title,
  content,
  learnMoreUrl,
  className,
}: HelpTooltipProps) {
  return (
    <AdvancedTooltip
      variant="help"
      title={title}
      description={content}
      size="lg"
      className={className}
      interactive={!!learnMoreUrl}
      content={
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content}
              </p>
            </div>
          </div>
          {learnMoreUrl && (
            <>
              <Separator />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => window.open(learnMoreUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Learn More
              </Button>
            </>
          )}
        </div>
      }
    >
      {children}
    </AdvancedTooltip>
  );
}

// Status Tooltip Component
export function StatusTooltip({
  children,
  status,
  lastSeen,
  className,
}: StatusTooltipProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "online":
        return { color: "bg-green-500", label: "Online" };
      case "busy":
        return { color: "bg-red-500", label: "Busy" };
      case "away":
        return { color: "bg-yellow-500", label: "Away" };
      default:
        return { color: "bg-gray-400", label: "Offline" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <AdvancedTooltip
      className={className}
      content={
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusInfo.color)} />
          <span className="text-sm font-medium">{statusInfo.label}</span>
          {lastSeen && status === "offline" && (
            <span className="text-xs text-muted-foreground">
              • Last seen {lastSeen}
            </span>
          )}
        </div>
      }
    >
      {children}
    </AdvancedTooltip>
  );
}

// User Tooltip Component
export function UserTooltip({
  children,
  user,
  showActions = false,
  onAction,
  className,
}: UserTooltipProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-red-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const metadata = [
    ...(user.role ? [{ label: "Role", value: user.role, icon: Star }] : []),
    ...(user.location
      ? [{ label: "Location", value: user.location, icon: MapPin }]
      : []),
    ...(user.joinedDate
      ? [{ label: "Joined", value: user.joinedDate, icon: Calendar }]
      : []),
  ];

  const actions = showActions
    ? [
        {
          label: "View Profile",
          onClick: () => onAction?.("profile"),
          variant: "outline" as const,
        },
        {
          label: "Send Message",
          onClick: () => onAction?.("message"),
          variant: "default" as const,
        },
      ]
    : [];

  return (
    <RichTooltip
      className={className}
      header={
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {user.avatar ? (
                <NextImage
                  src={user.avatar}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {user.status && (
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  getStatusColor(user.status),
                )}
              />
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">{user.name}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>
      }
      metadata={metadata}
      actions={actions}
      badge={
        user.status === "offline" && user.lastSeen
          ? `Last seen ${user.lastSeen}`
          : undefined
      }
    >
      {children}
    </RichTooltip>
  );
}

// Tooltip Variants for common use cases
export function InfoTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <AdvancedTooltip variant="info" description={content} className={className}>
      {children}
    </AdvancedTooltip>
  );
}

export function WarningTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <AdvancedTooltip
      variant="warning"
      description={content}
      className={className}
    >
      {children}
    </AdvancedTooltip>
  );
}

export function ErrorTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <AdvancedTooltip
      variant="error"
      description={content}
      className={className}
    >
      {children}
    </AdvancedTooltip>
  );
}

export function SuccessTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <AdvancedTooltip
      variant="success"
      description={content}
      className={className}
    >
      {children}
    </AdvancedTooltip>
  );
}
