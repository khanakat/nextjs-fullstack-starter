"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Keyboard } from "lucide-react";

// Types
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category?: string;
  action: () => void;
  disabled?: boolean;
  global?: boolean;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  executeShortcut: (id: string) => void;
  isShortcutPressed: (keys: string[]) => boolean;
}

// Context
const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextType | null>(null);

// Hook
export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within a KeyboardShortcutsProvider",
    );
  }
  return context;
}

// Hook for individual shortcuts
export function useShortcut(
  keys: string[],
  action: () => void,
  options: {
    disabled?: boolean;
    global?: boolean;
    description?: string;
    category?: string;
  } = {},
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const shortcutId = `shortcut-${keys.join("-")}-${Date.now()}`;

  useEffect(() => {
    const shortcut: KeyboardShortcut = {
      id: shortcutId,
      keys,
      action,
      description: options.description || `${keys.join(" + ")} shortcut`,
      category: options.category || "General",
      disabled: options.disabled,
      global: options.global,
    };

    registerShortcut(shortcut);

    return () => {
      unregisterShortcut(shortcutId);
    };
  }, [
    keys,
    action,
    options.disabled,
    options.global,
    options.description,
    options.category,
    registerShortcut,
    unregisterShortcut,
    shortcutId,
  ]);

  return shortcutId;
}

// Utility functions
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    Control: "ctrl",
    Meta: "cmd",
    Alt: "alt",
    Shift: "shift",
    " ": "space",
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Escape: "esc",
    Enter: "enter",
    Backspace: "backspace",
    Delete: "delete",
    Tab: "tab",
  };

  return keyMap[key] || key.toLowerCase();
}

function formatKeyForDisplay(key: string): string {
  const displayMap: Record<string, string> = {
    ctrl: "⌃",
    cmd: "⌘",
    alt: "⌥",
    shift: "⇧",
    space: "Space",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    esc: "Esc",
    enter: "↵",
    backspace: "⌫",
    delete: "⌦",
    tab: "⇥",
  };

  return displayMap[key] || key.toUpperCase();
}

function matchesShortcut(
  pressedKeys: Set<string>,
  shortcutKeys: string[],
): boolean {
  if (pressedKeys.size !== shortcutKeys.length) return false;

  return shortcutKeys.every((key) => pressedKeys.has(normalizeKey(key)));
}

// Provider Component
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => [
      ...prev.filter((s) => s.id !== shortcut.id),
      shortcut,
    ]);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const executeShortcut = useCallback(
    (id: string) => {
      const shortcut = shortcuts.find((s) => s.id === id);
      if (shortcut && !shortcut.disabled) {
        shortcut.action();
      }
    },
    [shortcuts],
  );

  const isShortcutPressed = useCallback(
    (keys: string[]): boolean => {
      return matchesShortcut(pressedKeys, keys);
    },
    [pressedKeys],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = normalizeKey(e.key);
      setPressedKeys((prev) => new Set([...prev, key]));

      // Check for matching shortcuts
      const newPressedKeys = new Set([...pressedKeys, key]);

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        if (matchesShortcut(newPressedKeys, shortcut.keys)) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, pressedKeys],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = normalizeKey(e.key);
    setPressedKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Clear pressed keys when window loses focus
  useEffect(() => {
    const handleBlur = () => setPressedKeys(new Set());
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const contextValue: KeyboardShortcutsContextType = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    executeShortcut,
    isShortcutPressed,
  };

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

// Keyboard Shortcut Display Component
export function KeyboardShortcutBadge({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
          <Badge variant="outline" className="px-1.5 py-0.5 text-xs font-mono">
            {formatKeyForDisplay(key)}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );
}

// Shortcuts Help Dialog
export function ShortcutsHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { shortcuts } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState("");

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (groups, shortcut) => {
      const category = shortcut.category || "General";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  // Filter shortcuts based on search
  const filteredGroups = Object.entries(groupedShortcuts).reduce(
    (filtered, [category, categoryShortcuts]) => {
      const matchingShortcuts = categoryShortcuts.filter(
        (shortcut) =>
          shortcut.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          shortcut.keys.some((key) =>
            key.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );

      if (matchingShortcuts.length > 0) {
        filtered[category] = matchingShortcuts;
      }

      return filtered;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Shortcuts List */}
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {Object.entries(filteredGroups).map(
                ([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className={cn(
                            "flex items-center justify-between py-2 px-3 rounded-md",
                            shortcut.disabled && "opacity-50",
                          )}
                        >
                          <span className="text-sm">
                            {shortcut.description}
                          </span>
                          <KeyboardShortcutBadge keys={shortcut.keys} />
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ),
              )}

              {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shortcuts found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Shortcut Recorder Component
export function ShortcutRecorder({
  onShortcutRecorded,
  placeholder = "Press keys...",
  className,
}: {
  onShortcutRecorded: (keys: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return;

      e.preventDefault();
      e.stopPropagation();

      const key = normalizeKey(e.key);
      setRecordedKeys((prev) => {
        const newKeys = [...prev];
        if (!newKeys.includes(key)) {
          newKeys.push(key);
        }
        return newKeys;
      });
    },
    [isRecording],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return;

      e.preventDefault();
      e.stopPropagation();

      // Finish recording when all keys are released
      setTimeout(() => {
        if (recordedKeys.length > 0) {
          onShortcutRecorded(recordedKeys);
          setRecordedKeys([]);
          setIsRecording(false);
        }
      }, 100);
    },
    [isRecording, recordedKeys, onShortcutRecorded],
  );

  useEffect(() => {
    if (isRecording) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
      };
    }
    return undefined;
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordedKeys([]);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordedKeys([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
          isRecording
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50",
        )}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {recordedKeys.length > 0 ? (
          <KeyboardShortcutBadge keys={recordedKeys} />
        ) : (
          <span
            className={cn(
              "text-sm",
              isRecording ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isRecording ? "Recording... (press keys)" : placeholder}
          </span>
        )}

        <Badge variant={isRecording ? "default" : "outline"}>
          {isRecording ? "Recording" : "Click to record"}
        </Badge>
      </div>

      {isRecording && (
        <p className="text-xs text-muted-foreground">
          Press the key combination you want to record, then release all keys.
        </p>
      )}
    </div>
  );
}

// Default shortcuts
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: "help",
    keys: ["?"],
    description: "Show keyboard shortcuts",
    category: "General",
    action: () => {},
  },
  {
    id: "search",
    keys: ["ctrl", "k"],
    description: "Open command palette",
    category: "Navigation",
    action: () => {},
  },
  {
    id: "new",
    keys: ["ctrl", "n"],
    description: "Create new item",
    category: "Actions",
    action: () => {},
  },
  {
    id: "save",
    keys: ["ctrl", "s"],
    description: "Save current item",
    category: "Actions",
    action: () => {},
  },
  {
    id: "undo",
    keys: ["ctrl", "z"],
    description: "Undo last action",
    category: "Actions",
    action: () => {},
  },
  {
    id: "redo",
    keys: ["ctrl", "shift", "z"],
    description: "Redo last action",
    category: "Actions",
    action: () => {},
  },
];
