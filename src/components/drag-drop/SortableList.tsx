"use client";

import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableListProps } from "@/src/types/drag-drop";
import { useDragDrop } from "@/src/hooks/useDragDrop";
import { SortableItem } from "./SortableItem";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  direction = "vertical",
  disabled = false,
  className = "",
  itemClassName = "",
  dragHandleClassName = "",
}: SortableListProps<T>) {
  const {
    sensors,
    handleDragStart,
    handleDragEnd,
    activeId,
    items: currentItems,
  } = useDragDrop(items, onReorder);

  const strategy =
    direction === "vertical"
      ? verticalListSortingStrategy
      : horizontalListSortingStrategy;

  // Force explicit styles with inline styles as backup
  const containerStyle =
    direction === "horizontal"
      ? {
          display: "flex",
          flexDirection: "row" as const,
          gap: "8px",
          overflowX: "auto" as const,
        }
      : { display: "flex", flexDirection: "column" as const, gap: "8px" };

  const containerClasses =
    direction === "vertical"
      ? `flex flex-col space-y-2 ${className}`.trim()
      : `flex flex-row space-x-2 overflow-x-auto ${className}`.trim();

  // Determine item classes based on direction with !important for horizontal
  const directionItemClasses =
    direction === "horizontal"
      ? "min-w-[200px] flex-shrink-0 !block"
      : "w-full";

  const combinedItemClassName =
    `${directionItemClasses} ${itemClassName}`.trim();

  // Inline styles for items to force horizontal layout
  const itemStyle =
    direction === "horizontal"
      ? { minWidth: "200px", flexShrink: 0, display: "block" }
      : {};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={currentItems.map((item) => item.id)}
        strategy={strategy}
        disabled={disabled}
      >
        <div className={containerClasses} style={containerStyle}>
          {currentItems.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              disabled={disabled}
              className={combinedItemClassName}
              dragHandleClassName={dragHandleClassName}
              direction={direction}
              style={itemStyle}
            >
              {renderItem(item, index, activeId === item.id)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Preset configurations for common use cases
export function VerticalSortableList<T extends { id: string }>(
  props: Omit<SortableListProps<T>, "direction">,
) {
  return <SortableList {...props} direction="vertical" />;
}

export function HorizontalSortableList<T extends { id: string }>(
  props: Omit<SortableListProps<T>, "direction">,
) {
  return <SortableList {...props} direction="horizontal" />;
}
