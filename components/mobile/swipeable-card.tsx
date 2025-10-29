"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Trash2, Archive, Star, Share } from "lucide-react";

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
}

interface SwipeableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  swipeThreshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

/**
 * Swipeable card component with customizable left and right actions
 */
export function SwipeableCard({
  children,
  className,
  leftActions = [],
  rightActions = [],
  swipeThreshold = 80,
  onSwipeStart,
  onSwipeEnd,
  disabled = false,
  hapticFeedback = true,
  ...props
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const initialTranslateX = useRef(0);

  const triggerHapticFeedback = useCallback(
    (intensity: "light" | "medium" | "heavy" = "light") => {
      if (!hapticFeedback || disabled) return;

      try {
        if ("vibrate" in navigator) {
          const patterns = {
            light: 10,
            medium: 50,
            heavy: 100,
          };
          navigator.vibrate(patterns[intensity]);
        }
      } catch (error) {
        // Silently fail if vibration is not supported
      }
    },
    [hapticFeedback, disabled],
  );

  const resetPosition = useCallback(() => {
    setIsAnimating(true);
    setTranslateX(0);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const executeAction = useCallback(
    (action: SwipeAction) => {
      triggerHapticFeedback("heavy");
      action.action();
      resetPosition();
    },
    [triggerHapticFeedback, resetPosition],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isAnimating) return;

      const touch = e.touches[0];
      startX.current = touch.clientX;
      currentX.current = touch.clientX;
      initialTranslateX.current = translateX;
      setIsDragging(true);
      onSwipeStart?.();
      triggerHapticFeedback("light");
    },
    [disabled, isAnimating, translateX, onSwipeStart, triggerHapticFeedback],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled || isAnimating) return;

      const touch = e.touches[0];
      currentX.current = touch.clientX;
      const deltaX = currentX.current - startX.current;
      const newTranslateX = initialTranslateX.current + deltaX;

      // Apply resistance at the edges
      const maxTranslate = 200;
      const resistance = 0.6;

      let finalTranslateX = newTranslateX;
      if (Math.abs(newTranslateX) > maxTranslate) {
        const excess = Math.abs(newTranslateX) - maxTranslate;
        const resistedExcess = excess * resistance;
        finalTranslateX =
          newTranslateX > 0
            ? maxTranslate + resistedExcess
            : -(maxTranslate + resistedExcess);
      }

      setTranslateX(finalTranslateX);

      // Provide haptic feedback at threshold
      if (
        Math.abs(finalTranslateX) >= swipeThreshold &&
        Math.abs(initialTranslateX.current) < swipeThreshold
      ) {
        triggerHapticFeedback("medium");
      }
    },
    [isDragging, disabled, isAnimating, swipeThreshold, triggerHapticFeedback],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;

    setIsDragging(false);
    onSwipeEnd?.();

    const finalDeltaX = currentX.current - startX.current;
    const absDeltaX = Math.abs(finalDeltaX);

    if (absDeltaX >= swipeThreshold) {
      const actions = finalDeltaX > 0 ? rightActions : leftActions;
      if (actions.length > 0) {
        // Execute the first action for now
        executeAction(actions[0]);
        return;
      }
    }

    // Reset to original position
    resetPosition();
  }, [
    isDragging,
    disabled,
    onSwipeEnd,
    swipeThreshold,
    rightActions,
    leftActions,
    executeAction,
    resetPosition,
  ]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || isAnimating) return;

      startX.current = e.clientX;
      currentX.current = e.clientX;
      initialTranslateX.current = translateX;
      setIsDragging(true);
      onSwipeStart?.();
    },
    [disabled, isAnimating, translateX, onSwipeStart],
  );

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        currentX.current = e.clientX;
        const deltaX = currentX.current - startX.current;
        const newTranslateX = initialTranslateX.current + deltaX;
        setTranslateX(newTranslateX);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        onSwipeEnd?.();
        resetPosition();
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }

    // Return undefined for other cases
    return undefined;
  }, [isDragging, onSwipeEnd, resetPosition]);

  const renderActions = (actions: SwipeAction[], side: "left" | "right") => {
    if (actions.length === 0) return null;

    const isVisible = side === "left" ? translateX > 0 : translateX < 0;
    const opacity = Math.min(Math.abs(translateX) / swipeThreshold, 1);

    return (
      <div
        className={cn(
          "absolute top-0 bottom-0 flex items-center justify-center",
          side === "left" ? "left-0" : "right-0",
          "transition-opacity duration-200",
        )}
        style={{
          width: Math.abs(translateX),
          opacity: isVisible ? opacity : 0,
        }}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className={cn(
                "flex flex-col items-center justify-center p-4 h-full",
                action.color,
              )}
              style={{ width: Math.abs(translateX) / actions.length }}
            >
              <Icon className="w-6 h-6 text-white mb-1" />
              <span className="text-xs text-white font-medium">
                {action.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Actions */}
      {renderActions(leftActions, "left")}

      {/* Right Actions */}
      {renderActions(rightActions, "right")}

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          "relative z-10 touch-manipulation select-none cursor-grab",
          isDragging && "cursor-grabbing",
          !isAnimating &&
            !isDragging &&
            "transition-transform duration-300 ease-out",
          className,
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {children}
      </Card>
    </div>
  );
}

/**
 * Pre-configured swipeable card with common actions
 */
export function SwipeableListItem({
  children,
  onDelete,
  onArchive,
  onFavorite,
  onShare,
  className,
  ...props
}: SwipeableCardProps & {
  onDelete?: () => void;
  onArchive?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}) {
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];

  if (onFavorite) {
    leftActions.push({
      id: "favorite",
      label: "Favorite",
      icon: Star,
      color: "bg-yellow-500",
      action: onFavorite,
    });
  }

  if (onShare) {
    leftActions.push({
      id: "share",
      label: "Share",
      icon: Share,
      color: "bg-blue-500",
      action: onShare,
    });
  }

  if (onArchive) {
    rightActions.push({
      id: "archive",
      label: "Archive",
      icon: Archive,
      color: "bg-gray-500",
      action: onArchive,
    });
  }

  if (onDelete) {
    rightActions.push({
      id: "delete",
      label: "Delete",
      icon: Trash2,
      color: "bg-red-500",
      action: onDelete,
    });
  }

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
      {...props}
    >
      {children}
    </SwipeableCard>
  );
}
