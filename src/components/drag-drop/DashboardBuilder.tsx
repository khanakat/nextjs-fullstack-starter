"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Save, Grid, Layout, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardWidget as WidgetType,
  DashboardBuilderProps,
} from "@/src/types/drag-drop";
import { DashboardWidget } from "./DashboardWidget";
import { WidgetPalette } from "./WidgetPalette";
import { WidgetConfigPanel } from "./WidgetConfigPanel";

export function DashboardBuilder({
  widgets: initialWidgets = [],
  onSave,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate,
  className,
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<WidgetType[]>(initialWidgets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configWidget, setConfigWidget] = useState<WidgetType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Handle drag over logic if needed
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        return;
      }

      // Handle dropping from palette
      if (active.id.toString().startsWith("palette-")) {
        const widgetType = active.data.current?.widgetType;
        if (widgetType && over.id === "dashboard-canvas") {
          const newWidget: WidgetType = {
            id: `widget-${Date.now()}`,
            type: widgetType,
            title: active.data.current?.title || "New Widget",
            position: { x: 0, y: 0 },
            size: { width: 300, height: 200 },
            config: getDefaultConfig(widgetType),
          };
          setWidgets((prev) => [...prev, newWidget]);
          onWidgetAdd?.(newWidget);
        }
        setActiveId(null);
        return;
      }

      // Handle reordering existing widgets
      if (active.id !== over.id) {
        setWidgets((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }

      setActiveId(null);
    },
    [onWidgetAdd],
  );

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "chart":
        return {
          chartType: "line",
          dataSource: "sample",
          xAxis: "Date",
          yAxis: "Value",
          color: "#3b82f6",
        };
      case "metric":
        return {
          value: "42",
          label: "Metric",
          unit: "",
          trend: "up",
          trendValue: "12%",
        };
      case "table":
        return {
          columns: ["Name", "Value", "Status"],
          rows: 5,
          sortable: true,
          filterable: false,
        };
      case "text":
        return {
          text: "Enter your text here...",
          fontSize: "medium",
          alignment: "left",
          color: "#374151",
        };
      default:
        return {};
    }
  };

  const handleRemoveWidget = useCallback(
    (id: string) => {
      setWidgets((prev) => prev.filter((widget) => widget.id !== id));
      onWidgetRemove?.(id);
      if (selectedWidget === id) {
        setSelectedWidget(null);
      }
      if (configWidget?.id === id) {
        setConfigWidget(null);
        setShowConfigPanel(false);
      }
    },
    [selectedWidget, configWidget, onWidgetRemove],
  );

  const handleConfigureWidget = useCallback(
    (id: string) => {
      const widget = widgets.find((w) => w.id === id);
      if (widget) {
        setConfigWidget(widget);
        setShowConfigPanel(true);
      }
    },
    [widgets],
  );

  const handleSelectWidget = useCallback((id: string) => {
    setSelectedWidget((prev) => (prev === id ? null : id));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(widgets);
  }, [widgets, onSave]);

  const handleWidgetConfigSave = useCallback(
    (updatedWidget: WidgetType) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w)),
      );
      onWidgetUpdate?.(updatedWidget);
      setShowConfigPanel(false);
      setConfigWidget(null);
    },
    [onWidgetUpdate],
  );

  const handleWidgetConfigCancel = useCallback(() => {
    setShowConfigPanel(false);
    setConfigWidget(null);
  }, []);

  const activeWidget = widgets.find((widget) => widget.id === activeId);

  return (
    <div className={cn("flex h-full bg-gray-50 relative", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Sidebar with Widget Palette */}
        {showPalette && (
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Widget Palette
              </h3>
              <button
                onClick={() => setShowPalette(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <WidgetPalette />
          </div>
        )}

        {/* Main Dashboard Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Dashboard Builder
                </h2>
                <span className="text-sm text-gray-500">
                  ({widgets.length} widgets)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!showPalette && (
                  <button
                    onClick={() => setShowPalette(true)}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Grid className="w-4 h-4 mr-2" />
                    Show Palette
                  </button>
                )}

                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Layout
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Canvas */}
          <div id="dashboard-canvas" className="flex-1 p-6 overflow-auto">
            {widgets.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Layout className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start Building Your Dashboard
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    Drag widgets from the palette on the left to create your
                    custom dashboard layout.
                  </p>
                  {!showPalette && (
                    <button
                      onClick={() => setShowPalette(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Show Widget Palette
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <SortableContext
                items={widgets.map((w) => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {widgets.map((widget) => (
                    <DashboardWidget
                      key={widget.id}
                      widget={widget}
                      onRemove={handleRemoveWidget}
                      onConfigure={handleConfigureWidget}
                      isSelected={selectedWidget === widget.id}
                      onSelect={handleSelectWidget}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeWidget ? (
            <DashboardWidget
              widget={activeWidget}
              onRemove={() => {}}
              onConfigure={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Configuration Panel */}
      {showConfigPanel && configWidget && (
        <WidgetConfigPanel
          widget={configWidget}
          onSave={handleWidgetConfigSave}
          onCancel={handleWidgetConfigCancel}
        />
      )}
    </div>
  );
}
