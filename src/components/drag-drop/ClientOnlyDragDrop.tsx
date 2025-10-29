"use client";

import { useEffect, useState } from "react";

interface ClientOnlyDragDropProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnlyDragDrop component prevents hydration mismatches
 * by only rendering drag-and-drop components on the client side.
 * This is necessary because @dnd-kit generates unique IDs that
 * differ between server and client rendering.
 */
export function ClientOnlyDragDrop({
  children,
  fallback = null,
}: ClientOnlyDragDropProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
