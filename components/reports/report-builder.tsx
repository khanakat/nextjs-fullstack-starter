'use client';

import { useState, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table, 
  Type, 
  Image, 
  Calendar,
  Hash,
  Save,
  Eye,
  Download,
  Settings,
  Trash2,
  Copy,
  Plus,
  Grid3X3,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Component types for the report builder
export type ComponentType = 'chart' | 'table' | 'text' | 'image' | 'metric' | 'filter';

export interface ReportComponent {
  id: string;
  type: ComponentType;
  title: string;
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'area';
    dataSource?: string;
    columns?: string[];
    filters?: any[];
    styling?: {
      width: number;
      height: number;
      backgroundColor?: string;
      textColor?: string;
      fontSize?: number;
    };
    content?: string;
    imageUrl?: string;
    metricValue?: number;
    metricLabel?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ReportBuilderProps {
  userId: string;
  editReportId?: string;
  duplicateReportId?: string;
  templateId?: string;
}

// Component palette items
const COMPONENT_PALETTE = [
  { type: 'chart', icon: BarChart3, label: 'Bar Chart', description: 'Display data in bars' },
  { type: 'chart', icon: LineChart, label: 'Line Chart', description: 'Show trends over time' },
  { type: 'chart', icon: PieChart, label: 'Pie Chart', description: 'Show proportions' },
  { type: 'table', icon: Table, label: 'Data Table', description: 'Tabular data display' },
  { type: 'text', icon: Type, label: 'Text Block', description: 'Add text content' },
  { type: 'image', icon: Image, label: 'Image', description: 'Insert images' },
  { type: 'metric', icon: Hash, label: 'Metric Card', description: 'Key performance indicators' },
  { type: 'filter', icon: Calendar, label: 'Filter', description: 'Interactive filters' },
];

// Draggable component wrapper
function DraggableComponent({ component, isSelected, onSelect, onDelete }: {
  component: ReportComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderComponentContent = () => {
    switch (component.type) {
      case 'chart':
        return (
          <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-sm font-medium text-blue-700">
              {component.config.chartType || 'bar'} Chart
            </span>
          </div>
        );
      case 'table':
        return (
          <div className="h-32 bg-gradient-to-br from-green-50 to-green-100 rounded flex items-center justify-center">
            <Table className="h-8 w-8 text-green-600" />
            <span className="ml-2 text-sm font-medium text-green-700">Data Table</span>
          </div>
        );
      case 'text':
        return (
          <div className="h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded p-3">
            <Type className="h-4 w-4 text-purple-600 mb-2" />
            <p className="text-sm text-purple-700 line-clamp-2">
              {component.config.content || 'Text content goes here...'}
            </p>
          </div>
        );
      case 'metric':
        return (
          <div className="h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded p-3 flex flex-col justify-center">
            <div className="text-2xl font-bold text-orange-700">
              {component.config.metricValue || '0'}
            </div>
            <div className="text-sm text-orange-600">
              {component.config.metricLabel || 'Metric'}
            </div>
          </div>
        );
      default:
        return (
          <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500">Component</span>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        "relative cursor-move border-2 border-dashed border-transparent hover:border-blue-300 rounded-lg p-2 group",
        isSelected && "border-blue-500 bg-blue-50/50"
      )}
    >
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{component.title}</CardTitle>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {renderComponentContent()}
        </CardContent>
      </Card>
    </div>
  );
}

// Component palette item
function PaletteItem({ item, onDragStart }: {
  item: typeof COMPONENT_PALETTE[0];
  onDragStart: (type: ComponentType) => void;
}) {
  const Icon = item.icon;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.type as ComponentType)}
      className="p-3 border rounded-lg cursor-grab hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
        <span className="text-sm font-medium">{item.label}</span>
      </div>
      <p className="text-xs text-gray-500">{item.description}</p>
    </div>
  );
}

export function ReportBuilder({ userId, editReportId, duplicateReportId, templateId }: ReportBuilderProps) {
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('Untitled Report');
  const [reportDescription, setReportDescription] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate unique component ID
  const generateComponentId = () => `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add component to canvas
  const addComponent = useCallback((type: ComponentType) => {
    const newComponent: ReportComponent = {
      id: generateComponentId(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      config: {
        styling: {
          width: 300,
          height: 200,
        },
      },
      position: {
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 300,
        height: 200,
      },
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} component added`);
  }, []);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Delete component
  const deleteComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
    toast.success('Component deleted');
  }, [selectedComponent]);

  // Update component config
  const updateComponentConfig = useCallback((componentId: string, config: Partial<ReportComponent['config']>) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId 
        ? { ...c, config: { ...c.config, ...config } }
        : c
    ));
  }, []);

  // Update component title
  const updateComponentTitle = useCallback((componentId: string, title: string) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId 
        ? { ...c, title }
        : c
    ));
  }, []);

  // Save report
  const saveReport = async () => {
    setIsSaving(true);
    try {
      const reportData = {
        title: reportTitle,
        description: reportDescription,
        config: {
          components,
          layout: 'grid',
        },
      };

      const response = await fetch('/api/reports', {
        method: editReportId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          ...(editReportId && { id: editReportId }),
        }),
      });

      if (!response.ok) throw new Error('Failed to save report');

      toast.success(editReportId ? 'Report updated successfully' : 'Report saved successfully');
    } catch (error) {
      toast.error('Failed to save report');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedComponentData = selectedComponent 
    ? components.find(c => c.id === selectedComponent)
    : null;

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Component Palette */}
      <div className="w-80 border-r bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg mb-2">Components</h2>
          <p className="text-sm text-gray-600">Drag components to the canvas</p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="grid gap-3">
            {COMPONENT_PALETTE.map((item, index) => (
              <PaletteItem
                key={index}
                item={item}
                onDragStart={addComponent}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
                placeholder="Report Title"
              />
              <Input
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="text-sm text-gray-600 border-none p-0 h-auto focus-visible:ring-0"
                placeholder="Add description..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="sm"
              onClick={saveReport}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <div
            ref={canvasRef}
            className="min-h-full p-8"
            style={{ minWidth: '1200px' }}
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={components.map(c => c.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-12 gap-4 min-h-[800px] bg-white rounded-lg p-6 shadow-sm">
                  {components.length === 0 ? (
                    <div className="col-span-12 flex flex-col items-center justify-center h-64 text-gray-500">
                      <Grid3X3 className="h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Start Building Your Report</h3>
                      <p className="text-center max-w-md">
                        Drag components from the left panel to create your custom report layout
                      </p>
                    </div>
                  ) : (
                    components.map((component) => (
                      <div key={component.id} className="col-span-6">
                        <DraggableComponent
                          component={component}
                          isSelected={selectedComponent === component.id}
                          onSelect={() => setSelectedComponent(component.id)}
                          onDelete={() => deleteComponent(component.id)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="opacity-50">
                    {/* Render dragging component */}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <div className="w-80 border-l bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg">Properties</h2>
        </div>

        <ScrollArea className="flex-1">
          {selectedComponentData ? (
            <div className="p-4 space-y-6">
              <div>
                <Label htmlFor="component-title">Component Title</Label>
                <Input
                  id="component-title"
                  value={selectedComponentData.title}
                  onChange={(e) => updateComponentTitle(selectedComponentData.id, e.target.value)}
                  className="mt-1"
                />
              </div>

              <Separator />

              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="space-y-4">
                  {selectedComponentData.type === 'chart' && (
                    <>
                      <div>
                        <Label>Chart Type</Label>
                        <Select
                          value={selectedComponentData.config.chartType || 'bar'}
                          onValueChange={(value) => updateComponentConfig(selectedComponentData.id, { chartType: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data Source</Label>
                        <Select
                          value={selectedComponentData.config.dataSource || ''}
                          onValueChange={(value) => updateComponentConfig(selectedComponentData.id, { dataSource: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select data source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Users</SelectItem>
                            <SelectItem value="posts">Posts</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedComponentData.type === 'text' && (
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={selectedComponentData.config.content || ''}
                        onChange={(e) => updateComponentConfig(selectedComponentData.id, { content: e.target.value })}
                        className="mt-1"
                        rows={4}
                        placeholder="Enter text content..."
                      />
                    </div>
                  )}

                  {selectedComponentData.type === 'metric' && (
                    <>
                      <div>
                        <Label>Metric Value</Label>
                        <Input
                          type="number"
                          value={selectedComponentData.config.metricValue || 0}
                          onChange={(e) => updateComponentConfig(selectedComponentData.id, { metricValue: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Metric Label</Label>
                        <Input
                          value={selectedComponentData.config.metricLabel || ''}
                          onChange={(e) => updateComponentConfig(selectedComponentData.id, { metricLabel: e.target.value })}
                          className="mt-1"
                          placeholder="e.g., Total Users"
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedComponentData.config.styling?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateComponentConfig(selectedComponentData.id, {
                          styling: { 
                            width: selectedComponentData.config.styling?.width || 400,
                            height: selectedComponentData.config.styling?.height || 300,
                            ...selectedComponentData.config.styling, 
                            backgroundColor: e.target.value 
                          }
                        })}
                        className="w-8 h-8 rounded border"
                      />
                      <Input
                        value={selectedComponentData.config.styling?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateComponentConfig(selectedComponentData.id, {
                          styling: { 
                            width: selectedComponentData.config.styling?.width || 400,
                            height: selectedComponentData.config.styling?.height || 300,
                            ...selectedComponentData.config.styling, 
                            backgroundColor: e.target.value 
                          }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedComponentData.config.styling?.textColor || '#000000'}
                        onChange={(e) => updateComponentConfig(selectedComponentData.id, {
                          styling: { 
                            width: selectedComponentData.config.styling?.width || 400,
                            height: selectedComponentData.config.styling?.height || 300,
                            ...selectedComponentData.config.styling, 
                            textColor: e.target.value 
                          }
                        })}
                        className="w-8 h-8 rounded border"
                      />
                      <Input
                        value={selectedComponentData.config.styling?.textColor || '#000000'}
                        onChange={(e) => updateComponentConfig(selectedComponentData.id, {
                          styling: { 
                            width: selectedComponentData.config.styling?.width || 400,
                            height: selectedComponentData.config.styling?.height || 300,
                            ...selectedComponentData.config.styling, 
                            textColor: e.target.value 
                          }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={selectedComponentData.config.styling?.fontSize || 14}
                      onChange={(e) => updateComponentConfig(selectedComponentData.id, {
                        styling: { 
                          width: selectedComponentData.config.styling?.width || 400,
                          height: selectedComponentData.config.styling?.height || 300,
                          ...selectedComponentData.config.styling, 
                          fontSize: Number(e.target.value) 
                        }
                      })}
                      className="mt-1"
                      min="8"
                      max="72"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Visible</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Interactive</Label>
                    <Switch defaultChecked />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <p>Select a component to edit its properties</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}