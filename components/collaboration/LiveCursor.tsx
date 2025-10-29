import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCollaboration } from "./CollaborationProvider";
import { CursorPosition } from "@/lib/collaboration/event-service";
import { cn } from "@/lib/utils";

interface LiveCursorProps {
  documentId: string;
  className?: string;
  containerRef?: React.RefObject<HTMLElement>;
}

interface CursorDisplayProps {
  cursor: CursorPosition;
  color: string;
  containerRef?: React.RefObject<HTMLElement>;
}

// Predefined colors for different users
const CURSOR_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
];

function CursorDisplay({ cursor, color, containerRef }: CursorDisplayProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef?.current) return;

    const container = containerRef.current;
    const updatePosition = () => {
      try {
        // For text editors, we need to calculate position based on text position
        // This is a simplified version - in a real implementation, you'd need
        // to work with the specific editor's API (like Monaco, CodeMirror, etc.)

        if (container.tagName === "TEXTAREA" || container.tagName === "INPUT") {
          // Handle textarea/input elements
          const element = container as HTMLTextAreaElement | HTMLInputElement;
          const textBeforeCursor = element.value.substring(0, cursor.position);
          const lines = textBeforeCursor.split("\n");
          const currentLine = lines.length - 1;
          const currentColumn = lines[lines.length - 1].length;

          // Approximate position calculation
          const lineHeight = 20; // Approximate line height
          const charWidth = 8; // Approximate character width

          setPosition({
            x: currentColumn * charWidth,
            y: currentLine * lineHeight,
          });
        } else {
          // Handle contentEditable or other elements
          const range = document.createRange();
          const selection = window.getSelection();

          if (selection && container.firstChild) {
            try {
              range.setStart(
                container.firstChild,
                Math.min(cursor.position, container.textContent?.length || 0),
              );
              range.collapse(true);

              const rect = range.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();

              setPosition({
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
              });
            } catch (error) {
              // Fallback to approximate position
              setPosition({
                x: (cursor.position % 50) * 8, // Approximate
                y: Math.floor(cursor.position / 50) * 20, // Approximate
              });
            }
          }
        }

        setIsVisible(true);
      } catch (error) {
        console.error("Error calculating cursor position:", error);
        setIsVisible(false);
      }
    };

    updatePosition();

    // Update position when container content changes
    const observer = new MutationObserver(updatePosition);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Update position on scroll/resize
    const handleScroll = () => updatePosition();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [cursor.position, containerRef]);

  // Hide cursor after 5 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [cursor.timestamp]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className="absolute pointer-events-none z-50 transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-1px)",
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: color }}
      />

      {/* User label */}
      <div
        className="absolute top-0 left-2 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap transform -translate-y-full"
        style={{ backgroundColor: color }}
      >
        User {cursor.userId.slice(0, 8)}
      </div>

      {/* Selection highlight */}
      {cursor.selection && cursor.selection.start !== cursor.selection.end && (
        <div
          className="absolute opacity-30 rounded"
          style={{
            backgroundColor: color,
            left: 0,
            top: 0,
            width: Math.abs(cursor.selection.end - cursor.selection.start) * 8, // Approximate
            height: 20, // Line height
          }}
        />
      )}
    </div>
  );
}

export function LiveCursor({
  documentId,
  className,
  containerRef,
}: LiveCursorProps) {
  const { cursors } = useCollaboration();

  // Filter cursors for this document
  const documentCursors = cursors.filter(
    (cursor) => cursor.documentId === documentId,
  );

  // Assign colors to users consistently
  const getUserColor = (userId: string) => {
    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CURSOR_COLORS[hash % CURSOR_COLORS.length];
  };

  if (!containerRef?.current) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {documentCursors.map((cursor) => (
        <CursorDisplay
          key={cursor.userId}
          cursor={cursor}
          color={getUserColor(cursor.userId)}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}

interface TypingIndicatorProps {
  documentId: string;
  className?: string;
}

export function TypingIndicator({
  documentId,
  className,
}: TypingIndicatorProps) {
  const { typingUsers } = useCollaboration();

  // Filter typing indicators for this document
  const documentTyping = typingUsers.filter(
    (typing) => typing.documentId === documentId && typing.isTyping,
  );

  if (documentTyping.length === 0) {
    return null;
  }

  const getUserColor = (userId: string) => {
    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CURSOR_COLORS[hash % CURSOR_COLORS.length];
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {documentTyping.slice(0, 3).map((typing, index) => (
          <div
            key={typing.userId}
            className="flex items-center gap-1"
            style={{ color: getUserColor(typing.userId) }}
          >
            {index > 0 && <span className="text-muted-foreground">,</span>}
            <span className="font-medium">
              User {typing.userId.slice(0, 8)}
            </span>
          </div>
        ))}

        {documentTyping.length > 3 && (
          <span className="text-muted-foreground">
            and {documentTyping.length - 3} other
            {documentTyping.length - 3 > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <span className="text-muted-foreground">
        {documentTyping.length === 1 ? "is" : "are"} typing
      </span>

      {/* Animated dots */}
      <div className="flex gap-1">
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-1 h-1 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

interface CollaborativeTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  documentId: string;
  onCursorChange?: (
    position: number,
    selection?: { start: number; end: number },
  ) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function CollaborativeTextArea({
  documentId,
  onCursorChange,
  onTypingChange,
  className,
  ...props
}: CollaborativeTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateCursor, setTyping } = useCollaboration();
  const [isTyping, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selection = start !== end ? { start, end } : undefined;

    updateCursor(documentId, start, selection);
    onCursorChange?.(start, selection);
  }, [documentId, updateCursor, onCursorChange]);

  const handleInput = useCallback(() => {
    if (!isTyping) {
      setIsTypingState(true);
      setTyping(documentId, true);
      onTypingChange?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      setTyping(documentId, false);
      onTypingChange?.(false);
    }, 1000);
  }, [isTyping, documentId, setTyping, onTypingChange]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener("selectionchange", handleSelectionChange);
    textarea.addEventListener("click", handleSelectionChange);
    textarea.addEventListener("keyup", handleSelectionChange);

    return () => {
      textarea.removeEventListener("selectionchange", handleSelectionChange);
      textarea.removeEventListener("click", handleSelectionChange);
      textarea.removeEventListener("keyup", handleSelectionChange);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [handleSelectionChange]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={cn("relative", className)}
        onInput={handleInput}
        {...props}
      />

      <LiveCursor
        documentId={documentId}
        containerRef={textareaRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
