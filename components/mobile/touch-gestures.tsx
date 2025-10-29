"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: "up" | "down" | "left" | "right";
  distance: number;
  velocity: number;
  duration: number;
}

interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
}

interface TouchGesturesProps {
  children: React.ReactNode;
  className?: string;
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  onPan?: (delta: { x: number; y: number }, point: TouchPoint) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  hapticFeedback?: boolean;
  disabled?: boolean;
}

/**
 * Touch gesture recognition wrapper component
 */
export function TouchGestures({
  children,
  className,
  onSwipe,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  onPan,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  hapticFeedback = true,
  disabled = false,
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const initialDistance = useRef<number>(0);
  const initialCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

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

  const getTouchPoint = useCallback(
    (touch: React.Touch): TouchPoint => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    }),
    [],
  );

  const getDistance = useCallback(
    (touch1: React.Touch, touch2: React.Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    [],
  );

  const getCenter = useCallback(
    (touch1: React.Touch, touch2: React.Touch) => ({
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }),
    [],
  );

  const calculateSwipeDirection = useCallback(
    (start: TouchPoint, end: TouchPoint): SwipeGesture["direction"] => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
      } else {
        return dy > 0 ? "down" : "up";
      }
    },
    [],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touches = e.touches;

      if (touches.length === 1) {
        // Single touch
        const touch = getTouchPoint(touches[0]);
        touchStart.current = touch;
        touchEnd.current = null;

        triggerHapticFeedback("light");

        // Start long press timer
        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            if (touchStart.current) {
              triggerHapticFeedback("heavy");
              onLongPress(touchStart.current);
            }
          }, longPressDelay);
        }
      } else if (touches.length === 2) {
        // Two finger touch (pinch)
        setIsPinching(true);
        initialDistance.current = getDistance(touches[0], touches[1]);
        initialCenter.current = getCenter(touches[0], touches[1]);

        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = undefined;
        }
      }
    },
    [
      disabled,
      getTouchPoint,
      onLongPress,
      longPressDelay,
      triggerHapticFeedback,
      getDistance,
      getCenter,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touches = e.touches;

      if (touches.length === 1 && touchStart.current) {
        // Single touch move (pan)
        const currentTouch = getTouchPoint(touches[0]);
        const deltaX = currentTouch.x - touchStart.current.x;
        const deltaY = currentTouch.y - touchStart.current.y;

        // Clear long press timer on movement
        if (
          longPressTimer.current &&
          (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
        ) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = undefined;
        }

        if (onPan && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          setIsPanning(true);
          onPan({ x: deltaX, y: deltaY }, currentTouch);
        }
      } else if (touches.length === 2 && isPinching) {
        // Two finger move (pinch)
        const currentDistance = getDistance(touches[0], touches[1]);
        const currentCenter = getCenter(touches[0], touches[1]);
        const scale = currentDistance / initialDistance.current;

        if (onPinch) {
          onPinch({ scale, center: currentCenter });
        }
      }
    },
    [
      disabled,
      getTouchPoint,
      onPan,
      isPinching,
      onPinch,
      getDistance,
      getCenter,
    ],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }

      const touches = e.changedTouches;

      if (
        touches.length === 1 &&
        touchStart.current &&
        !isPanning &&
        !isPinching
      ) {
        const touch = getTouchPoint(touches[0]);
        touchEnd.current = touch;

        const distance = Math.sqrt(
          Math.pow(touch.x - touchStart.current.x, 2) +
            Math.pow(touch.y - touchStart.current.y, 2),
        );
        const duration = touch.timestamp - touchStart.current.timestamp;

        if (distance >= swipeThreshold) {
          // Swipe gesture
          const velocity = distance / duration;
          const direction = calculateSwipeDirection(touchStart.current, touch);

          if (onSwipe) {
            triggerHapticFeedback("medium");
            onSwipe({ direction, distance, velocity, duration });
          }
        } else {
          // Tap gesture
          const now = Date.now();

          if (
            lastTap.current &&
            now - lastTap.current.timestamp < doubleTapDelay &&
            Math.abs(touch.x - lastTap.current.x) < 20 &&
            Math.abs(touch.y - lastTap.current.y) < 20
          ) {
            // Double tap
            if (onDoubleTap) {
              triggerHapticFeedback("medium");
              onDoubleTap(touch);
            }
            lastTap.current = null;
          } else {
            // Single tap
            if (onTap) {
              triggerHapticFeedback("light");
              onTap(touch);
            }
            lastTap.current = touch;
          }
        }
      }

      // Reset states
      if (e.touches.length === 0) {
        setIsPanning(false);
        setIsPinching(false);
        touchStart.current = null;
        touchEnd.current = null;
      }
    },
    [
      disabled,
      getTouchPoint,
      isPanning,
      isPinching,
      swipeThreshold,
      calculateSwipeDirection,
      onSwipe,
      triggerHapticFeedback,
      doubleTapDelay,
      onDoubleTap,
      onTap,
    ],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("touch-manipulation select-none", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

/**
 * Hook for gesture recognition
 */
export function useGestures({
  onSwipe,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  onPan,
}: Omit<TouchGesturesProps, "children" | "className">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Add touch event listeners
    const handleTouchStart = () => {
      // Implementation would be similar to the component version
      // but adapted for direct DOM manipulation
    };

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
    };
  }, [onSwipe, onPinch, onTap, onDoubleTap, onLongPress, onPan]);

  return ref;
}

/**
 * Simple swipe detector hook
 */
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50,
) {
  const handleSwipe = useCallback(
    (gesture: SwipeGesture) => {
      switch (gesture.direction) {
        case "left":
          onSwipeLeft?.();
          break;
        case "right":
          onSwipeRight?.();
          break;
        case "up":
          onSwipeUp?.();
          break;
        case "down":
          onSwipeDown?.();
          break;
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown],
  );

  return {
    onSwipe: handleSwipe,
    swipeThreshold: threshold,
  };
}
