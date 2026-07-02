import { useEffect, useState } from "react";

/** Escucha una media query y devuelve true si coincide. Vive en cliente puro,
 *  así que hace un guard por si `window` no existe (no debería en Vite pero
 *  por si acaso). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Atajo semántico. Portrait handheld: cualquier iPhone o Android típico. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 820px)");
}
