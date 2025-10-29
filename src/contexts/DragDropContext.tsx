"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  DragDropContextType,
  AccessibilityConfig,
  DragDropConfig,
} from "@/src/types/drag-drop";

// Default accessibility configuration
const defaultAccessibilityConfig: AccessibilityConfig = {
  announcements: {
    onDragStart: (id: string) => `Picked up draggable item ${id}`,
    onDragOver: (id: string, overId: string) =>
      `Draggable item ${id} was moved over droppable area ${overId}`,
    onDragEnd: (id: string, overId: string) =>
      `Draggable item ${id} was dropped over droppable area ${overId}`,
    onDragCancel: (id: string) =>
      `Dragging was cancelled. Draggable item ${id} was dropped`,
  },
  screenReaderInstructions: {
    draggable:
      "To pick up a draggable item, press the space bar. While dragging, use the arrow keys to move the item. Press space again to drop the item in its new position, or press escape to cancel.",
    droppable: "This is a droppable area. Dragged items can be dropped here.",
  },
};

// Create the context
const DragDropContext = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: ReactNode;
  config?: Partial<DragDropConfig>;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

export function DragDropProvider({
  children,
  config,
  onDragStart,
  onDragEnd,
  onDragOver,
}: DragDropProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverlay, setDragOverlay] = useState<ReactNode | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Use provided collision detection or default to closestCenter
  const collisionDetection: CollisionDetection =
    config?.collisionDetection || closestCenter;

  // Merge accessibility config with defaults
  const accessibility: AccessibilityConfig = {
    ...defaultAccessibilityConfig,
    ...config?.accessibility,
    announcements: {
      ...defaultAccessibilityConfig.announcements,
      ...config?.accessibility?.announcements,
    },
    screenReaderInstructions: {
      ...defaultAccessibilityConfig.screenReaderInstructions,
      ...config?.accessibility?.screenReaderInstructions,
    },
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverlay(null);
    onDragEnd?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    onDragOver?.(event);
  };

  const contextValue: DragDropContextType = {
    activeId,
    dragOverlay,
    sensors: config?.sensors || sensors,
    collisionDetection,
    accessibility,
    setActiveId,
    setDragOverlay,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={config?.sensors || sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {children}
        <DragOverlay>{dragOverlay}</DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
}

// Hook to use the drag drop context
export function useDragDropContext(): DragDropContextType {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error(
      "useDragDropContext must be used within a DragDropProvider",
    );
  }
  return context;
}

// Higher-order component for wrapping components with drag drop functionality
export function withDragDrop<P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<DragDropConfig>,
) {
  return function WrappedComponent(props: P) {
    return (
      <DragDropProvider config={config}>
        <Component {...props} />
      </DragDropProvider>
    );
  };
}
