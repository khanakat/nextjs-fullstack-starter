"use client";

import React, { forwardRef } from "react";

import { GripVertical } from "lucide-react";
import { useSortableItem } from "@/src/hooks/useSortableItem";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  dragHandleClassName?: string;
  showDragHandle?: boolean;
  dragHandlePosition?: "left" | "right" | "top" | "bottom";
  direction?: "vertical" | "horizontal";
  style?: React.CSSProperties;
}

export const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  (
    {
      id,
      children,
      disabled = false,
      className = "",
      dragHandleClassName = "",
      showDragHandle = true,
      dragHandlePosition = "left",
      direction = "vertical",
      style: externalStyle = {},
    },
    ref,
  ) => {
    const { attributes, listeners, setNodeRef, transform, isDragging, isOver } =
      useSortableItem(id, { disabled });

    const style = {
      ...(transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            transition: isDragging
              ? "none"
              : "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
          }
        : {
            transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
          }),
      ...externalStyle,
    };

    const itemClasses = cn(
      "sortable-item group relative bg-white border border-gray-200 rounded-lg p-4",
      "cursor-grab active:cursor-grabbing select-none",
      "transition-all duration-200 ease-out",
      "hover:shadow-md hover:border-gray-300",
      {
        "hover:-translate-y-0.5": direction === "vertical",
        "hover:-translate-x-0.5": direction === "horizontal",
        "sortable-item-dragging opacity-75 shadow-xl scale-105 z-50":
          isDragging,
        "ring-2 ring-blue-500 ring-opacity-50": isOver && !isDragging,
        "cursor-not-allowed opacity-60": disabled,
      },
      className,
    );

    const dragHandleClasses = cn(
      "flex items-center justify-center w-6 h-6",
      "text-gray-400 hover:text-gray-600",
      "cursor-grab active:cursor-grabbing",
      "transition-colors duration-200",
      {
        "cursor-not-allowed": disabled,
      },
      dragHandleClassName,
    );

    const DragHandle = () => (
      <div className={dragHandleClasses} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
    );

    const renderContent = () => {
      if (!showDragHandle) {
        return (
          <div {...attributes} {...listeners} className="w-full">
            {children}
          </div>
        );
      }

      switch (dragHandlePosition) {
        case "left":
          return (
            <div className="flex items-center space-x-3">
              <DragHandle />
              <div className="flex-1">{children}</div>
            </div>
          );
        case "right":
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-1">{children}</div>
              <DragHandle />
            </div>
          );
        case "top":
          return (
            <div className="flex flex-col space-y-2">
              <div className="flex justify-center">
                <DragHandle />
              </div>
              <div>{children}</div>
            </div>
          );
        case "bottom":
          return (
            <div className="flex flex-col space-y-2">
              <div>{children}</div>
              <div className="flex justify-center">
                <DragHandle />
              </div>
            </div>
          );
        default:
          return (
            <div className="flex items-center space-x-3">
              <DragHandle />
              <div className="flex-1">{children}</div>
            </div>
          );
      }
    };

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        style={style}
        className={itemClasses}
      >
        {renderContent()}
      </div>
    );
  },
);

SortableItem.displayName = "SortableItem";
