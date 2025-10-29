"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Types
export interface GridProps {
  children: React.ReactNode;
  cols?:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  gap?: number | string;
  className?: string;
  autoFit?: boolean;
  minItemWidth?: string;
}

export interface GridItemProps {
  children: React.ReactNode;
  span?:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  start?:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  end?:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  className?: string;
}

export interface MasonryProps {
  children: React.ReactNode;
  cols?:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  gap?: number | string;
  className?: string;
}

export interface FlexGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: number | string;
  className?: string;
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "stretch" | "baseline";
}

// Utility functions
const getResponsiveClasses = (
  value:
    | number
    | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number }
    | undefined,
  prefix: string,
): string => {
  if (typeof value === "number") {
    return `${prefix}-${value}`;
  }

  if (typeof value === "object" && value !== null) {
    const classes: string[] = [];

    if (value.sm !== undefined) classes.push(`sm:${prefix}-${value.sm}`);
    if (value.md !== undefined) classes.push(`md:${prefix}-${value.md}`);
    if (value.lg !== undefined) classes.push(`lg:${prefix}-${value.lg}`);
    if (value.xl !== undefined) classes.push(`xl:${prefix}-${value.xl}`);
    if (value["2xl"] !== undefined)
      classes.push(`2xl:${prefix}-${value["2xl"]}`);

    return classes.join(" ");
  }

  return "";
};

const getGapClass = (gap: number | string | undefined): string => {
  if (typeof gap === "number") {
    return `gap-${gap}`;
  }
  if (typeof gap === "string") {
    return gap.startsWith("gap-") ? gap : `gap-[${gap}]`;
  }
  return "gap-4";
};

// Grid Component
export function Grid({
  children,
  cols = 12,
  gap = 4,
  className,
  autoFit = false,
  minItemWidth = "250px",
}: GridProps) {
  const gridClasses = cn(
    "grid",
    autoFit
      ? `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
      : getResponsiveClasses(cols, "grid-cols"),
    getGapClass(gap),
    className,
  );

  return <div className={gridClasses}>{children}</div>;
}

// Grid Item Component
export function GridItem({
  children,
  span,
  start,
  end,
  className,
}: GridItemProps) {
  const itemClasses = cn(
    getResponsiveClasses(span, "col-span"),
    getResponsiveClasses(start, "col-start"),
    getResponsiveClasses(end, "col-end"),
    className,
  );

  return <div className={itemClasses}>{children}</div>;
}

// Flex Grid Component (alternative to CSS Grid)
export function FlexGrid({
  children,
  minItemWidth = "250px",
  gap = 4,
  className,
  justify = "start",
  align = "stretch",
}: FlexGridProps) {
  const flexClasses = cn(
    "flex flex-wrap",
    `justify-${justify}`,
    `items-${align}`,
    getGapClass(gap),
    className,
  );

  const childrenWithStyles = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        style: {
          minWidth: minItemWidth,
          flex: "1 1 auto",
          ...child.props.style,
        },
      });
    }
    return child;
  });

  return <div className={flexClasses}>{childrenWithStyles}</div>;
}

// Masonry Layout Component
export function Masonry({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className,
}: MasonryProps) {
  const columnCount = typeof cols === "number" ? cols : cols.lg || 3;

  // Distribute children across columns
  const columns: React.ReactNode[][] = Array.from(
    { length: columnCount },
    () => [],
  );

  React.Children.forEach(children, (child, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(child);
  });

  const masonryClasses = cn("flex", getGapClass(gap), className);

  const columnClasses = cn("flex flex-col flex-1", getGapClass(gap));

  return (
    <div className={masonryClasses}>
      {columns.map((column, index) => (
        <div key={index} className={columnClasses}>
          {column}
        </div>
      ))}
    </div>
  );
}

// Auto Grid Component (automatically adjusts based on content)
export function AutoGrid({
  children,
  minItemWidth = "250px",
  maxItemWidth = "1fr",
  gap = 4,
  className,
}: {
  children: React.ReactNode;
  minItemWidth?: string;
  maxItemWidth?: string;
  gap?: number | string;
  className?: string;
}) {
  const gridClasses = cn("grid", getGapClass(gap), className);

  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, ${maxItemWidth}))`,
  };

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
}

// Responsive Container Component
export function Container({
  children,
  size = "default",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "default" | "lg" | "xl" | "full";
  className?: string;
}) {
  const containerClasses = cn(
    "mx-auto px-4 sm:px-6 lg:px-8",
    {
      "max-w-3xl": size === "sm",
      "max-w-7xl": size === "default",
      "max-w-[90rem]": size === "lg",
      "max-w-[120rem]": size === "xl",
      "max-w-none": size === "full",
    },
    className,
  );

  return <div className={containerClasses}>{children}</div>;
}

// Section Component with built-in spacing
export function Section({
  children,
  spacing = "default",
  className,
}: {
  children: React.ReactNode;
  spacing?: "sm" | "default" | "lg" | "xl";
  className?: string;
}) {
  const sectionClasses = cn(
    {
      "py-8": spacing === "sm",
      "py-12 md:py-16": spacing === "default",
      "py-16 md:py-20": spacing === "lg",
      "py-20 md:py-24": spacing === "xl",
    },
    className,
  );

  return <section className={sectionClasses}>{children}</section>;
}

// Stack Component (vertical layout)
export function Stack({
  children,
  spacing = 4,
  align = "stretch",
  className,
}: {
  children: React.ReactNode;
  spacing?: number | string;
  align?: "start" | "end" | "center" | "stretch";
  className?: string;
}) {
  const stackClasses = cn(
    "flex flex-col",
    `items-${align}`,
    typeof spacing === "number" ? `space-y-${spacing}` : spacing,
    className,
  );

  return <div className={stackClasses}>{children}</div>;
}

// Inline Component (horizontal layout)
export function Inline({
  children,
  spacing = 4,
  align = "center",
  wrap = true,
  className,
}: {
  children: React.ReactNode;
  spacing?: number | string;
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  wrap?: boolean;
  className?: string;
}) {
  const inlineClasses = cn(
    "flex",
    `items-${align}`,
    wrap && "flex-wrap",
    typeof spacing === "number" ? `space-x-${spacing}` : spacing,
    className,
  );

  return <div className={inlineClasses}>{children}</div>;
}

// Cluster Component (for grouping related items)
export function Cluster({
  children,
  spacing = 2,
  justify = "start",
  align = "center",
  className,
}: {
  children: React.ReactNode;
  spacing?: number | string;
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  className?: string;
}) {
  const clusterClasses = cn(
    "flex flex-wrap",
    `justify-${justify}`,
    `items-${align}`,
    getGapClass(spacing),
    className,
  );

  return <div className={clusterClasses}>{children}</div>;
}

// Sidebar Layout Component
export function SidebarLayout({
  sidebar,
  children,
  sidebarWidth = "250px",
  sidebarPosition = "left",
  collapsed = false,
  className,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  sidebarPosition?: "left" | "right";
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  const layoutClasses = cn(
    "flex h-full",
    sidebarPosition === "right" && "flex-row-reverse",
    className,
  );

  const sidebarClasses = cn(
    "flex-shrink-0 transition-all duration-300",
    collapsed ? "w-0 overflow-hidden" : `w-[${sidebarWidth}]`,
    sidebarPosition === "right" ? "border-l" : "border-r",
  );

  const mainClasses = cn(
    "flex-1 overflow-auto",
    sidebarPosition === "right" ? "mr-4" : "ml-4",
  );

  return (
    <div className={layoutClasses}>
      <aside className={sidebarClasses}>{sidebar}</aside>
      <main className={mainClasses}>{children}</main>
    </div>
  );
}

// Split Pane Component
export function SplitPane({
  left,
  right,
  split = "vertical",
  defaultSize = "50%",
  resizable = true,
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  split?: "vertical" | "horizontal";
  defaultSize?: string;
  minSize?: string;
  maxSize?: string;
  resizable?: boolean;
  className?: string;
}) {
  const [size] = React.useState(defaultSize);
  const [isResizing, setIsResizing] = React.useState(false);

  const splitClasses = cn(
    "flex",
    split === "horizontal" ? "flex-col" : "flex-row",
    className,
  );

  const leftPaneClasses = cn(
    "overflow-auto",
    split === "horizontal" ? "h-full" : "w-full",
  );

  const rightPaneClasses = cn("flex-1 overflow-auto");

  const resizerClasses = cn(
    "bg-border hover:bg-primary/20 transition-colors",
    split === "horizontal" ? "h-1 cursor-row-resize" : "w-1 cursor-col-resize",
    isResizing && "bg-primary/40",
  );

  const leftPaneStyle =
    split === "horizontal" ? { height: size } : { width: size };

  return (
    <div className={splitClasses}>
      <div className={leftPaneClasses} style={leftPaneStyle}>
        {left}
      </div>

      {resizable && (
        <div
          className={resizerClasses}
          onMouseDown={() => setIsResizing(true)}
          onMouseUp={() => setIsResizing(false)}
        />
      )}

      <div className={rightPaneClasses}>{right}</div>
    </div>
  );
}

// Card Grid Component (specialized grid for cards)
export function CardGrid({
  children,
  minCardWidth = "300px",
  gap = 6,
  className,
}: {
  children: React.ReactNode;
  minCardWidth?: string;
  gap?: number | string;
  className?: string;
}) {
  return (
    <AutoGrid
      minItemWidth={minCardWidth}
      gap={gap}
      className={cn("auto-rows-fr", className)}
    >
      {children}
    </AutoGrid>
  );
}

// Dashboard Grid Component (specialized for dashboard layouts)
export function DashboardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        "auto-rows-min",
        className,
      )}
    >
      {children}
    </div>
  );
}
