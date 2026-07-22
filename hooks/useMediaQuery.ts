import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // Keep server output and the first hydration pass identical. The browser
  // snapshot is applied immediately after hydration without an ARIA mismatch.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
