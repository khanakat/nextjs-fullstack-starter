'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ComponentConfig {
  id: string;
  type: 'chart' | 'table' | 'text' | 'image' | 'metric' | 'filter';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  dataSource?: string;
  dataBinding?: Record<string, any>;
}

export interface ReportLayout {
  id: string;
  name: string;
  description?: string;
  components: ComponentConfig[];
  settings: {
    pageSize: 'a4' | 'letter' | 'a3' | 'custom';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    backgroundColor: string;
    gridSize: number;
    snapToGrid: boolean;
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentTemplate {
  id: string;
  type: ComponentConfig['type'];
  name: string;
  description: string;
  icon: string;
  defaultProperties: Record<string, any>;
  defaultSize: { width: number; height: number };
}

const defaultComponentTemplates: ComponentTemplate[] = [
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    description: 'Display data as vertical bars',
    icon: 'BarChart3',
    defaultProperties: {
      chartType: 'bar',
      title: 'Bar Chart',
      xAxis: { label: 'Category', field: '' },
      yAxis: { label: 'Value', field: '' },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    },
    defaultSize: { width: 400, height: 300 },
  },
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    description: 'Display data trends over time',
    icon: 'TrendingUp',
    defaultProperties: {
      chartType: 'line',
      title: 'Line Chart',
      xAxis: { label: 'Time', field: '' },
      yAxis: { label: 'Value', field: '' },
      colors: ['#3b82f6'],
    },
    defaultSize: { width: 400, height: 300 },
  },
  {
    id: 'pie-chart',
    type: 'chart',
    name: 'Pie Chart',
    description: 'Display data as pie slices',
    icon: 'PieChart',
    defaultProperties: {
      chartType: 'pie',
      title: 'Pie Chart',
      dataField: '',
      labelField: '',
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    },
    defaultSize: { width: 300, height: 300 },
  },
  {
    id: 'data-table',
    type: 'table',
    name: 'Data Table',
    description: 'Display data in tabular format',
    icon: 'Table',
    defaultProperties: {
      title: 'Data Table',
      columns: [],
      pagination: true,
      sorting: true,
      filtering: false,
      striped: true,
    },
    defaultSize: { width: 600, height: 400 },
  },
  {
    id: 'text-block',
    type: 'text',
    name: 'Text Block',
    description: 'Add formatted text content',
    icon: 'Type',
    defaultProperties: {
      content: 'Enter your text here...',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: 'transparent',
    },
    defaultSize: { width: 300, height: 100 },
  },
  {
    id: 'image-block',
    type: 'image',
    name: 'Image',
    description: 'Add images to your report',
    icon: 'Image',
    defaultProperties: {
      src: '',
      alt: 'Image',
      fit: 'cover',
      borderRadius: 0,
    },
    defaultSize: { width: 200, height: 150 },
  },
  {
    id: 'metric-card',
    type: 'metric',
    name: 'Metric Card',
    description: 'Display key metrics and KPIs',
    icon: 'Activity',
    defaultProperties: {
      title: 'Metric',
      value: '0',
      unit: '',
      trend: 0,
      trendLabel: '',
      color: '#3b82f6',
    },
    defaultSize: { width: 200, height: 120 },
  },
  {
    id: 'filter-control',
    type: 'filter',
    name: 'Filter Control',
    description: 'Add interactive filters',
    icon: 'Filter',
    defaultProperties: {
      label: 'Filter',
      type: 'select',
      options: [],
      defaultValue: '',
      field: '',
    },
    defaultSize: { width: 200, height: 40 },
  },
];

export function useReportBuilder(initialLayout?: ReportLayout) {
  const [layout, setLayout] = useState<ReportLayout>(
    initialLayout || {
      id: '',
      name: 'Untitled Report',
      description: '',
      components: [],
      settings: {
        pageSize: 'a4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        backgroundColor: '#ffffff',
        gridSize: 10,
        snapToGrid: true,
      },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [history, setHistory] = useState<ReportLayout[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Component templates
  const componentTemplates = defaultComponentTemplates;

  // Add component to layout
  const addComponent = useCallback((template: ComponentTemplate, position: { x: number; y: number }) => {
    const newComponent: ComponentConfig = {
      id: `${template.id}-${Date.now()}`,
      type: template.type,
      position,
      size: template.defaultSize,
      properties: { ...template.defaultProperties },
    };

    setLayout(prev => {
      const updated = {
        ...prev,
        components: [...prev.components, newComponent],
        updatedAt: new Date().toISOString(),
      };
      
      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);
      
      return updated;
    });

    setSelectedComponent(newComponent.id);
    toast.success(`Added ${template.name} to report`);
  }, [historyIndex]);

  // Update component
  const updateComponent = useCallback((componentId: string, updates: Partial<ComponentConfig>) => {
    setLayout(prev => {
      const updated = {
        ...prev,
        components: prev.components.map(comp =>
          comp.id === componentId ? { ...comp, ...updates } : comp
        ),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to history for significant changes
      if (updates.position || updates.size || updates.properties) {
        setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
        setHistoryIndex(i => i + 1);
      }
      
      return updated;
    });
  }, [historyIndex]);

  // Remove component
  const removeComponent = useCallback((componentId: string) => {
    setLayout(prev => {
      const updated = {
        ...prev,
        components: prev.components.filter(comp => comp.id !== componentId),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);
      
      return updated;
    });

    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }

    toast.success('Component removed');
  }, [selectedComponent, historyIndex]);

  // Duplicate component
  const duplicateComponent = useCallback((componentId: string) => {
    const component = layout.components.find(c => c.id === componentId);
    if (!component) return;

    const duplicated: ComponentConfig = {
      ...component,
      id: `${component.type}-${Date.now()}`,
      position: {
        x: component.position.x + 20,
        y: component.position.y + 20,
      },
    };

    setLayout(prev => {
      const updated = {
        ...prev,
        components: [...prev.components, duplicated],
        updatedAt: new Date().toISOString(),
      };
      
      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);
      
      return updated;
    });

    setSelectedComponent(duplicated.id);
    toast.success('Component duplicated');
  }, [layout.components, historyIndex]);

  // Update layout settings
  const updateSettings = useCallback((settings: Partial<ReportLayout['settings']>) => {
    setLayout(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      setLayout(history[historyIndex]);
      setHistoryIndex(i => i - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      setLayout(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // Clear all components
  const clearAll = useCallback(() => {
    setLayout(prev => {
      const updated = {
        ...prev,
        components: [],
        updatedAt: new Date().toISOString(),
      };
      
      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);
      
      return updated;
    });

    setSelectedComponent(null);
    toast.success('All components cleared');
  }, [historyIndex]);

  // Save layout
  const saveLayout = useCallback(async (name?: string, description?: string) => {
    try {
      const layoutToSave = {
        ...layout,
        name: name || layout.name,
        description: description || layout.description,
        version: layout.version + 1,
        updatedAt: new Date().toISOString(),
      };

      // In a real implementation, this would save to the backend
      // For now, we'll just update the local state
      setLayout(layoutToSave);
      toast.success('Report layout saved');
      
      return layoutToSave;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save layout';
      toast.error(errorMessage);
      throw err;
    }
  }, [layout]);

  // Load layout
  const loadLayout = useCallback((newLayout: ReportLayout) => {
    setLayout(newLayout);
    setSelectedComponent(null);
    setHistory([]);
    setHistoryIndex(-1);
    toast.success('Report layout loaded');
  }, []);

  // Export layout as JSON
  const exportLayout = useCallback(() => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layout.name || 'report-layout'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Layout exported');
  }, [layout]);

  // Import layout from JSON
  const importLayout = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedLayout = JSON.parse(e.target?.result as string) as ReportLayout;
          loadLayout(importedLayout);
          resolve();
        } catch (err) {
          reject(new Error('Invalid layout file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [loadLayout]);

  // Get component by ID
  const getComponent = useCallback((componentId: string) => {
    return layout.components.find(c => c.id === componentId);
  }, [layout.components]);

  // Get selected component
  const getSelectedComponent = useCallback(() => {
    return selectedComponent ? getComponent(selectedComponent) : null;
  }, [selectedComponent, getComponent]);

  return {
    // State
    layout,
    selectedComponent,
    isDragging,
    isPreviewMode,
    componentTemplates,
    
    // Actions
    addComponent,
    updateComponent,
    removeComponent,
    duplicateComponent,
    updateSettings,
    setSelectedComponent,
    setIsDragging,
    setIsPreviewMode,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Utilities
    clearAll,
    saveLayout,
    loadLayout,
    exportLayout,
    importLayout,
    getComponent,
    getSelectedComponent,
  };
}