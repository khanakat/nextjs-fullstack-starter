import { useState, useEffect } from "react";

/**
 * Hook to safely get the current origin on the client-side
 * Prevents hydration mismatches between server and client
 * 
 * @returns The current window origin or empty string during SSR
 */
export const useOrigin = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const origin = typeof window !== "undefined" && window.location.origin 
    ? window.location.origin 
    : "";

  if (!mounted) {
    return "";
  }

  return origin;
};