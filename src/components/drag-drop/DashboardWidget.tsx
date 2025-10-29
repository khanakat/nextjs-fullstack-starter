"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardWidget as WidgetType } from "@/src/types/drag-drop";

interface DashboardWidgetProps {
  widget: WidgetType;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  onResize?: (id: string, size: { width: number; height: number }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function DashboardWidget({
  widget,
  onRemove,
  onConfigure,
  onResize,
  isSelected = false,
  onSelect,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSelect = () => {
    onSelect?.(widget.id);
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case "chart":
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                📊
              </div>
              <p className="text-sm font-medium text-blue-700">Chart Widget</p>
              <p className="text-xs text-blue-600">
                {widget.config?.chartType || "Line Chart"}
              </p>
            </div>
          </div>
        );
      case "metric":
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 mb-1">
                {widget.config?.value || "42"}
              </div>
              <p className="text-sm font-medium text-green-600">
                {widget.config?.label || "Metric"}
              </p>
            </div>
          </div>
        );
      case "table":
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                📋
              </div>
              <p className="text-sm font-medium text-purple-700">
                Table Widget
              </p>
              <p className="text-xs text-purple-600">Data Table</p>
            </div>
          </div>
        );
      case "text":
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-center p-4">
              <p className="text-sm text-gray-700">
                {widget.config?.text || "Text Widget Content"}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <p className="text-sm text-gray-500">Unknown Widget</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "dashboard-widget bg-white border rounded-lg shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-gray-300",
        isDragging &&
          "dashboard-widget-dragging opacity-50 scale-105 z-50 shadow-lg",
        isSelected && "ring-2 ring-blue-500 border-blue-300",
        "group relative",
      )}
      onClick={handleSelect}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Drag widget"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {widget.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(widget.id);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Configure widget"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(widget.id);
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            aria-label="Remove widget"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-3 h-32">{renderWidgetContent()}</div>

      {/* Resize Handle (if resizable) */}
      {onResize && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-full h-full bg-gray-300 rounded-tl-lg flex items-end justify-end p-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
