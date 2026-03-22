"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export const MAP_STYLES = {
  default: undefined,
  openstreetmap: "https://tiles.openfreemap.org/styles/bright",
  openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

type MapUIContextValue = {
  showViewportOverlay: boolean;
  setShowViewportOverlay: (v: boolean) => void;
  toggleViewportOverlay: () => void;
  mapStyle: MapStyleKey;
  setMapStyle: (v: MapStyleKey) => void;
};

const MapUIContext = createContext<MapUIContextValue | null>(null);

export function MapUIProvider({ children }: { children: ReactNode }) {
  const [showViewportOverlay, setShowViewportOverlay] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("default");
  const toggleViewportOverlay = useCallback(
    () => setShowViewportOverlay((v) => !v),
    []
  );

  return (
    <MapUIContext.Provider
      value={{
        showViewportOverlay,
        setShowViewportOverlay,
        toggleViewportOverlay,
        mapStyle,
        setMapStyle,
      }}
    >
      {children}
    </MapUIContext.Provider>
  );
}

export function useMapUI() {
  const ctx = useContext(MapUIContext);
  return ctx;
}
