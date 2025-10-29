"use client";

import React, { useState } from "react";
import { DragDropProvider } from "@/components/drag-drop/drag-drop-provider";
import { SortableList } from "@/components/drag-drop/sortable-list";
import { KanbanBoard } from "@/components/drag-drop/kanban-board";
import { FileUploadZone } from "@/components/drag-drop/file-upload-zone";
import { DashboardBuilder } from "@/components/drag-drop/dashboard-builder";
import { FormBuilder } from "@/components/drag-drop/form-builder";
import { ClientOnlyDragDrop } from "@/components/drag-drop/client-only-drag-drop";
import {
  Sparkles,
  Github,
  ExternalLink,
  List,
  Columns,
  Upload,
  Layout,
  FileText,
} from "lucide-react";
import { 
  FormField, 
  KanbanBoard as KanbanBoardType,
  DashboardWidget as DashboardWidgetType 
} from "@/src/types/drag-drop";
import "./styles.css";

// Types
interface DragItem {
  id: string;
  data?: {
    content: string;
  };
}





// Demo configuration
const demos = [
  {
    id: "sortable",
    title: "Sortable Lists",
    description: "Reorderable lists with smooth animations",
    icon: List,
    color: "bg-blue-500",
  },
  {
    id: "kanban",
    title: "Kanban Board",
    description: "Task management with drag & drop",
    icon: Columns,
    color: "bg-green-500",
  },
  {
    id: "upload",
    title: "File Upload",
    description: "Drag & drop file uploads",
    icon: Upload,
    color: "bg-purple-500",
  },
  {
    id: "dashboard",
    title: "Dashboard Builder",
    description: "Customizable widget layouts",
    icon: Layout,
    color: "bg-orange-500",
  },
  {
    id: "form",
    title: "Form Builder",
    description: "Dynamic form creation",
    icon: FileText,
    color: "bg-red-500",
  },
];

export default function DragDropShowcase() {
  const [activeDemo, setActiveDemo] = useState("sortable");

  // Sortable list state
  const [sortableItems, setSortableItems] = useState<DragItem[]>([
    { id: "1", data: { content: "First item - drag me around!" } },
    { id: "2", data: { content: "Second item - I can be reordered" } },
    { id: "3", data: { content: "Third item - Try dragging me up" } },
    { id: "4", data: { content: "Fourth item - Smooth animations" } },
    { id: "5", data: { content: "Fifth item - Built with @dnd-kit" } },
  ]);

  // Kanban board state
  const [kanbanBoard, setKanbanBoard] = useState<KanbanBoardType>({
    id: "demo-board",
    title: "Demo Board",
    columns: [
      {
        id: "todo",
        title: "To Do",
        tasks: [
          {
            id: "task-1",
            title: "Design new landing page",
            description: "Create wireframes and mockups",
            columnId: "todo",
            position: 0,
          },
          {
            id: "task-2",
            title: "Implement user authentication",
            description: "Set up login and registration",
            columnId: "todo",
            position: 1,
          },
        ],
      },
      {
        id: "progress",
        title: "In Progress",
        tasks: [
          {
            id: "task-3",
            title: "Build API endpoints",
            description: "Create REST API for data management",
            columnId: "progress",
            position: 0,
          },
        ],
      },
      {
        id: "done",
        title: "Done",
        tasks: [
          {
            id: "task-4",
            title: "Set up project structure",
            description: "Initialize Next.js project with TypeScript",
            columnId: "done",
            position: 0,
          },
        ],
      },
    ],
    tasks: [],
  });

  // Dashboard widgets state
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetType[]>([
    {
      id: "widget-1",
      type: "chart",
      title: "Sales Chart",
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
    },
    {
      id: "widget-2",
      type: "stats",
      title: "User Stats",
      position: { x: 2, y: 0 },
      size: { width: 1, height: 1 },
    },
    {
      id: "widget-3",
      type: "table",
      title: "Recent Orders",
      position: { x: 0, y: 2 },
      size: { width: 3, height: 2 },
    },
  ]);

  // Form fields state
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: "field-1",
      type: "text",
      label: "Full Name",
      required: true,
      position: 0,
    },
    {
      id: "field-2",
      type: "email",
      label: "Email Address",
      required: true,
      position: 1,
    },
    {
      id: "field-3",
      type: "select",
      label: "Country",
      required: false,
      position: 2,
      options: [
        { label: "USA", value: "usa" },
        { label: "Canada", value: "canada" },
        { label: "UK", value: "uk" },
        { label: "Germany", value: "germany" },
        { label: "France", value: "france" },
      ],
    },
  ]);

  const renderDemo = () => {
    switch (activeDemo) {
      case "sortable":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Vertical Sortable List
              </h3>
              <SortableList
                items={sortableItems}
                onReorder={setSortableItems}
                renderItem={(item: DragItem) => (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    {item.data?.content}
                  </div>
                )}
              />
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Horizontal Sortable List
              </h3>
              <SortableList
                items={sortableItems.slice(0, 3)}
                onReorder={() => {}}
                renderItem={(item: DragItem) => (
                  <div className="p-4 bg-blue-50 rounded-lg border min-w-[200px]">
                    {item.data?.content}
                  </div>
                )}
              />
            </div>
          </div>
        );

      case "kanban":
        return (
          <div className="bg-white rounded-lg border p-6">
            <KanbanBoard
              columns={kanbanBoard.columns}
              onTaskMove={(
                taskId: string,
                sourceColumnId: string,
                targetColumnId: string,
                newPosition: number,
              ) => {
                setKanbanBoard((prev) => {
                  const newBoard = { ...prev };

                  // Find and remove task from source column
                  const sourceColumn = newBoard.columns.find(
                    (col) => col.id === sourceColumnId,
                  );
                  const targetColumn = newBoard.columns.find(
                    (col) => col.id === targetColumnId,
                  );

                  if (sourceColumn && targetColumn) {
                    const taskIndex = sourceColumn.tasks.findIndex(
                      (task) => task.id === taskId,
                    );
                    if (taskIndex !== -1) {
                      const [task] = sourceColumn.tasks.splice(taskIndex, 1);
                      task.columnId = targetColumnId;
                      task.position = newPosition;
                      targetColumn.tasks.splice(newPosition, 0, task);
                    }
                  }

                  return newBoard;
                });
              }}
              onColumnUpdate={(columns) => {
                setKanbanBoard((prev) => ({
                  ...prev,
                  columns,
                }));
              }}
            />
          </div>
        );

      case "upload":
        return (
          <div className="bg-white rounded-lg border p-6">
            <FileUploadZone
              onFilesAdded={(files: File[]) => {
                console.log("Files added:", files);
              }}
              onFileRemove={(fileId: string) => {
                console.log("File removed:", fileId);
              }}
              config={{
                acceptedFileTypes: ["image/*", ".pdf", ".doc", ".docx"],
                maxFileSize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                multiple: true,
                showPreview: true,
              }}
            />
          </div>
        );

      case "dashboard":
        return (
          <div className="bg-white rounded-lg border p-6">
            <DashboardBuilder
              widgets={dashboardWidgets}
              onSave={(widgets) => {
                setDashboardWidgets(widgets);
                console.log("Dashboard saved:", widgets);
              }}
            />
          </div>
        );

      case "form":
        return (
          <div className="bg-white rounded-lg border">
            <FormBuilder
              fields={formFields}
              onFieldsChange={(fields) => {
                setFormFields(fields);
              }}
              onFieldAdd={(field: FormField) => {
                setFormFields((prev) => [...prev, field]);
              }}
              onFieldRemove={(fieldId: string) => {
                setFormFields((prev) => prev.filter((f) => f.id !== fieldId));
              }}
              onFieldUpdate={(field: FormField) => {
                setFormFields((prev) =>
                  prev.map((f) => (f.id === field.id ? field : f)),
                );
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ClientOnlyDragDrop
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">
            Loading drag and drop components...
          </div>
        </div>
      }
    >
      <DragDropProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Drag &amp; Drop Component System
                    </h1>
                    <p className="text-sm text-gray-500">
                      Built with @dnd-kit, React, and TypeScript
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Github size={16} />
                    View Source
                  </a>
                  <a
                    href="https://dndkit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <ExternalLink size={16} />
                    @dnd-kit Docs
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex gap-8">
              {/* Sidebar Navigation */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border p-4">
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Components
                  </h2>
                  <nav className="space-y-2">
                    {demos.map((demo) => {
                      const Icon = demo.icon;
                      return (
                        <button
                          key={demo.id}
                          onClick={() => setActiveDemo(demo.id)}
                          className={`
                          w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                          ${
                            activeDemo === demo.id
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-50"
                          }
                        `}
                        >
                          <div className={`p-2 rounded-md ${demo.color}`}>
                            <Icon size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {demo.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {demo.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Features List */}
                <div className="bg-white rounded-lg border p-4 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      TypeScript Support
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Accessibility Ready
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Touch &amp; Mouse Support
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Customizable Styling
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Smooth Animations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Modular Architecture
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {demos.find((d) => d.id === activeDemo)?.title}
                  </h2>
                  <p className="text-gray-600">
                    {demos.find((d) => d.id === activeDemo)?.description}
                  </p>
                </div>

                {renderDemo()}
              </div>
            </div>
          </div>
        </div>
      </DragDropProvider>
    </ClientOnlyDragDrop>
  );
}