"use client";

import React, { useState, useCallback } from "react";
import { X, Save, RotateCcw, Type, BarChart3, Settings } from "lucide-react";

import { DashboardWidget } from "@/src/types/drag-drop";

interface WidgetConfigPanelProps {
  widget: DashboardWidget;
  onSave: (widget: DashboardWidget) => void;
  onCancel: () => void;
}

export function WidgetConfigPanel({
  widget,
  onSave,
  onCancel,
}: WidgetConfigPanelProps) {
  const [config, setConfig] = useState(widget.config || {});
  const [title, setTitle] = useState(widget.title);

  const handleConfigChange = useCallback((key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      ...widget,
      title,
      config,
    });
  }, [widget, title, config, onSave]);

  const handleReset = useCallback(() => {
    setConfig(widget.config || {});
    setTitle(widget.title);
  }, [widget]);

  const renderConfigFields = () => {
    switch (widget.type) {
      case "chart":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <select
                value={config.chartType || "line"}
                onChange={(e) =>
                  handleConfigChange("chartType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis Label
              </label>
              <input
                type="text"
                value={config.xAxis || ""}
                onChange={(e) => handleConfigChange("xAxis", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter X-axis label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis Label
              </label>
              <input
                type="text"
                value={config.yAxis || ""}
                onChange={(e) => handleConfigChange("yAxis", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Y-axis label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={config.color || "#3b82f6"}
                onChange={(e) => handleConfigChange("color", e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        );

      case "metric":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={config.value || ""}
                onChange={(e) => handleConfigChange("value", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter metric value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={config.label || ""}
                onChange={(e) => handleConfigChange("label", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter metric label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={config.unit || ""}
                onChange={(e) => handleConfigChange("unit", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter unit (e.g., %, $, users)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trend
              </label>
              <select
                value={config.trend || "up"}
                onChange={(e) => handleConfigChange("trend", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trend Value
              </label>
              <input
                type="text"
                value={config.trendValue || ""}
                onChange={(e) =>
                  handleConfigChange("trendValue", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter trend value (e.g., +12%)"
              />
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Columns (comma-separated)
              </label>
              <input
                type="text"
                value={
                  Array.isArray(config.columns) ? config.columns.join(", ") : ""
                }
                onChange={(e) =>
                  handleConfigChange(
                    "columns",
                    e.target.value.split(",").map((s) => s.trim()),
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name, Value, Status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Rows
              </label>
              <input
                type="number"
                value={config.rows || 5}
                onChange={(e) =>
                  handleConfigChange("rows", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sortable || false}
                  onChange={(e) =>
                    handleConfigChange("sortable", e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Sortable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.filterable || false}
                  onChange={(e) =>
                    handleConfigChange("filterable", e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Filterable</span>
              </label>
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={config.text || ""}
                onChange={(e) => handleConfigChange("text", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter your text content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={config.fontSize || "medium"}
                onChange={(e) => handleConfigChange("fontSize", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Alignment
              </label>
              <select
                value={config.alignment || "left"}
                onChange={(e) =>
                  handleConfigChange("alignment", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <input
                type="color"
                value={config.color || "#374151"}
                onChange={(e) => handleConfigChange("color", e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            No configuration options available for this widget type.
          </div>
        );
    }
  };

  const getWidgetIcon = () => {
    switch (widget.type) {
      case "chart":
        return <BarChart3 className="w-5 h-5" />;
      case "metric":
        return <Settings className="w-5 h-5" />;
      case "table":
        return <Settings className="w-5 h-5" />;
      case "text":
        return <Type className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {getWidgetIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            Configure Widget
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Widget Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter widget title"
            />
          </div>

          {/* Widget Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Type
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600 capitalize">
              {widget.type}
            </div>
          </div>

          {/* Configuration Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Configuration
            </label>
            {renderConfigFields()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
