"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";

const RouteLoadingContext = createContext(false);

/** True saat Next.js sedang pindah route (routeChangeStart → complete/error). */
export function useRouteLoading() {
  return useContext(RouteLoadingContext);
}

export function RouteLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => setLoading(true), []);
  const done = useCallback(() => setLoading(false), []);

  useEffect(() => {
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router.events, start, done]);

  return (
    <RouteLoadingContext.Provider value={loading}>
      {children}
      {loading && (
        <div
          className="route-loading-bar pointer-events-none fixed top-0 left-0 z-100 h-1 w-full overflow-hidden bg-primary/15"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">Memuat halaman</span>
          <div className="route-loading-bar-inner h-full w-2/5 bg-primary" aria-hidden />
        </div>
      )}
    </RouteLoadingContext.Provider>
  );
}
