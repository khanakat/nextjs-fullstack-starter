"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, GripHorizontal } from "lucide-react";

// Types
export interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  direction?: "horizontal" | "vertical";
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  disabled?: boolean;
  onResize?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
  className?: string;
  paneClassName?: string;
  resizerClassName?: string;
  allowResize?: boolean;
  defaultSize?: number;
}

export interface MultiSplitPaneProps {
  children: React.ReactNode[];
  direction?: "horizontal" | "vertical";
  sizes?: number[];
  minSizes?: number[];
  onResize?: (sizes: number[]) => void;
  className?: string;
  paneClassName?: string;
  resizerClassName?: string;
  allowResize?: boolean;
}

export interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  id?: string;
}

export interface PanelGroupProps {
  children: React.ReactNode[];
  direction?: "horizontal" | "vertical";
  className?: string;
  onLayout?: (sizes: number[]) => void;
}

// Hook for managing resize logic
function useResize(
  direction: "horizontal" | "vertical",
  initialSize: number,
  minSize: number,
  maxSize: number,
  onResize?: (size: number) => void,
  onResizeEnd?: (size: number) => void,
) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newSize: number;
      if (direction === "horizontal") {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onResize?.(newSize);
    },
    [isResizing, direction, minSize, maxSize, onResize],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onResizeEnd?.(size);
    }
  }, [isResizing, size, onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
    return undefined;
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  return {
    size,
    isResizing,
    containerRef,
    handleMouseDown,
  };
}

// Basic Split Pane Component
export function SplitPane({
  children,
  direction = "horizontal",
  initialSize = 50,
  minSize = 10,
  maxSize = 90,
  disabled = false,
  onResize,
  onResizeEnd,
  className,
  paneClassName,
  resizerClassName,
  allowResize = true,
  defaultSize,
}: SplitPaneProps) {
  const size = defaultSize ?? initialSize;
  const {
    size: currentSize,
    isResizing,
    containerRef,
    handleMouseDown,
  } = useResize(direction, size, minSize, maxSize, onResize, onResizeEnd);

  const [leftChild, rightChild] = children;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full",
        direction === "horizontal" ? "flex-row" : "flex-col",
        className,
      )}
    >
      {/* First Pane */}
      <div
        className={cn("overflow-hidden", paneClassName)}
        style={{
          [direction === "horizontal" ? "width" : "height"]: `${currentSize}%`,
        }}
      >
        {leftChild}
      </div>

      {/* Resizer */}
      {allowResize && !disabled && (
        <div
          className={cn(
            "group relative flex items-center justify-center bg-border transition-colors hover:bg-border/80",
            direction === "horizontal"
              ? "w-1 cursor-col-resize hover:w-2"
              : "h-1 cursor-row-resize hover:h-2",
            isResizing && "bg-primary",
            resizerClassName,
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              "absolute rounded-sm bg-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100",
              direction === "horizontal" ? "h-8 w-0.5" : "h-0.5 w-8",
              isResizing && "opacity-100",
            )}
          >
            {direction === "horizontal" ? (
              <GripVertical className="h-4 w-4 -translate-x-1.5 translate-y-2" />
            ) : (
              <GripHorizontal className="h-4 w-4 -translate-y-1.5 translate-x-2" />
            )}
          </div>
        </div>
      )}

      {/* Second Pane */}
      <div
        className={cn("flex-1 overflow-hidden", paneClassName)}
        style={{
          [direction === "horizontal" ? "width" : "height"]:
            `${100 - currentSize}%`,
        }}
      >
        {rightChild}
      </div>
    </div>
  );
}

// Multi Split Pane Component
export function MultiSplitPane({
  children,
  direction = "horizontal",
  sizes: initialSizes,
  minSizes = [],
  onResize,
  className,
  paneClassName,
  resizerClassName,
  allowResize = true,
}: MultiSplitPaneProps) {
  const childrenArray = React.Children.toArray(children);
  const defaultSizes =
    initialSizes || childrenArray.map(() => 100 / childrenArray.length);
  const [sizes, setSizes] = useState<number[]>(defaultSizes);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingIndex, setResizingIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      setResizingIndex(index);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || resizingIndex === -1 || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let position: number;
      if (direction === "horizontal") {
        position = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        position = ((e.clientY - rect.top) / rect.height) * 100;
      }

      const newSizes = [...sizes];
      const currentTotal =
        newSizes[resizingIndex] + newSizes[resizingIndex + 1];

      // Calculate cumulative size up to resizing index
      const cumulativeSize = newSizes
        .slice(0, resizingIndex)
        .reduce((sum, size) => sum + size, 0);

      const newFirstSize = position - cumulativeSize;
      const newSecondSize = currentTotal - newFirstSize;

      // Apply min size constraints
      const minFirst = minSizes[resizingIndex] || 5;
      const minSecond = minSizes[resizingIndex + 1] || 5;

      if (newFirstSize >= minFirst && newSecondSize >= minSecond) {
        newSizes[resizingIndex] = newFirstSize;
        newSizes[resizingIndex + 1] = newSecondSize;
        setSizes(newSizes);
        onResize?.(newSizes);
      }
    },
    [isResizing, resizingIndex, sizes, direction, minSizes, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingIndex(-1);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
    return undefined;
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full",
        direction === "horizontal" ? "flex-row" : "flex-col",
        className,
      )}
    >
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {/* Pane */}
          <div
            className={cn("overflow-hidden", paneClassName)}
            style={{
              [direction === "horizontal" ? "width" : "height"]:
                `${sizes[index]}%`,
            }}
          >
            {child}
          </div>

          {/* Resizer (not after last pane) */}
          {index < childrenArray.length - 1 && allowResize && (
            <div
              className={cn(
                "group relative flex items-center justify-center bg-border transition-colors hover:bg-border/80",
                direction === "horizontal"
                  ? "w-1 cursor-col-resize hover:w-2"
                  : "h-1 cursor-row-resize hover:h-2",
                isResizing && resizingIndex === index && "bg-primary",
                resizerClassName,
              )}
              onMouseDown={handleMouseDown(index)}
            >
              <div
                className={cn(
                  "absolute rounded-sm bg-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100",
                  direction === "horizontal" ? "h-8 w-0.5" : "h-0.5 w-8",
                  isResizing && resizingIndex === index && "opacity-100",
                )}
              >
                {direction === "horizontal" ? (
                  <GripVertical className="h-4 w-4 -translate-x-1.5 translate-y-2" />
                ) : (
                  <GripHorizontal className="h-4 w-4 -translate-y-1.5 translate-x-2" />
                )}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Resizable Panel Component
export function ResizablePanel({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className,
  id,
}: ResizablePanelProps) {
  return (
    <div
      className={cn("h-full overflow-hidden", className)}
      data-panel-id={id}
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  );
}

// Panel Group Component
export function PanelGroup({
  children,
  direction = "horizontal",
  className,
  onLayout,
}: PanelGroupProps) {
  const childrenArray = React.Children.toArray(children);
  const [sizes, setSizes] = useState<number[]>(
    childrenArray.map(() => 100 / childrenArray.length),
  );

  const handleResize = useCallback(
    (newSizes: number[]) => {
      setSizes(newSizes);
      onLayout?.(newSizes);
    },
    [onLayout],
  );

  return (
    <MultiSplitPane
      direction={direction}
      sizes={sizes}
      onResize={handleResize}
      className={className}
    >
      {children}
    </MultiSplitPane>
  );
}

// Preset Layouts
export function CodeEditorLayout({
  sidebar,
  editor,
  terminal,
  className,
}: {
  sidebar?: React.ReactNode;
  editor: React.ReactNode;
  terminal?: React.ReactNode;
  className?: string;
}) {
  if (!sidebar && !terminal) {
    return <div className={className}>{editor}</div>;
  }

  if (!terminal) {
    return (
      <SplitPane direction="horizontal" initialSize={20} className={className}>
        {sidebar}
        {editor}
      </SplitPane>
    );
  }

  if (!sidebar) {
    return (
      <SplitPane direction="vertical" initialSize={70} className={className}>
        {editor}
        {terminal}
      </SplitPane>
    );
  }

  return (
    <SplitPane direction="horizontal" initialSize={20} className={className}>
      {sidebar}
      <SplitPane direction="vertical" initialSize={70}>
        {editor}
        {terminal}
      </SplitPane>
    </SplitPane>
  );
}

export function DashboardSplitLayout({
  sidebar,
  main,
  details,
  className,
}: {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  details?: React.ReactNode;
  className?: string;
}) {
  if (!sidebar && !details) {
    return <div className={className}>{main}</div>;
  }

  if (!details) {
    return (
      <SplitPane direction="horizontal" initialSize={25} className={className}>
        {sidebar}
        {main}
      </SplitPane>
    );
  }

  if (!sidebar) {
    return (
      <SplitPane direction="horizontal" initialSize={70} className={className}>
        {main}
        {details}
      </SplitPane>
    );
  }

  return (
    <MultiSplitPane
      direction="horizontal"
      sizes={[25, 50, 25]}
      className={className}
    >
      {sidebar}
      {main}
      {details}
    </MultiSplitPane>
  );
}

export function EmailLayout({
  folderList,
  messageList,
  messageView,
  className,
}: {
  folderList: React.ReactNode;
  messageList: React.ReactNode;
  messageView: React.ReactNode;
  className?: string;
}) {
  return (
    <MultiSplitPane
      direction="horizontal"
      sizes={[20, 30, 50]}
      minSizes={[15, 25, 40]}
      className={className}
    >
      {folderList}
      {messageList}
      {messageView}
    </MultiSplitPane>
  );
}
