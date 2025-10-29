"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TouchOptimizedButtonProps extends ButtonProps {
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  longPressDelay?: number;
  onLongPress?: () => void;
  loading?: boolean;
  touchScale?: boolean;
}

/**
 * Touch-optimized button with haptic feedback, ripple effects, and long press support
 */
export function TouchOptimizedButton({
  children,
  className,
  hapticFeedback = true,
  rippleEffect = true,
  longPressDelay = 500,
  onLongPress,
  onClick,
  loading = false,
  touchScale = true,
  disabled,
  ...props
}: TouchOptimizedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const rippleCounter = useRef(0);

  const triggerHapticFeedback = useCallback(
    (intensity: "light" | "medium" | "heavy" = "light") => {
      if (!hapticFeedback || disabled || loading) return;

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
    [hapticFeedback, disabled, loading],
  );

  const createRipple = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!rippleEffect || disabled || loading) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const rippleId = rippleCounter.current++;
      setRipples((prev) => [...prev, { id: rippleId, x, y }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== rippleId));
      }, 600);
    },
    [rippleEffect, disabled, loading],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || loading) return;

      setIsPressed(true);
      createRipple(event);
      triggerHapticFeedback("light");

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          triggerHapticFeedback("heavy");
          onLongPress();
        }, longPressDelay);
      }
    },
    [
      disabled,
      loading,
      createRipple,
      triggerHapticFeedback,
      onLongPress,
      longPressDelay,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (disabled || loading) return;

      setIsPressed(true);
      createRipple(event);
      triggerHapticFeedback("light");
    },
    [disabled, loading, createRipple, triggerHapticFeedback],
  );

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      triggerHapticFeedback("medium");
      onClick?.(event);
    },
    [disabled, loading, triggerHapticFeedback, onClick],
  );

  return (
    <Button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden transition-all duration-150 touch-manipulation select-none",
        "min-h-[44px] min-w-[44px]", // Minimum touch target size
        touchScale && isPressed && "scale-95",
        "active:scale-95",
        className,
      )}
      disabled={disabled || loading}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-20" />
        </span>
      ))}

      {/* Content */}
      <span
        className={cn(
          "flex items-center justify-center gap-2",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>

      {/* Loading Spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
    </Button>
  );
}

/**
 * Touch-optimized icon button
 */
export function TouchOptimizedIconButton({
  icon: Icon,
  label,
  className,
  ...props
}: TouchOptimizedButtonProps & {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
}) {
  return (
    <TouchOptimizedButton
      className={cn("w-12 h-12 p-0 rounded-full", className)}
      aria-label={label}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </TouchOptimizedButton>
  );
}

/**
 * Touch-optimized floating action button
 */
export function TouchOptimizedFAB({
  icon: Icon,
  label,
  className,
  position = "bottom-right",
  ...props
}: TouchOptimizedButtonProps & {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  const positionClasses = {
    "bottom-right": "fixed bottom-20 right-4 md:bottom-6 md:right-6",
    "bottom-left": "fixed bottom-20 left-4 md:bottom-6 md:left-6",
    "top-right": "fixed top-20 right-4 md:top-6 md:right-6",
    "top-left": "fixed top-20 left-4 md:top-6 md:left-6",
  };

  return (
    <TouchOptimizedButton
      className={cn(
        "w-14 h-14 rounded-full shadow-lg z-40",
        "bg-blue-600 hover:bg-blue-700 text-white",
        "dark:bg-blue-500 dark:hover:bg-blue-600",
        positionClasses[position],
        className,
      )}
      aria-label={label}
      {...props}
    >
      <Icon className="w-6 h-6" />
    </TouchOptimizedButton>
  );
}
