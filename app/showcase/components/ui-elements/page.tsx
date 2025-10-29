"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Search,
  Filter,
  Copy,
  ExternalLink,
  Code,
  Eye,
  Palette,
  Layout,
  MousePointer,
  FileText,
  Grid,
  Zap,
  Settings,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Upload,
  Calendar,
  BarChart3,
  Clock,
  Users,
  Bell,
  Shield,
  Sparkles,
} from "lucide-react";

// Component showcase data
const componentCategories = [
  {
    id: "design-system",
    name: "Design System",
    icon: Palette,
    description: "Design tokens, themes, and foundational elements",
    components: [
      {
        name: "Design Tokens",
        description: "Colors, typography, spacing, and other design primitives",
        path: "/design-system/tokens",
        status: "stable",
        tags: ["foundation", "tokens", "theme"],
      },
      {
        name: "Theme System",
        description: "Light/dark mode and custom theme management",
        path: "/design-system/themes",
        status: "stable",
        tags: ["theme", "customization"],
      },
      {
        name: "Typography",
        description: "Text styles, headings, and font configurations",
        path: "/design-system/typography",
        status: "stable",
        tags: ["text", "fonts", "accessibility"],
      },
    ],
  },
  {
    id: "layout",
    name: "Layout Components",
    icon: Layout,
    description: "Grid systems, containers, and layout utilities",
    components: [
      {
        name: "Grid System",
        description: "Responsive grid layouts with breakpoint controls",
        path: "/ui-components/grid",
        status: "stable",
        tags: ["grid", "responsive", "layout"],
        preview: "GridPreview",
      },
      {
        name: "Sidebar",
        description: "Collapsible sidebar with navigation and sections",
        path: "/ui-components/sidebar",
        status: "stable",
        tags: ["navigation", "sidebar", "responsive"],
        preview: "SidebarPreview",
      },
      {
        name: "Dashboard Layout",
        description: "Pre-built dashboard templates and layouts",
        path: "/ui-components/dashboard-layout",
        status: "stable",
        tags: ["dashboard", "template", "layout"],
        preview: "DashboardPreview",
      },
      {
        name: "Split Pane",
        description: "Resizable split panes for complex layouts",
        path: "/ui-components/split-pane",
        status: "stable",
        tags: ["split", "resizable", "panels"],
        preview: "SplitPanePreview",
      },
    ],
  },
  {
    id: "interactive",
    name: "Interactive Components",
    icon: MousePointer,
    description: "User interaction and feedback components",
    components: [
      {
        name: "Keyboard Shortcuts",
        description: "Global keyboard shortcut system with help dialog",
        path: "/ui-components/keyboard-shortcuts",
        status: "stable",
        tags: ["shortcuts", "accessibility", "navigation"],
        preview: "ShortcutsPreview",
      },
      {
        name: "Context Menu",
        description: "Right-click context menus with nested items",
        path: "/ui-components/context-menu",
        status: "stable",
        tags: ["menu", "context", "interaction"],
        preview: "ContextMenuPreview",
      },
      {
        name: "Advanced Tooltip",
        description: "Rich tooltips with custom content and positioning",
        path: "/ui-components/tooltip",
        status: "stable",
        tags: ["tooltip", "help", "information"],
        preview: "TooltipPreview",
      },
      {
        name: "Search Components",
        description: "Advanced search with autocomplete and filters",
        path: "/ui-components/search",
        status: "stable",
        tags: ["search", "filter", "autocomplete"],
        preview: "SearchPreview",
      },
    ],
  },
  {
    id: "forms",
    name: "Form Components",
    icon: FileText,
    description: "Advanced form controls and validation",
    components: [
      {
        name: "Form Wizard",
        description: "Multi-step forms with validation and progress tracking",
        path: "/ui-components/form-wizard",
        status: "stable",
        tags: ["form", "wizard", "validation"],
        preview: "FormWizardPreview",
      },
      {
        name: "Dynamic Form",
        description: "Schema-driven forms with conditional fields",
        path: "/ui-components/dynamic-form",
        status: "stable",
        tags: ["form", "dynamic", "schema"],
        preview: "DynamicFormPreview",
      },
      {
        name: "Form Validation",
        description: "Comprehensive validation system with real-time feedback",
        path: "/ui-components/form-validation",
        status: "stable",
        tags: ["validation", "form", "feedback"],
        preview: "ValidationPreview",
      },
      {
        name: "File Upload",
        description: "Drag-and-drop file upload with progress and preview",
        path: "/ui-components/file-upload",
        status: "stable",
        tags: ["upload", "file", "drag-drop"],
        preview: "FileUploadPreview",
      },
    ],
  },
  {
    id: "data",
    name: "Data Components",
    icon: Grid,
    description: "Data display and visualization components",
    components: [
      {
        name: "Advanced Data Table",
        description:
          "Feature-rich data tables with sorting, filtering, and export",
        path: "/ui-components/data-table",
        status: "beta",
        tags: ["table", "data", "sorting", "filtering"],
        preview: "DataTablePreview",
      },
      {
        name: "Charts & Visualization",
        description: "Interactive charts and data visualization components",
        path: "/ui-components/charts",
        status: "beta",
        tags: ["charts", "visualization", "data"],
        preview: "ChartsPreview",
      },
      {
        name: "Timeline",
        description: "Activity timeline and event display components",
        path: "/ui-components/timeline",
        status: "alpha",
        tags: ["timeline", "activity", "events"],
        preview: "TimelinePreview",
      },
    ],
  },
  {
    id: "utilities",
    name: "Utility Components",
    icon: Zap,
    description: "Helper components and utilities",
    components: [
      {
        name: "Loading States",
        description: "Skeleton screens and loading indicators",
        path: "/ui-components/loading",
        status: "stable",
        tags: ["loading", "skeleton", "spinner"],
        preview: "LoadingPreview",
      },
      {
        name: "Error Boundaries",
        description: "Error handling and recovery components",
        path: "/ui-components/error-boundary",
        status: "stable",
        tags: ["error", "boundary", "recovery"],
        preview: "ErrorPreview",
      },
      {
        name: "Animations",
        description: "Animation utilities and transition components",
        path: "/ui-components/animations",
        status: "beta",
        tags: ["animation", "transition", "motion"],
        preview: "AnimationPreview",
      },
    ],
  },
];

const statusColors = {
  stable: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  beta: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  alpha: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  deprecated: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

// Demo Components
const DemoComponents = {
  GridPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded text-center">Col 1</div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded text-center">Col 2</div>
        <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded text-center">Col 3</div>
      </div>
    </div>
  ),
  
  SidebarPreview: () => (
    <div className="flex h-32 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="w-16 bg-gray-200 dark:bg-gray-700 p-2">
        <div className="space-y-2">
          <div className="w-8 h-8 bg-blue-500 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      </div>
    </div>
  ),

  DashboardPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">Users</div>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold">1,234</div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">Revenue</div>
            <BarChart3 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-xl font-bold">$12.3K</div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm h-16">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Activity Chart</div>
        <div className="flex items-end space-x-1 h-8">
          {[3, 7, 4, 8, 5, 6, 7].map((height, i) => (
            <div key={i} className="bg-blue-500 w-2 rounded-t" style={{ height: `${height * 4}px` }}></div>
          ))}
        </div>
      </div>
    </div>
  ),

  SplitPanePreview: () => (
    <div className="flex h-32 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex-1 bg-white dark:bg-gray-700 p-4 border-r">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
      </div>
      <div className="w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize"></div>
      <div className="flex-1 bg-white dark:bg-gray-700 p-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      </div>
    </div>
  ),

  ShortcutsPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Save</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">Ctrl</Badge>
            <Badge variant="outline" className="text-xs">S</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Copy</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">Ctrl</Badge>
            <Badge variant="outline" className="text-xs">C</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Paste</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">Ctrl</Badge>
            <Badge variant="outline" className="text-xs">V</Badge>
          </div>
        </div>
      </div>
    </div>
  ),

  ContextMenuPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="bg-white dark:bg-gray-700 border rounded-lg shadow-lg p-2 w-48">
        <div className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm cursor-pointer">Cut</div>
        <div className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm cursor-pointer">Copy</div>
        <div className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm cursor-pointer">Paste</div>
        <div className="border-t my-1"></div>
        <div className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm cursor-pointer">Delete</div>
      </div>
    </div>
  ),

  TooltipPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="relative">
        <Button variant="outline" className="mb-8">Hover me</Button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black text-white text-xs rounded px-2 py-1">
          This is a tooltip
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-black"></div>
        </div>
      </div>
    </div>
  ),

  SearchPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search components..." className="pl-10" />
      </div>
      <div className="mt-2 space-y-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-700 rounded">Button Component</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-700 rounded">Card Component</div>
      </div>
    </div>
  ),

  FormWizardPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">2</div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">3</div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Step 1 of 3</span>
      </div>
      <div className="space-y-2">
        <Input placeholder="First Name" />
        <Input placeholder="Last Name" />
      </div>
    </div>
  ),

  DynamicFormPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Field Type</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
          </Select>
        </div>
        <div className="border-l-2 border-blue-500 pl-3">
          <Input placeholder="Dynamic field appears here" />
        </div>
      </div>
    </div>
  ),

  ValidationPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-2">
        <Input placeholder="Email" className="border-red-500" />
        <div className="flex items-center text-red-500 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Please enter a valid email
        </div>
        <Input placeholder="Password" className="border-green-500" />
        <div className="flex items-center text-green-500 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Password is strong
        </div>
      </div>
    </div>
  ),

  FileUploadPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <div className="text-sm text-gray-600 dark:text-gray-400">Drop files here or click to browse</div>
      </div>
    </div>
  ),

  DataTablePreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="bg-white dark:bg-gray-700 rounded border">
        <div className="grid grid-cols-3 gap-4 p-2 border-b text-xs font-medium">
          <div>Name</div>
          <div>Status</div>
          <div>Date</div>
        </div>
        <div className="grid grid-cols-3 gap-4 p-2 text-xs">
          <div>John Doe</div>
          <div><Badge variant="outline" className="text-xs">Active</Badge></div>
          <div>2024-01-15</div>
        </div>
        <div className="grid grid-cols-3 gap-4 p-2 text-xs">
          <div>Jane Smith</div>
          <div><Badge variant="secondary" className="text-xs">Pending</Badge></div>
          <div>2024-01-14</div>
        </div>
      </div>
    </div>
  ),

  ChartsPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="bg-white dark:bg-gray-700 p-3 rounded">
        <div className="text-sm font-medium mb-2">Sales Chart</div>
        <div className="flex items-end space-x-1 h-16">
          {[20, 35, 25, 45, 30, 40, 35].map((height, i) => (
            <div key={i} className="bg-blue-500 w-4 rounded-t" style={{ height: `${height}px` }}></div>
          ))}
        </div>
      </div>
    </div>
  ),

  TimelinePreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div>
            <div className="text-sm font-medium">User registered</div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
          <div>
            <div className="text-sm font-medium">Profile completed</div>
            <div className="text-xs text-gray-500">1 hour ago</div>
          </div>
        </div>
      </div>
    </div>
  ),

  LoadingPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  ),

  ErrorPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-800 dark:text-red-200">Something went wrong</span>
        </div>
        <div className="text-xs text-red-600 dark:text-red-300 mt-1">Please try again later</div>
      </div>
    </div>
  ),

  AnimationPreview: () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded animate-bounce"></div>
        <div className="w-8 h-8 bg-green-500 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-purple-500 rounded animate-spin"></div>
      </div>
    </div>
  ),
};

// Code examples for each component
const CodeExamples = {
  "Grid System": `import { Grid, Container } from "@/components/ui/grid";

export function GridExample() {
  return (
    <Container>
      <Grid cols={3} gap={4}>
        <div>Column 1</div>
        <div>Column 2</div>
        <div>Column 3</div>
      </Grid>
    </Container>
  );
}`,

  "Sidebar": `import { Sidebar, SidebarItem } from "@/components/ui/sidebar";

export function SidebarExample() {
  return (
    <Sidebar>
      <SidebarItem icon={Home} href="/">
        Dashboard
      </SidebarItem>
      <SidebarItem icon={Users} href="/users">
        Users
      </SidebarItem>
    </Sidebar>
  );
}`,

  "Dashboard Layout": `import { DashboardLayout } from "@/components/ui/dashboard-layout";

export function DashboardExample() {
  return (
    <DashboardLayout
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <main>Dashboard content</main>
    </DashboardLayout>
  );
}`,

  "Split Pane": `import { SplitPane } from "@/components/ui/split-pane";

export function SplitPaneExample() {
  return (
    <SplitPane
      left={<div>Left panel</div>}
      right={<div>Right panel</div>}
      defaultSize={300}
      minSize={200}
      maxSize={500}
    />
  );
}`,

  "Keyboard Shortcuts": `import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function ShortcutsExample() {
  useKeyboardShortcuts([
    {
      keys: ["ctrl", "s"],
      action: () => console.log("Save"),
      description: "Save document"
    },
    {
      keys: ["ctrl", "c"],
      action: () => console.log("Copy"),
      description: "Copy selection"
    }
  ]);

  return <div>Press Ctrl+S to save</div>;
}`,

  "Context Menu": `import { ContextMenu } from "@/components/ui/context-menu";

export function ContextMenuExample() {
  return (
    <ContextMenu
      items={[
        { label: "Cut", action: () => {} },
        { label: "Copy", action: () => {} },
        { label: "Paste", action: () => {} },
        { type: "separator" },
        { label: "Delete", action: () => {} }
      ]}
    >
      <div>Right-click me</div>
    </ContextMenu>
  );
}`,

  "Advanced Tooltip": `import { Tooltip } from "@/components/ui/tooltip";

export function TooltipExample() {
  return (
    <Tooltip content="This is a helpful tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  );
}`,

  "Search Components": `import { SearchInput } from "@/components/ui/search";

export function SearchExample() {
  return (
    <SearchInput
      placeholder="Search components..."
      onSearch={(query) => console.log(query)}
      suggestions={["Button", "Card", "Input"]}
    />
  );
}`,

  "Form Wizard": `import { FormWizard, Step } from "@/components/ui/form-wizard";

export function FormWizardExample() {
  return (
    <FormWizard>
      <Step title="Personal Info">
        <Input placeholder="First Name" />
        <Input placeholder="Last Name" />
      </Step>
      <Step title="Contact">
        <Input placeholder="Email" />
        <Input placeholder="Phone" />
      </Step>
      <Step title="Review">
        <div>Review your information</div>
      </Step>
    </FormWizard>
  );
}`,

  "Dynamic Form": `import { DynamicForm } from "@/components/ui/dynamic-form";

const schema = {
  fields: [
    {
      type: "text",
      name: "name",
      label: "Name",
      required: true
    },
    {
      type: "email",
      name: "email",
      label: "Email",
      required: true
    }
  ]
};

export function DynamicFormExample() {
  return (
    <DynamicForm
      schema={schema}
      onSubmit={(data) => console.log(data)}
    />
  );
}`,

  "Form Validation": `import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short")
});

export function ValidationExample() {
  const form = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={form.handleSubmit(console.log)}>
      <Input {...form.register("email")} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
    </form>
  );
}`,

  "File Upload": `import { FileUpload } from "@/components/ui/file-upload";

export function FileUploadExample() {
  return (
    <FileUpload
      accept="image/*"
      multiple
      onUpload={(files) => console.log(files)}
      maxSize={5 * 1024 * 1024} // 5MB
    />
  );
}`,

  "Advanced Data Table": `import { DataTable } from "@/components/ui/data-table";

const columns = [
  { key: "name", label: "Name", sortable: true },
  { key: "status", label: "Status", filterable: true },
  { key: "date", label: "Date", sortable: true }
];

export function DataTableExample() {
  return (
    <DataTable
      data={data}
      columns={columns}
      pagination
      search
      export
    />
  );
}`,

  "Charts & Visualization": `import { LineChart, BarChart } from "@/components/ui/charts";

export function ChartsExample() {
  return (
    <div>
      <LineChart
        data={salesData}
        xKey="date"
        yKey="sales"
        title="Sales Over Time"
      />
      <BarChart
        data={categoryData}
        xKey="category"
        yKey="value"
        title="Sales by Category"
      />
    </div>
  );
}`,

  "Timeline": `import { Timeline, TimelineItem } from "@/components/ui/timeline";

export function TimelineExample() {
  return (
    <Timeline>
      <TimelineItem
        time="2 hours ago"
        title="User registered"
        description="New user signed up"
        icon={<User />}
      />
      <TimelineItem
        time="1 hour ago"
        title="Profile completed"
        description="User filled out profile"
        icon={<CheckCircle />}
      />
    </Timeline>
  );
}`,

  "Loading States": `import { LoadingSpinner, Skeleton } from "@/components/ui/loading";

export function LoadingExample() {
  return (
    <div>
      <LoadingSpinner size="lg" />
      
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}`,

  "Error Boundaries": `import { ErrorBoundary } from "@/components/ui/error-boundary";

export function ErrorBoundaryExample() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error) => console.error(error)}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}`,

  "Animations": `import { motion } from "framer-motion";

export function AnimationExample() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      Animated content
    </motion.div>
  );
}`,

  "Design Tokens": `// Design tokens example
export const tokens = {
  colors: {
    primary: {
      50: "#eff6ff",
      500: "#3b82f6",
      900: "#1e3a8a"
    }
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem"
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      mono: ["Fira Code", "monospace"]
    }
  }
};`,

  "Theme System": `import { useTheme } from "@/hooks/use-theme";

export function ThemeExample() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <Button onClick={() => setTheme("light")}>
        Light Mode
      </Button>
      <Button onClick={() => setTheme("dark")}>
        Dark Mode
      </Button>
      <Button onClick={() => setTheme("system")}>
        System
      </Button>
    </div>
  );
}`,

  "Typography": `// Typography system
export const typography = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  body: "text-base leading-relaxed",
  caption: "text-sm text-muted-foreground"
};

export function TypographyExample() {
  return (
    <div>
      <h1 className={typography.h1}>Heading 1</h1>
      <h2 className={typography.h2}>Heading 2</h2>
      <p className={typography.body}>Body text</p>
    </div>
  );
}`
};

// Simple syntax highlighter component
function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="max-h-96">
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-b-lg overflow-x-auto">
          <code className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">
            {code}
          </code>
        </pre>
      </ScrollArea>
    </div>
  );
}

export default function UIElementsShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [modalType, setModalType] = useState<"view" | "code" | null>(null);

  // Handlers for opening modals
  const handleViewComponent = (component: any) => {
    setSelectedComponent(component);
    setModalType("view");
  };

  const handleViewCode = (component: any) => {
    setSelectedComponent(component);
    setModalType("code");
  };

  const closeModal = () => {
    setSelectedComponent(null);
    setModalType(null);
  };

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  const renderPreview = (component: any) => {
    if (!component?.preview) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Preview not available</p>
          </div>
        </div>
      );
    }

    const PreviewComponent = DemoComponents[component.preview as keyof typeof DemoComponents];
    if (PreviewComponent) {
      return <PreviewComponent />;
    }

    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Preview component not found: {component.preview}</p>
        </div>
      </div>
    );
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      componentCategories.flatMap((category) =>
        category.components.flatMap((component) => component.tags || []),
      ),
    ),
  ).sort();

  // Filter components based on search and filters
  const filteredCategories = componentCategories
    .map((category) => ({
      ...category,
      components: category.components.filter((component) => {
        const matchesSearch =
          component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          component.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (component.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        const matchesCategory =
          selectedCategory === "all" || category.id === selectedCategory;
        const matchesStatus =
          selectedStatus === "all" || component.status === selectedStatus;
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => (component.tags || []).includes(tag));

        return matchesSearch && matchesCategory && matchesStatus && matchesTags;
      }),
    }))
    .filter((category) => category.components.length > 0);

  const totalComponents = componentCategories.reduce(
    (total, category) => total + category.components.length,
    0,
  );

  const filteredTotal = filteredCategories.reduce(
    (total, category) => total + category.components.length,
    0,
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">UI Components Showcase</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Explore our comprehensive collection of advanced UI components and
          design system elements. Each component is built with accessibility,
          responsiveness, and customization in mind.
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>
              Stable (
              {
                componentCategories
                  .flatMap((c) => c.components)
                  .filter((c) => c.status === "stable").length
              }
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>
              Beta (
              {
                componentCategories
                  .flatMap((c) => c.components)
                  .filter((c) => c.status === "beta").length
              }
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>
              Alpha (
              {
                componentCategories
                  .flatMap((c) => c.components)
                  .filter((c) => c.status === "alpha").length
              }
              )
            </span>
          </div>
          <div className="ml-auto">
            <span>
              Showing {filteredTotal} of {totalComponents} components
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Find components by name, description, category, status, or tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {componentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <Select
                value={selectedTags[0] || ""}
                onValueChange={(value) => {
                  if (value && !selectedTags.includes(value)) {
                    setSelectedTags([...selectedTags, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add tag filter" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedTags(selectedTags.filter((t) => t !== tag))
                  }
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}

          {/* Clear Filters */}
          <div className="flex justify-end">
            {(searchQuery ||
              selectedCategory !== "all" ||
              selectedStatus !== "all" ||
              selectedTags.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedTags([]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Component Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <category.icon className="w-6 h-6" />
                {category.name}
                <Badge variant="outline">{category.components.length}</Badge>
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.components.map((component) => (
                  <Card
                    key={component.name}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {component.name}
                        </CardTitle>
                        <Badge
                          className={
                            statusColors[
                              component.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {component.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {component.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {(component.tags || []).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewComponent(component)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewCode(component)}
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Code
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyPath(component.path)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No components found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedTags([]);
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Component Modal */}
      <Dialog open={!!selectedComponent} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === "view" ? (
                <Eye className="w-5 h-5" />
              ) : (
                <Code className="w-5 h-5" />
              )}
              {selectedComponent?.name} - {modalType === "view" ? "Preview" : "Code"}
            </DialogTitle>
            <DialogDescription>
              {selectedComponent?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {modalType === "view" ? (
              <Tabs defaultValue="preview" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="info">Component Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
                    {renderPreview(selectedComponent)}
                  </div>
                </TabsContent>
                
                <TabsContent value="info" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <Badge className={statusColors[selectedComponent?.status as keyof typeof statusColors]}>
                        {selectedComponent?.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Path</h4>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        {selectedComponent?.path}
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedComponent?.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <ScrollArea className="h-[60vh]">
                <CodeBlock 
                  code={CodeExamples[selectedComponent?.name as keyof typeof CodeExamples] || "// Code example not available"} 
                />
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/showcase/components/design-system" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Design System
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/showcase/features" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Features
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/showcase/integrations" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Integrations
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/docs" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}