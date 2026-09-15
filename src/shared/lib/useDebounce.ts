import { useState, useEffect } from "react";

/**
 * Хук дебаунса для задержки обновления значения (250 мс по ТЗ)
 */
export const useDebounce = <T>(value: T, delay: number = 250): T => {
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
};
