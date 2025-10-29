"use client";

import React, { useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Table,
  Calculator,
  Filter,
  Database,
  Plus,
  Trash2,
  Settings,
  Save,
  Eye,
  Zap,
  Target,
} from "lucide-react";
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
} from "@/components/analytics/charts";
import { KPICard } from "@/components/analytics/kpi-card";

import { toast } from "sonner";

// Advanced report component types
export type AdvancedComponentType =
  | "analytics_chart"
  | "kpi_metric"
  | "calculated_field"
  | "data_table"
  | "filter_control"
  | "custom_query";

export interface CalculatedField {
  id: string;
  name: string;
  formula: string;
  dataType: "number" | "string" | "date" | "boolean";
  description?: string;
}

export interface AdvancedReportComponent {
  id: string;
  type: AdvancedComponentType;
  title: string;
  config: {
    // Analytics chart config
    chartType?: "line" | "bar" | "pie" | "area" | "scatter" | "heatmap";
    dataSource?: string;
    queryId?: string;

    // KPI config
    metricType?: "revenue" | "users" | "conversion" | "growth" | "custom";
    targetValue?: number;

    // Calculated field config
    calculatedFields?: CalculatedField[];

    // Data table config
    columns?: string[];
    pagination?: boolean;
    sorting?: boolean;
    filtering?: boolean;

    // Filter control config
    filterType?: "date_range" | "dropdown" | "multi_select" | "search";
    filterField?: string;
    filterOptions?: string[];

    // Custom query config
    sqlQuery?: string;
    parameters?: { name: string; type: string; defaultValue?: any }[];

    // Common styling
    styling?: {
      width: number;
      height: number;
      backgroundColor?: string;
      textColor?: string;
      borderRadius?: number;
    };
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AdvancedReportBuilderProps {
  organizationId: string;
  reportId?: string;
  onSave?: (reportId: string) => void;
  onCancel?: () => void;
}

// Advanced component palette
const ADVANCED_COMPONENT_PALETTE = [
  {
    type: "analytics_chart" as AdvancedComponentType,
    name: "Analytics Chart",
    icon: BarChart3,
    description: "Advanced interactive charts with drill-down capabilities",
    category: "Analytics",
  },
  {
    type: "kpi_metric" as AdvancedComponentType,
    name: "KPI Metric",
    icon: Target,
    description: "Key performance indicators with trend analysis",
    category: "Analytics",
  },
  {
    type: "calculated_field" as AdvancedComponentType,
    name: "Calculated Field",
    icon: Calculator,
    description: "Custom calculations and formulas",
    category: "Advanced",
  },
  {
    type: "data_table" as AdvancedComponentType,
    name: "Advanced Table",
    icon: Table,
    description: "Interactive data tables with sorting and filtering",
    category: "Data",
  },
  {
    type: "filter_control" as AdvancedComponentType,
    name: "Filter Control",
    icon: Filter,
    description: "Interactive filters for report data",
    category: "Controls",
  },
  {
    type: "custom_query" as AdvancedComponentType,
    name: "Custom Query",
    icon: Database,
    description: "Execute custom SQL queries",
    category: "Advanced",
  },
];

export function AdvancedReportBuilder({
  organizationId,
  reportId,
  onSave,
  onCancel,
}: AdvancedReportBuilderProps) {
  const [reportName, setReportName] = useState("Advanced Report");
  const [reportDescription, setReportDescription] = useState("");
  const [components, setComponents] = useState<AdvancedReportComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null,
  );
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Add component to report
  const addComponent = useCallback((type: AdvancedComponentType) => {
    const paletteItem = ADVANCED_COMPONENT_PALETTE.find(
      (item) => item.type === type,
    );
    if (!paletteItem) return;

    const newComponent: AdvancedReportComponent = {
      id: `component-${Date.now()}`,
      title: paletteItem.name,
      type,
      config: {
        styling: { width: 6, height: 4 },
      },
      position: { x: 0, y: 0, width: 6, height: 4 },
    };

    // Set default config based on type
    switch (type) {
      case "analytics_chart":
        newComponent.config.chartType = "bar";
        newComponent.config.queryId = `query-${Date.now()}`;
        break;
      case "kpi_metric":
        newComponent.config.metricType = "custom";
        newComponent.config.targetValue = 1000;
        break;
      case "calculated_field":
        newComponent.config.calculatedFields = [];
        break;
      case "data_table":
        newComponent.config.columns = ["id", "name", "value"];
        newComponent.config.pagination = true;
        newComponent.config.sorting = true;
        newComponent.config.filtering = true;
        break;
      case "filter_control":
        newComponent.config.filterType = "date_range";
        newComponent.config.filterField = "created_at";
        break;
      case "custom_query":
        newComponent.config.sqlQuery = "SELECT * FROM table_name LIMIT 100";
        newComponent.config.parameters = [];
        break;
    }

    setComponents((prev) => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
    toast.success(`${paletteItem.name} added to report`);
  }, []);

  // Remove component
  const removeComponent = useCallback(
    (componentId: string) => {
      setComponents((prev) => prev.filter((c) => c.id !== componentId));
      if (selectedComponent === componentId) {
        setSelectedComponent(null);
      }
      toast.success("Component removed");
    },
    [selectedComponent],
  );

  // Update component config
  const updateComponentConfig = useCallback(
    (
      componentId: string,
      config: Partial<AdvancedReportComponent["config"]>,
    ) => {
      setComponents((prev) =>
        prev.map((component) =>
          component.id === componentId
            ? { ...component, config: { ...component.config, ...config } }
            : component,
        ),
      );
    },
    [],
  );

  // Update component title
  const updateComponentTitle = useCallback(
    (componentId: string, title: string) => {
      setComponents((prev) =>
        prev.map((component) =>
          component.id === componentId ? { ...component, title } : component,
        ),
      );
    },
    [],
  );

  // Add calculated field
  const addCalculatedField = useCallback(() => {
    const newField: CalculatedField = {
      id: `field-${Date.now()}`,
      name: "New Field",
      formula: "",
      dataType: "number",
      description: "",
    };
    setCalculatedFields((prev) => [...prev, newField]);
  }, []);

  // Update calculated field
  const updateCalculatedField = useCallback(
    (fieldId: string, updates: Partial<CalculatedField>) => {
      setCalculatedFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field,
        ),
      );
    },
    [],
  );

  // Remove calculated field
  const removeCalculatedField = useCallback((fieldId: string) => {
    setCalculatedFields((prev) => prev.filter((field) => field.id !== fieldId));
  }, []);

  // Save report
  const saveReport = async () => {
    try {
      setSaving(true);

      // Mock save implementation
      const reportData = {
        name: reportName,
        description: reportDescription,
        components,
        calculatedFields,
        organizationId,
      };

      // In a real implementation, this would call an API
      logger.info("Saving advanced report", "REPORTS", reportData);

      toast.success("Advanced report saved successfully");
      onSave?.(reportId || `report-${Date.now()}`);
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  // Render component preview
  const renderComponentPreview = (component: AdvancedReportComponent) => {
    const mockData = [
      { name: "Jan", value: 400 },
      { name: "Feb", value: 300 },
      { name: "Mar", value: 600 },
      { name: "Apr", value: 800 },
      { name: "May", value: 500 },
    ];

    switch (component.type) {
      case "analytics_chart":
        const chartProps = {
          title: component.title,
          data: mockData,
          config: { colors: ["#3b82f6", "#ef4444", "#10b981"] },
          className: "h-full",
        };

        switch (component.config.chartType) {
          case "line":
            return <LineChart dataKeys={["value"]} {...chartProps} />;
          case "bar":
            return <BarChart dataKeys={["value"]} {...chartProps} />;
          case "pie":
            return <PieChart dataKey="value" nameKey="name" {...chartProps} />;
          case "area":
            return <AreaChart dataKeys={["value"]} {...chartProps} />;
          default:
            return <BarChart dataKeys={["value"]} {...chartProps} />;
        }

      case "kpi_metric":
        return (
          <KPICard
            title={component.title}
            value={Math.floor(Math.random() * 10000)}
            trend="up"
            className="h-full"
          />
        );

      case "calculated_field":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {component.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {component.config.calculatedFields?.map((field) => (
                  <div key={field.id} className="p-2 bg-muted rounded">
                    <div className="font-medium text-sm">{field.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {field.formula}
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No calculated fields</p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "data_table":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                {component.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {component.config.columns?.map((col, index) => (
                        <th key={index} className="p-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((row) => (
                      <tr key={row} className="border-b">
                        {component.config.columns?.map((_, index) => (
                          <td key={index} className="p-2">
                            Sample {row}-{index + 1}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );

      case "filter_control":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {component.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Filter Type: {component.config.filterType}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case "custom_query":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                {component.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="bg-muted p-2 rounded font-mono text-xs">
                  {component.config.sqlQuery || "SELECT * FROM table_name"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Parameters: {component.config.parameters?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unknown component type</p>
            </CardContent>
          </Card>
        );
    }
  };

  const selectedComponentData = selectedComponent
    ? components.find((c) => c.id === selectedComponent)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex-1">
          <Input
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
            placeholder="Report Name"
          />
          <Textarea
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            className="mt-2 border-none p-0 bg-transparent resize-none"
            placeholder="Report description..."
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
          <Button onClick={saveReport} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        {!previewMode && (
          <div className="w-80 border-r bg-muted/30 p-4">
            <Tabs defaultValue="components">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Advanced Components</h3>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {ADVANCED_COMPONENT_PALETTE.map((item) => (
                        <AdvancedPaletteItem
                          key={item.type}
                          item={item}
                          onAdd={() => addComponent(item.type)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Calculated Fields</h3>
                    <Button size="sm" onClick={addCalculatedField}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {calculatedFields.map((field) => (
                        <CalculatedFieldEditor
                          key={field.id}
                          field={field}
                          onUpdate={(updates) =>
                            updateCalculatedField(field.id, updates)
                          }
                          onRemove={() => removeCalculatedField(field.id)}
                        />
                      ))}
                      {calculatedFields.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          No calculated fields yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                {selectedComponentData ? (
                  <AdvancedComponentSettings
                    component={selectedComponentData}
                    onUpdateTitle={(title) =>
                      updateComponentTitle(selectedComponentData.id, title)
                    }
                    onUpdateConfig={(config) =>
                      updateComponentConfig(selectedComponentData.id, config)
                    }
                    onRemove={() => removeComponent(selectedComponentData.id)}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a component to configure</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 p-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-full">
            <div className="grid grid-cols-12 gap-4">
              {components.map((component) => (
                <div
                  key={component.id}
                  className={`col-span-${component.position.width} cursor-pointer ${
                    selectedComponent === component.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedComponent(component.id)}
                >
                  {renderComponentPreview(component)}
                </div>
              ))}

              {components.length === 0 && (
                <div className="col-span-12 flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Zap className="h-16 w-16 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Advanced Report Builder
                  </h3>
                  <p className="text-center max-w-md">
                    Create sophisticated reports with analytics charts,
                    calculated fields, and custom queries
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced palette item component
function AdvancedPaletteItem({
  item,
  onAdd,
}: {
  item: (typeof ADVANCED_COMPONENT_PALETTE)[0];
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
            <Badge variant="secondary" className="text-xs mt-1">
              {item.category}
            </Badge>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Calculated field editor
function CalculatedFieldEditor({
  field,
  onUpdate,
  onRemove,
}: {
  field: CalculatedField;
  onUpdate: (updates: Partial<CalculatedField>) => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="font-medium"
            placeholder="Field name"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <Textarea
          value={field.formula}
          onChange={(e) => onUpdate({ formula: e.target.value })}
          placeholder="Enter formula (e.g., SUM(revenue) / COUNT(orders))"
          rows={2}
          className="font-mono text-sm"
        />

        <Select
          value={field.dataType}
          onValueChange={(value: "number" | "string" | "date" | "boolean") =>
            onUpdate({ dataType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

// Advanced component settings panel
function AdvancedComponentSettings({
  component,
  onUpdateTitle,
  onUpdateConfig,
  onRemove,
}: {
  component: AdvancedReportComponent;
  onUpdateTitle: (title: string) => void;
  onUpdateConfig: (config: Partial<AdvancedReportComponent["config"]>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Component Settings</h3>
        <Badge variant="secondary">{component.type.toUpperCase()}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="component-title">Title</Label>
          <Input
            id="component-title"
            value={component.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Component title"
          />
        </div>

        {component.type === "analytics_chart" && (
          <div>
            <Label>Chart Type</Label>
            <Select
              value={component.config.chartType}
              onValueChange={(value: "line" | "bar" | "pie" | "area") =>
                onUpdateConfig({ chartType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {component.type === "kpi_metric" && (
          <div>
            <Label htmlFor="target-value">Target Value</Label>
            <Input
              id="target-value"
              type="number"
              value={component.config.targetValue || ""}
              onChange={(e) =>
                onUpdateConfig({ targetValue: Number(e.target.value) })
              }
              placeholder="Target value"
            />
          </div>
        )}

        {component.type === "custom_query" && (
          <div>
            <Label htmlFor="sql-query">SQL Query</Label>
            <Textarea
              id="sql-query"
              value={component.config.sqlQuery || ""}
              onChange={(e) => onUpdateConfig({ sqlQuery: e.target.value })}
              placeholder="SELECT * FROM table_name"
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Component
        </Button>
      </div>
    </div>
  );
}
