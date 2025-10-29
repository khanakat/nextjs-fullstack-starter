"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  className?: string;
  hapticFeedback?: boolean;
}

/**
 * Pull-to-refresh component for mobile interfaces
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  maxPullDistance = 120,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
  className,
  hapticFeedback = true,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(true);

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

  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    isAtTop.current = container.scrollTop === 0;
  }, []);

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;

    setIsRefreshing(true);
    triggerHapticFeedback("heavy");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
      setCanRefresh(false);
    }
  }, [disabled, isRefreshing, onRefresh, triggerHapticFeedback]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !isAtTop.current) return;

      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      checkScrollPosition();
    },
    [disabled, isRefreshing, checkScrollPosition],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !isAtTop.current) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault();

        setIsPulling(true);

        // Apply resistance curve
        const resistance = 0.5;
        const distance = Math.min(deltaY * resistance, maxPullDistance);
        setPullDistance(distance);

        const wasCanRefresh = canRefresh;
        const nowCanRefresh = distance >= threshold;
        setCanRefresh(nowCanRefresh);

        // Haptic feedback when crossing threshold
        if (nowCanRefresh && !wasCanRefresh) {
          triggerHapticFeedback("medium");
        }
      }
    },
    [
      disabled,
      isRefreshing,
      threshold,
      maxPullDistance,
      canRefresh,
      triggerHapticFeedback,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || isRefreshing || !isPulling) return;

    if (canRefresh) {
      handleRefresh();
    } else {
      // Reset position
      setPullDistance(0);
      setIsPulling(false);
      setCanRefresh(false);
    }
  }, [disabled, isRefreshing, isPulling, canRefresh, handleRefresh]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkScrollPosition]);

  // Reset state when disabled changes
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      setIsPulling(false);
      setCanRefresh(false);
    }
  }, [disabled]);

  const getIndicatorText = () => {
    if (isRefreshing) return refreshingText;
    if (canRefresh) return releaseText;
    return pullText;
  };

  const getIndicatorOpacity = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / threshold, 1);
  };

  const getArrowRotation = () => {
    if (canRefresh) return 180;
    return 0;
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 transition-all duration-200"
        style={{
          height: pullDistance,
          opacity: getIndicatorOpacity(),
        }}
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          {isRefreshing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: `rotate(${getArrowRotation()}deg)` }}
            />
          )}
          <span className="text-sm font-medium">{getIndicatorText()}</span>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Hook for programmatic refresh control
 */
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(
    async (refreshFn: () => Promise<void> | void) => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      try {
        await refreshFn();
      } finally {
        setIsRefreshing(false);
      }
    },
    [isRefreshing],
  );

  return {
    isRefreshing,
    refresh,
  };
}
