"use client";

import { Map, MapMarker, MarkerContent } from "@/components/ui/map";

export function PropertyLocationMap({
  longitude,
  latitude,
  className = "h-64 rounded-lg",
}: {
  longitude: number;
  latitude: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <Map
        center={[longitude, latitude]}
        zoom={15}
        className="w-full h-full rounded-lg overflow-hidden"
      >
        <MapMarker longitude={longitude} latitude={latitude}>
          <MarkerContent>
            <div className="size-6 rounded-full bg-red-500 border-2 border-white shadow-lg" />
          </MarkerContent>
        </MapMarker>
      </Map>
    </div>
  );
}
