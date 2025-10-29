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
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DragDropContextType } from "@/src/types/drag-drop";

interface DragDropProviderProps {
  children: ReactNode;
}

const DragDropContext = createContext<DragDropContextType | undefined>(
  undefined,
);

export function DragDropProvider({ children }: DragDropProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverlay, setDragOverlay] = useState<ReactNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const accessibility = {
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Set drag overlay content based on the active item
    const activeElement = document.querySelector(`[data-id="${active.id}"]`);
    if (activeElement) {
      setDragOverlay(
        <div className="opacity-80 transform rotate-3 scale-105">
          {activeElement.cloneNode(true) as any}
        </div>,
      );
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveId(null);
    setDragOverlay(null);
  };

  const contextValue: DragDropContextType = {
    activeId,
    dragOverlay,
    sensors,
    collisionDetection: closestCenter,
    accessibility,
    setActiveId,
    setDragOverlay,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>{dragOverlay}</DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
}

export function useDragDropContext() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error(
      "useDragDropContext must be used within a DragDropProvider",
    );
  }
  return context;
}
