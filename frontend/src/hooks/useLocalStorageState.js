import { useState, useEffect } from 'react';

/**
 * useState backed by localStorage. Lazily initializes from storage (falling
 * back to `initial`) and writes the JSON-serialized value on every change.
 * Survives component remounts and page refreshes.
 */
export default function useLocalStorageState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / serialization errors
    }
  }, [key, value]);

  return [value, setValue];
}
