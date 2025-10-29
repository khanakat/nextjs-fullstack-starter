"use client";

import { useSortable } from "@dnd-kit/sortable";

import { UseSortableItemReturn } from "@/src/types/drag-drop";

interface UseSortableItemOptions {
  disabled?: boolean;
  animateLayoutChanges?: boolean;
  getNewIndex?: (args: {
    id: string;
    items: string[];
    activeIndex: number;
    overIndex: number;
  }) => number;
}

export function useSortableItem(
  id: string,
  options: UseSortableItemOptions = {},
): UseSortableItemReturn {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled: options.disabled,
  });

  return {
    attributes,
    listeners: listeners || {},
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  };
}

// Hook for sortable items with custom drag handle
export function useSortableItemWithHandle(
  id: string,
  handleId?: string,
  options: UseSortableItemOptions = {},
) {
  const sortable = useSortableItem(id, options);

  // Create separate listeners for the drag handle
  const handleListeners = handleId
    ? {
        ...sortable.listeners,
      }
    : undefined;

  return {
    ...sortable,
    handleListeners,
    // Remove listeners from the main element if using a handle
    listeners: handleId ? undefined : sortable.listeners,
  };
}

// Hook for sortable items in a grid layout
export function useSortableGridItem(
  id: string,
  options: UseSortableItemOptions & {
    resizable?: boolean;
    bounds?: {
      width: { min: number; max: number };
      height: { min: number; max: number };
    };
  } = {},
) {
  const sortable = useSortableItem(id, options);

  // Additional grid-specific functionality can be added here
  const gridStyle = {
    // Add grid-specific styles if needed
  };

  return {
    ...sortable,
    style: gridStyle,
    isResizable: options.resizable || false,
    bounds: options.bounds,
  };
}
