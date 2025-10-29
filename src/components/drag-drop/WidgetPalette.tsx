"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BarChart3, TrendingUp, Table, Type, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetType = "chart" | "metric" | "table" | "text";

interface WidgetPaletteItem {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const WIDGET_TYPES: WidgetPaletteItem[] = [
  {
    type: "chart",
    title: "Chart Widget",
    description: "Display data visualizations",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "blue",
  },
  {
    type: "metric",
    title: "Metric Widget",
    description: "Show key performance indicators",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "green",
  },
  {
    type: "table",
    title: "Table Widget",
    description: "Display tabular data",
    icon: <Table className="w-5 h-5" />,
    color: "purple",
  },
  {
    type: "text",
    title: "Text Widget",
    description: "Add custom text content",
    icon: <Type className="w-5 h-5" />,
    color: "gray",
  },
];

interface DraggableWidgetProps {
  item: WidgetPaletteItem;
}

function DraggableWidget({ item }: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${item.type}`,
      data: {
        type: "widget",
        widgetType: item.type,
        title: item.title,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    purple:
      "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    gray: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "palette-item border-2 border-dashed rounded-lg p-4 cursor-grab active:cursor-grabbing",
        "transition-all duration-200 hover:shadow-md hover:border-gray-300",
        isDragging && "palette-item-dragging opacity-50 scale-105",
        colorClasses[item.color as keyof typeof colorClasses],
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{item.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{item.title}</h4>
          <p className="text-xs opacity-75 truncate">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

interface WidgetPaletteProps {
  className?: string;
}

export function WidgetPalette({ className }: WidgetPaletteProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Widget Palette</h3>
      </div>

      <div className="space-y-2">
        {WIDGET_TYPES.map((item) => (
          <DraggableWidget key={item.type} item={item} />
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Drag widgets from here to the dashboard
          canvas to add them.
        </p>
      </div>
    </div>
  );
}
