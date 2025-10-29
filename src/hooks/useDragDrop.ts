"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  UseDragDropReturn,
  DragStartHandler,
  DragEndHandler,
  DragOverHandler,
} from "@/src/types/drag-drop";

interface UseDragDropOptions {
  onDragStart?: DragStartHandler;
  onDragEnd?: DragEndHandler;
  onDragOver?: DragOverHandler;
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
}

export function useDragDrop<T extends { id: string }>(
  initialItems: T[],
  onReorder: (items: T[]) => void,
  options: UseDragDropOptions = {},
): UseDragDropReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Memoize activation constraint to prevent changing dependencies
  const activationConstraint = useMemo(
    () => options.activationConstraint || { distance: 8 },
    [options.activationConstraint],
  );

  // Use sensors directly - not inside useMemo to avoid hook violations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: activationConstraint.distance
        ? { distance: activationConstraint.distance }
        : undefined,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Memoize callbacks to prevent changing dependencies
  const memoizedOnDragStart = useMemo(
    () => options.onDragStart,
    [options.onDragStart],
  );
  const memoizedOnDragOver = useMemo(
    () => options.onDragOver,
    [options.onDragOver],
  );
  const memoizedOnDragEnd = useMemo(
    () => options.onDragEnd,
    [options.onDragEnd],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
      memoizedOnDragStart?.(event);
    },
    [memoizedOnDragStart],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      memoizedOnDragOver?.(event);
    },
    [memoizedOnDragOver],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          // Only update state if the items actually changed
          if (JSON.stringify(newItems) !== JSON.stringify(items)) {
            setItems(newItems);
            onReorder(newItems);
          }
        }
      }

      setActiveId(null);
      memoizedOnDragEnd?.(event);
    },
    [items, onReorder, memoizedOnDragEnd],
  );

  // Update items when initialItems change
  useEffect(() => {
    // Only update if items have actually changed to prevent infinite loops
    if (JSON.stringify(items) !== JSON.stringify(initialItems)) {
      setItems(initialItems);
    }
  }, [initialItems, items]);

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    activeId,
    items,
  };
}

// Hook for handling drag and drop between different containers
export function useDragDropContainers<
  T extends { id: string; containerId?: string },
>(
  initialItems: T[],
  onItemMove: (
    itemId: string,
    fromContainer: string,
    toContainer: string,
    position: number,
  ) => void,
  options: UseDragDropOptions = {},
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Memoize activation constraint to prevent changing dependencies
  const activationConstraint = useMemo(
    () => ({
      distance: options.activationConstraint?.distance || 8,
    }),
    [options.activationConstraint?.distance],
  );

  // Use sensors directly - not inside useMemo to avoid hook violations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Memoize callbacks to prevent changing dependencies
  const memoizedOnDragStart = useMemo(
    () => options.onDragStart,
    [options.onDragStart],
  );
  const memoizedOnDragOver = useMemo(
    () => options.onDragOver,
    [options.onDragOver],
  );
  const memoizedOnDragEnd = useMemo(
    () => options.onDragEnd,
    [options.onDragEnd],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
      memoizedOnDragStart?.(event);
    },
    [memoizedOnDragStart],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // Only handle drag over events, don't update state here
      // State updates should happen in handleDragEnd
      memoizedOnDragOver?.(event);
    },
    [memoizedOnDragOver],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeItem = items.find((item) => item.id === activeId);
      const overItem = items.find((item) => item.id === overId);

      if (!activeItem) {
        setActiveId(null);
        return;
      }

      const activeContainer = activeItem.containerId || "";
      const overContainer = overItem?.containerId || overId;

      if (activeContainer !== overContainer) {
        // Moving between containers
        const overIndex = overItem
          ? items.findIndex((item) => item.id === overId)
          : 0;
        onItemMove(activeId, activeContainer, overContainer, overIndex);
      } else if (activeId !== overId) {
        // Reordering within the same container
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          // Only update state if the items actually changed
          if (JSON.stringify(newItems) !== JSON.stringify(items)) {
            setItems(newItems);
          }
        }
      }

      setActiveId(null);
      memoizedOnDragEnd?.(event);
    },
    [items, onItemMove, memoizedOnDragEnd],
  );

  useEffect(() => {
    // Only update if items have actually changed to prevent infinite loops
    if (JSON.stringify(items) !== JSON.stringify(initialItems)) {
      setItems(initialItems);
    }
  }, [initialItems, items]);

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    activeId,
    items,
  };
}
