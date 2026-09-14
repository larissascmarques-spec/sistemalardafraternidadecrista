import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : initialRef.current);
    } catch {
      setValue(initialRef.current);
    } finally {
      setLoaded(true);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined" || !loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [key, loaded, value]);

  return [value, setValue, loaded] as const;
}