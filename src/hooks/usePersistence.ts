"use client";

import { useState, useEffect, useCallback } from "react";

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Generic persistence hook
export function usePersistence<T>(
  key: string,
  initialValue: T,
  debounceMs: number = 500,
) {
  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Debounce the stored value to avoid excessive localStorage writes
  const debouncedStoredValue = useDebounce(storedValue, debounceMs);

  // Save to localStorage whenever the debounced value changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(debouncedStoredValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, debouncedStoredValue]);

  // Return the current value and a setter function
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
      } catch (error) {
        console.warn(`Error setting value for key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue] as const;
}

// Specific hooks for different components
export function useKanbanPersistence(boardId: string) {
  return usePersistence(`kanban-board-${boardId}`, null);
}

export function useDashboardPersistence(dashboardId: string) {
  return usePersistence(`dashboard-${dashboardId}`, null);
}

export function useFormBuilderPersistence(formId: string) {
  return usePersistence(`form-builder-${formId}`, null);
}

export function useSortableListPersistence(listId: string) {
  return usePersistence(`sortable-list-${listId}`, []);
}
