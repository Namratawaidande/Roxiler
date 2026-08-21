import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid state changes (e.g. search / filter typing)
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {*} debouncedValue
 */
export const useDebounce = (value, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
