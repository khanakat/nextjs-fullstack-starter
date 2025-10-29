"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Copy,
  Scissors as Cut,
  ClipboardPaste as Paste,
  Trash2 as Delete,
  Edit,
  Eye,
  Download,
  Share,
  Star,
} from "lucide-react";

// Types
export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  action: () => void;
}

export interface ContextMenuGroup {
  id: string;
  label?: string;
  actions: ContextMenuAction[];
}

export interface ContextMenuSubmenu {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  items: (ContextMenuAction | ContextMenuGroup | ContextMenuSubmenu)[];
}

export interface ContextMenuCheckbox {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface ContextMenuRadio {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ContextMenuRadioGroup {
  id: string;
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  items: ContextMenuRadio[];
}

export type ContextMenuItem =
  | ContextMenuAction
  | ContextMenuGroup
  | ContextMenuSubmenu
  | ContextMenuCheckbox
  | ContextMenuRadioGroup
  | "separator";

export interface AdvancedContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  className?: string;
  disabled?: boolean;
}

// Utility functions
function isAction(item: ContextMenuItem): item is ContextMenuAction {
  return typeof item === "object" && "action" in item;
}

function isGroup(item: ContextMenuItem): item is ContextMenuGroup {
  return typeof item === "object" && "actions" in item;
}

function isSubmenu(item: ContextMenuItem): item is ContextMenuSubmenu {
  return typeof item === "object" && "items" in item && !("actions" in item);
}

function isCheckbox(item: ContextMenuItem): item is ContextMenuCheckbox {
  return typeof item === "object" && "checked" in item;
}

function isRadioGroup(item: ContextMenuItem): item is ContextMenuRadioGroup {
  return typeof item === "object" && "value" in item && "onValueChange" in item;
}

// Context Menu Item Renderer
function renderContextMenuItem(item: ContextMenuItem): React.ReactNode {
  if (item === "separator") {
    return <ContextMenuSeparator key="separator" />;
  }

  if (isAction(item)) {
    const IconComponent = item.icon;
    return (
      <ContextMenuItem
        key={item.id}
        disabled={item.disabled}
        className={cn(
          item.destructive && "text-destructive focus:text-destructive",
        )}
        onClick={item.action}
      >
        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
        {item.label}
        {item.shortcut && (
          <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
        )}
      </ContextMenuItem>
    );
  }

  if (isGroup(item)) {
    return (
      <React.Fragment key={item.id}>
        {item.label && <ContextMenuLabel>{item.label}</ContextMenuLabel>}
        {item.actions.map((action) => renderContextMenuItem(action))}
      </React.Fragment>
    );
  }

  if (isSubmenu(item)) {
    const IconComponent = item.icon;
    return (
      <ContextMenuSub key={item.id}>
        <ContextMenuSubTrigger disabled={item.disabled}>
          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
          {item.label}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {item.items.map((subItem) => renderContextMenuItem(subItem))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    );
  }

  if (isCheckbox(item)) {
    return (
      <ContextMenuCheckboxItem
        key={item.id}
        checked={item.checked}
        disabled={item.disabled}
        onCheckedChange={item.onCheckedChange}
      >
        {item.label}
      </ContextMenuCheckboxItem>
    );
  }

  if (isRadioGroup(item)) {
    return (
      <React.Fragment key={item.id}>
        {item.label && <ContextMenuLabel>{item.label}</ContextMenuLabel>}
        <ContextMenuRadioGroup
          value={item.value}
          onValueChange={item.onValueChange}
        >
          {item.items.map((radioItem) => (
            <ContextMenuRadioItem
              key={radioItem.id}
              value={radioItem.value}
              disabled={radioItem.disabled}
            >
              {radioItem.label}
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
      </React.Fragment>
    );
  }

  return null;
}

// Advanced Context Menu Component
export function AdvancedContextMenu({
  children,
  items,
  className,
  disabled = false,
}: AdvancedContextMenuProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenuPrimitive>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {items.map((item) => renderContextMenuItem(item))}
      </ContextMenuContent>
    </ContextMenuPrimitive>
  );
}

// Preset Context Menus
export function FileContextMenu({
  children,
  fileName,
  onAction,
  className,
}: {
  children: React.ReactNode;
  fileName: string;
  onAction: (action: string, fileName: string) => void;
  className?: string;
}) {
  const items: ContextMenuItem[] = [
    {
      id: "open",
      label: "Open",
      icon: Eye,
      action: () => onAction("open", fileName),
    },
    "separator",
    {
      id: "cut",
      label: "Cut",
      icon: Cut,
      shortcut: "⌘X",
      action: () => onAction("cut", fileName),
    },
    {
      id: "copy",
      label: "Copy",
      icon: Copy,
      shortcut: "⌘C",
      action: () => onAction("copy", fileName),
    },
    {
      id: "paste",
      label: "Paste",
      icon: Paste,
      shortcut: "⌘V",
      action: () => onAction("paste", fileName),
    },
    "separator",
    {
      id: "rename",
      label: "Rename",
      icon: Edit,
      action: () => onAction("rename", fileName),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Delete,
      destructive: true,
      action: () => onAction("delete", fileName),
    },
    "separator",
    {
      id: "share",
      label: "Share",
      icon: Share,
      items: [
        {
          id: "share-link",
          label: "Copy Link",
          action: () => onAction("share-link", fileName),
        },
        {
          id: "share-email",
          label: "Send via Email",
          action: () => onAction("share-email", fileName),
        },
      ],
    },
    {
      id: "download",
      label: "Download",
      icon: Download,
      action: () => onAction("download", fileName),
    },
  ];

  return (
    <AdvancedContextMenu items={items} className={className}>
      {children}
    </AdvancedContextMenu>
  );
}

export function TableRowContextMenu({
  children,
  rowData,
  onAction,
  className,
}: {
  children: React.ReactNode;
  rowData: any;
  onAction: (action: string, data: any) => void;
  className?: string;
}) {
  const items: ContextMenuItem[] = [
    {
      id: "view",
      label: "View Details",
      icon: Eye,
      action: () => onAction("view", rowData),
    },
    {
      id: "edit",
      label: "Edit",
      icon: Edit,
      action: () => onAction("edit", rowData),
    },
    "separator",
    {
      id: "copy",
      label: "Copy",
      icon: Copy,
      items: [
        {
          id: "copy-id",
          label: "Copy ID",
          action: () => onAction("copy-id", rowData),
        },
        {
          id: "copy-row",
          label: "Copy Row",
          action: () => onAction("copy-row", rowData),
        },
        {
          id: "copy-json",
          label: "Copy as JSON",
          action: () => onAction("copy-json", rowData),
        },
      ],
    },
    "separator",
    {
      id: "favorite",
      label: "Add to Favorites",
      icon: Star,
      action: () => onAction("favorite", rowData),
    },
    "separator",
    {
      id: "delete",
      label: "Delete",
      icon: Delete,
      destructive: true,
      action: () => onAction("delete", rowData),
    },
  ];

  return (
    <AdvancedContextMenu items={items} className={className}>
      {children}
    </AdvancedContextMenu>
  );
}

export function TextContextMenu({
  children,
  selectedText,
  onAction,
  className,
}: {
  children: React.ReactNode;
  selectedText?: string;
  onAction: (action: string, text?: string) => void;
  className?: string;
}) {
  const hasSelection = selectedText && selectedText.length > 0;

  const items: ContextMenuItem[] = [
    {
      id: "cut",
      label: "Cut",
      icon: Cut,
      shortcut: "⌘X",
      disabled: !hasSelection,
      action: () => onAction("cut", selectedText),
    },
    {
      id: "copy",
      label: "Copy",
      icon: Copy,
      shortcut: "⌘C",
      disabled: !hasSelection,
      action: () => onAction("copy", selectedText),
    },
    {
      id: "paste",
      label: "Paste",
      icon: Paste,
      shortcut: "⌘V",
      action: () => onAction("paste"),
    },
    "separator",
    {
      id: "select-all",
      label: "Select All",
      shortcut: "⌘A",
      action: () => onAction("select-all"),
    },
  ];

  if (hasSelection) {
    items.push("separator", {
      id: "search",
      label: `Search for "${selectedText.slice(0, 20)}${selectedText.length > 20 ? "..." : ""}"`,
      action: () => onAction("search", selectedText),
    });
  }

  return (
    <AdvancedContextMenu items={items} className={className}>
      {children}
    </AdvancedContextMenu>
  );
}

// Custom Hook for Context Menu
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [items, setItems] = useState<ContextMenuItem[]>([]);

  const showContextMenu = useCallback(
    (event: React.MouseEvent, menuItems: ContextMenuItem[]) => {
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
      setItems(menuItems);
      setIsOpen(true);
    },
    [],
  );

  const hideContextMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    position,
    items,
    showContextMenu,
    hideContextMenu,
  };
}

// Portal Context Menu (for custom positioning)
export function PortalContextMenu({
  isOpen,
  position,
  items,
  onClose,
}: {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item) => renderContextMenuItem(item))}
    </div>
  );
}
