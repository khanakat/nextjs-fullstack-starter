import { useState, useEffect } from "react";

/**
 * Hook to check if component has mounted on the client-side
 * Useful for preventing hydration mismatches
 * 
 * @returns Boolean indicating if the component has mounted
 */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};