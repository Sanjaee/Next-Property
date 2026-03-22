"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type MapUIContextValue = {
  showViewportOverlay: boolean;
  setShowViewportOverlay: (v: boolean) => void;
  toggleViewportOverlay: () => void;
};

const MapUIContext = createContext<MapUIContextValue | null>(null);

export function MapUIProvider({ children }: { children: ReactNode }) {
  const [showViewportOverlay, setShowViewportOverlay] = useState(false);
  const toggleViewportOverlay = useCallback(
    () => setShowViewportOverlay((v) => !v),
    []
  );

  return (
    <MapUIContext.Provider
      value={{ showViewportOverlay, setShowViewportOverlay, toggleViewportOverlay }}
    >
      {children}
    </MapUIContext.Provider>
  );
}

export function useMapUI() {
  const ctx = useContext(MapUIContext);
  return ctx;
}
