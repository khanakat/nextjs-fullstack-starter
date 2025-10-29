"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { TouchOptimizedButton } from "./touch-optimized-button";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnSwipeDown?: boolean;
  swipeThreshold?: number;
  className?: string;
  overlayClassName?: string;
  animation?: "slide-up" | "slide-down" | "fade" | "scale";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "bottom" | "center" | "top";
  hapticFeedback?: boolean;
}

/**
 * Mobile-optimized modal with slide animations and swipe-to-close
 */
export function MobileModal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnSwipeDown = true,
  swipeThreshold = 100,
  className,
  overlayClassName,
  animation = "slide-up",
  size = "md",
  position = "bottom",
  hapticFeedback = true,
}: MobileModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const initialTranslateY = useRef(0);

  const triggerHapticFeedback = useCallback(
    (intensity: "light" | "medium" | "heavy" = "light") => {
      if (!hapticFeedback) return;

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
    [hapticFeedback],
  );

  const handleClose = useCallback(() => {
    triggerHapticFeedback("medium");
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setTranslateY(0);
    }, 300);
  }, [onClose, triggerHapticFeedback]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!closeOnSwipeDown) return;

      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      initialTranslateY.current = translateY;
      setIsDragging(true);
      triggerHapticFeedback("light");
    },
    [closeOnSwipeDown, translateY, triggerHapticFeedback],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !closeOnSwipeDown) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;

      // Only allow downward swipes
      if (deltaY > 0) {
        const newTranslateY = Math.min(deltaY, 300); // Max translate distance
        setTranslateY(newTranslateY);

        // Provide haptic feedback at threshold
        if (
          newTranslateY >= swipeThreshold &&
          initialTranslateY.current < swipeThreshold
        ) {
          triggerHapticFeedback("medium");
        }
      }
    },
    [isDragging, closeOnSwipeDown, swipeThreshold, triggerHapticFeedback],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !closeOnSwipeDown) return;

    setIsDragging(false);

    const finalDeltaY = currentY.current - startY.current;

    if (finalDeltaY >= swipeThreshold) {
      handleClose();
    } else {
      // Reset position
      setTranslateY(0);
    }
  }, [isDragging, closeOnSwipeDown, swipeThreshold, handleClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        handleClose();
      }
    },
    [closeOnOverlayClick, handleClose],
  );

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  const positionClasses = {
    bottom: "items-end",
    center: "items-center",
    top: "items-start pt-20",
  };

  const animationClasses = {
    "slide-up": isVisible ? "translate-y-0" : "translate-y-full",
    "slide-down": isVisible ? "translate-y-0" : "-translate-y-full",
    fade: isVisible ? "opacity-100" : "opacity-0",
    scale: isVisible ? "scale-100" : "scale-95",
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        positionClasses[position],
        "p-4 sm:p-6",
      )}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0",
          overlayClassName,
        )}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl",
          "transition-all duration-300 ease-out",
          sizeClasses[size],
          animationClasses[animation],
          position === "bottom" && "rounded-b-none",
          position === "center" && "rounded-2xl mx-auto",
          position === "top" && "rounded-b-2xl rounded-t-none",
          className,
        )}
        style={{
          transform: `translateY(${translateY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle (for bottom position) */}
        {position === "bottom" && closeOnSwipeDown && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {showCloseButton && (
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-2 -mr-2"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </TouchOptimizedButton>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * Mobile bottom sheet modal
 */
export function MobileBottomSheet({
  children,
  ...props
}: Omit<MobileModalProps, "position" | "animation">) {
  return (
    <MobileModal position="bottom" animation="slide-up" {...props}>
      {children}
    </MobileModal>
  );
}

/**
 * Mobile full screen modal
 */
export function MobileFullScreenModal({
  children,
  className,
  ...props
}: Omit<MobileModalProps, "size" | "position">) {
  return (
    <MobileModal
      size="full"
      position="center"
      className={cn("h-full rounded-none", className)}
      {...props}
    >
      {children}
    </MobileModal>
  );
}

/**
 * Mobile action sheet
 */
export function MobileActionSheet({
  actions,
  title,
  cancelLabel = "Cancel",
  onCancel,
  ...props
}: Omit<MobileModalProps, "children"> & {
  actions: Array<{
    label: string;
    onClick: () => void;
    destructive?: boolean;
    disabled?: boolean;
  }>;
  cancelLabel?: string;
  onCancel?: () => void;
}) {
  const handleCancel = () => {
    onCancel?.();
    props.onClose();
  };

  return (
    <MobileBottomSheet {...props}>
      <div className="p-4 space-y-2">
        {title && (
          <div className="text-center py-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
          </div>
        )}

        {actions.map((action, index) => (
          <TouchOptimizedButton
            key={index}
            variant="ghost"
            className={cn(
              "w-full justify-start h-12 text-left",
              action.destructive && "text-red-600 dark:text-red-400",
            )}
            disabled={action.disabled}
            onClick={() => {
              action.onClick();
              props.onClose();
            }}
          >
            {action.label}
          </TouchOptimizedButton>
        ))}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <TouchOptimizedButton
            variant="ghost"
            className="w-full justify-center h-12 font-medium"
            onClick={handleCancel}
          >
            {cancelLabel}
          </TouchOptimizedButton>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
