"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  Plus,
  Trash2,
  Settings,
  Save,
  Eye,
  Grid3X3,
  Move,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { LineChart, BarChart, PieChart, AreaChart } from "./charts";
import { KPICard } from "./kpi-card";

import {
  DashboardWidget,
  WidgetType,
  WidgetConfig,
} from "@/lib/types/analytics";
import { toast } from "sonner";

// Widget palette items
const WIDGET_PALETTE = [
  {
    type: "kpi" as WidgetType,
    name: "KPI Card",
    icon: TrendingUp,
    description: "Display key performance indicators",
    defaultSize: { width: 3, height: 2 },
  },
  {
    type: "line" as WidgetType,
    name: "Line Chart",
    icon: LineChartIcon,
    description: "Show trends over time",
    defaultSize: { width: 6, height: 3 },
  },
  {
    type: "bar" as WidgetType,
    name: "Bar Chart",
    icon: BarChart3,
    description: "Compare values across categories",
    defaultSize: { width: 6, height: 3 },
  },
  {
    type: "pie" as WidgetType,
    name: "Pie Chart",
    icon: PieChartIcon,
    description: "Show proportions and percentages",
    defaultSize: { width: 4, height: 3 },
  },
  {
    type: "area" as WidgetType,
    name: "Area Chart",
    icon: Activity,
    description: "Display cumulative data over time",
    defaultSize: { width: 6, height: 3 },
  },
];

interface DashboardBuilderProps {
  dashboardId?: string;
  organizationId: string;
  onSave?: (dashboardId: string) => void;
  onCancel?: () => void;
}

interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableWidget extends DashboardWidget {
  position: GridPosition;
}

export function DashboardBuilder({
  dashboardId,
  onSave,
  onCancel,
}: DashboardBuilderProps) {
  const [dashboardName, setDashboardName] = useState("New Dashboard");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [widgets, setWidgets] = useState<DraggableWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [gridSize] = useState({ columns: 12, rows: 8 });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Find available position on grid
  const findAvailablePosition = useCallback(
    (size: { width: number; height: number }): GridPosition => {
      const occupiedCells = new Set<string>();

      // Mark occupied cells
      widgets.forEach((widget) => {
        for (
          let x = widget.position.x;
          x < widget.position.x + widget.position.width;
          x++
        ) {
          for (
            let y = widget.position.y;
            y < widget.position.y + widget.position.height;
            y++
          ) {
            occupiedCells.add(`${x}-${y}`);
          }
        }
      });

      // Find first available position
      for (let y = 0; y <= gridSize.rows - size.height; y++) {
        for (let x = 0; x <= gridSize.columns - size.width; x++) {
          let canPlace = true;

          // Check if this position is available
          for (let dx = 0; dx < size.width && canPlace; dx++) {
            for (let dy = 0; dy < size.height && canPlace; dy++) {
              if (occupiedCells.has(`${x + dx}-${y + dy}`)) {
                canPlace = false;
              }
            }
          }

          if (canPlace) {
            return { x, y, width: size.width, height: size.height };
          }
        }
      }

      // If no space found, place at bottom
      return { x: 0, y: gridSize.rows, width: size.width, height: size.height };
    },
    [widgets, gridSize],
  );

  // Add widget from palette
  const addWidget = useCallback(
    (type: WidgetType) => {
      const paletteItem = WIDGET_PALETTE.find((item) => item.type === type);
      if (!paletteItem) return;

      // Find available position
      const position = findAvailablePosition(paletteItem.defaultSize);

      const newWidget: DraggableWidget = {
        id: `widget-${Date.now()}`,
        title: paletteItem.name,
        type,
        position,
        config: {
          colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
          showLegend: true,
          showTooltip: true,
          format: { type: "number" },
        },
        dataSource: {
          type: "static",
          data: [],
        },
        style: {},
        isVisible: true,
        dashboardId: dashboardId || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setWidgets((prev) => [...prev, newWidget]);
      setSelectedWidget(newWidget.id);
      toast.success(`${paletteItem.name} added to dashboard`);
    },
    [dashboardId, findAvailablePosition],
  );

  // Move widget
  const moveWidget = useCallback(
    (widgetId: string, newPosition: Partial<GridPosition>) => {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.id === widgetId
            ? { ...widget, position: { ...widget.position, ...newPosition } }
            : widget,
        ),
      );
    },
    [],
  );

  // Remove widget
  const removeWidget = useCallback(
    (widgetId: string) => {
      setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
      if (selectedWidget === widgetId) {
        setSelectedWidget(null);
      }
      toast.success("Widget removed");
    },
    [selectedWidget],
  );

  // Update widget config
  const updateWidgetConfig = useCallback(
    (widgetId: string, config: Partial<WidgetConfig>) => {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.id === widgetId
            ? { ...widget, config: { ...widget.config, ...config } }
            : widget,
        ),
      );
    },
    [],
  );

  // Update widget title
  const updateWidgetTitle = useCallback((widgetId: string, title: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId ? { ...widget, title } : widget,
      ),
    );
  }, []);

  // Save dashboard
  const saveDashboard = async () => {
    try {
      setSaving(true);

      let currentDashboardId = dashboardId;

      if (!currentDashboardId) {
        // Create new dashboard
        // Mock dashboard creation for now
        const dashboard = {
          id: `dashboard-${Date.now()}`,
          name: dashboardName,
          description: dashboardDescription,
        };

        currentDashboardId = dashboard.id;
      }

      // Mock widget saving for now
      logger.info("Saving dashboard widgets", "DASHBOARD", {
        widgetCount: widgets.length,
        widgets,
      });

      toast.success("Dashboard saved successfully");
      onSave?.(currentDashboardId);
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast.error("Failed to save dashboard");
    } finally {
      setSaving(false);
    }
  };

  // Render widget preview
  const renderWidgetPreview = (widget: DraggableWidget) => {
    const mockData = [
      { name: "Jan", value: 400 },
      { name: "Feb", value: 300 },
      { name: "Mar", value: 600 },
      { name: "Apr", value: 800 },
      { name: "May", value: 500 },
    ];

    const commonProps = {
      data: mockData,
      config: widget.config,
      className: "h-full",
    };

    switch (widget.type) {
      case "kpi":
        return <KPICard title={widget.title} value={1234} {...commonProps} />;
      case "line":
        return (
          <LineChart
            title={widget.title}
            dataKeys={["value"]}
            {...commonProps}
          />
        );
      case "bar":
        return (
          <BarChart
            title={widget.title}
            dataKeys={["value"]}
            {...commonProps}
          />
        );
      case "pie":
        return (
          <PieChart
            title={widget.title}
            dataKey="value"
            nameKey="name"
            {...commonProps}
          />
        );
      case "area":
        return (
          <AreaChart
            title={widget.title}
            dataKeys={["value"]}
            {...commonProps}
          />
        );
      default:
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unknown widget type</p>
            </CardContent>
          </Card>
        );
    }
  };

  const selectedWidgetData = selectedWidget
    ? widgets.find((w) => w.id === selectedWidget)
    : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
              placeholder="Dashboard Name"
            />
            <Textarea
              value={dashboardDescription}
              onChange={(e) => setDashboardDescription(e.target.value)}
              className="mt-2 border-none p-0 bg-transparent resize-none"
              placeholder="Dashboard description..."
              rows={1}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={saveDashboard} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Widget Palette */}
          {!previewMode && (
            <div className="w-80 border-r bg-muted/30 p-4">
              <Tabs defaultValue="widgets">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="widgets">Widgets</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="widgets" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Widget Palette</h3>
                    <div className="space-y-2">
                      {WIDGET_PALETTE.map((item) => (
                        <PaletteItem
                          key={item.type}
                          item={item}
                          onAdd={() => addWidget(item.type)}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  {selectedWidgetData ? (
                    <WidgetSettings
                      widget={selectedWidgetData}
                      onUpdateTitle={(title) =>
                        updateWidgetTitle(selectedWidgetData.id, title)
                      }
                      onUpdateConfig={(config) =>
                        updateWidgetConfig(selectedWidgetData.id, config)
                      }
                      onRemove={() => removeWidget(selectedWidgetData.id)}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Settings className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a widget to configure</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Dashboard Grid */}
          <div className="flex-1 p-4">
            <div
              ref={gridRef}
              className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${100 / gridSize.columns}% ${100 / gridSize.rows}%`,
              }}
            >
              {widgets.map((widget) => (
                <DraggableGridItem
                  key={widget.id}
                  widget={widget}
                  gridSize={gridSize}
                  isSelected={selectedWidget === widget.id}
                  isPreview={previewMode}
                  onSelect={() => setSelectedWidget(widget.id)}
                  onMove={(position) => moveWidget(widget.id, position)}
                >
                  {renderWidgetPreview(widget)}
                </DraggableGridItem>
              ))}

              {widgets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Grid3X3 className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Empty Dashboard
                    </h3>
                    <p>Drag widgets from the palette to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

// Palette item component
function PaletteItem({
  item,
  onAdd,
}: {
  item: (typeof WIDGET_PALETTE)[0];
  onAdd: () => void;
}) {
  const Icon = item.icon;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onAdd}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.name}</h4>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Widget settings panel
function WidgetSettings({
  widget,
  onUpdateTitle,
  onUpdateConfig,
  onRemove,
}: {
  widget: DraggableWidget;
  onUpdateTitle: (title: string) => void;
  onUpdateConfig: (config: Partial<WidgetConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Widget Settings</h3>
        <Badge variant="secondary">{widget.type.toUpperCase()}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="widget-title">Title</Label>
          <Input
            id="widget-title"
            value={widget.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Widget title"
          />
        </div>

        <div>
          <Label>Colors</Label>
          <div className="flex gap-2 mt-1">
            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map(
              (color) => (
                <div
                  key={color}
                  className="w-6 h-6 rounded cursor-pointer border-2 border-transparent hover:border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    onUpdateConfig({
                      colors: [
                        color,
                        ...(widget.config.colors?.slice(1) || []),
                      ],
                    })
                  }
                />
              ),
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-legend"
            checked={widget.config.showLegend !== false}
            onChange={(e) => onUpdateConfig({ showLegend: e.target.checked })}
          />
          <Label htmlFor="show-legend">Show Legend</Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-tooltip"
            checked={widget.config.showTooltip !== false}
            onChange={(e) => onUpdateConfig({ showTooltip: e.target.checked })}
          />
          <Label htmlFor="show-tooltip">Show Tooltip</Label>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Widget
        </Button>
      </div>
    </div>
  );
}

// Draggable grid item
function DraggableGridItem({
  widget,
  gridSize,
  isSelected,
  isPreview,
  onSelect,
  onMove,
  children,
}: {
  widget: DraggableWidget;
  gridSize: { columns: number; rows: number };
  isSelected: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onMove: (position: Partial<GridPosition>) => void;
  children: React.ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "widget",
    item: { id: widget.id, ...widget.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "widget",
    hover: (item: any, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;

      const hoverBoundingRect = monitor.getDropResult();
      if (hoverBoundingRect) {
        // Calculate new position based on drop location
        // This is a simplified version - you'd want more sophisticated positioning
        onMove({ x: Math.max(0, item.x), y: Math.max(0, item.y) });
      }
    },
  });

  const style = {
    left: `${(widget.position.x / gridSize.columns) * 100}%`,
    top: `${(widget.position.y / gridSize.rows) * 100}%`,
    width: `${(widget.position.width / gridSize.columns) * 100}%`,
    height: `${(widget.position.height / gridSize.rows) * 100}%`,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(node) => {
        if (!isPreview) {
          drag(drop(node));
        }
      }}
      className={`absolute p-2 ${
        isSelected && !isPreview ? "ring-2 ring-primary" : ""
      } ${!isPreview ? "cursor-move" : ""}`}
      style={style}
      onClick={onSelect}
    >
      {!isPreview && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="secondary" className="text-xs">
            <Move className="h-3 w-3" />
          </Badge>
        </div>
      )}
      <div className="h-full">{children}</div>
    </div>
  );
}
