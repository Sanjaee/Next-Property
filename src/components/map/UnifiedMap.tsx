"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Map,
  MapMarker,
  MapRoute,
  MapControls,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  type MapViewport,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Route, Star, Navigation, ExternalLink } from "lucide-react";

const start = {
  name: "Amsterdam",
  label: "Start",
  category: "Capital",
  rating: 4.8,
  description: "Capital of the Netherlands",
  hours: "Open 24 hours",
  image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=300&h=200&fit=crop",
  lng: 4.9041,
  lat: 52.3676,
};

const end = {
  name: "Rotterdam",
  label: "End",
  category: "Port City",
  rating: 4.7,
  description: "Europe's largest port",
  hours: "Open 24 hours",
  image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=300&h=200&fit=crop",
  lng: 4.4777,
  lat: 51.9244,
};

interface RouteData {
  coordinates: [number, number][];
  duration: number;
  distance: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const initialViewport: MapViewport = {
  center: [4.69, 52.14],
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
};

export function UnifiedMap() {
  const [viewport, setViewport] = useState<MapViewport>(initialViewport);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`
        );
        const data = await response.json();

        if (data.routes?.length > 0) {
          const routeData: RouteData[] = data.routes.map(
            (route: {
              geometry: { coordinates: [number, number][] };
              duration: number;
              distance: number;
            }) => ({
              coordinates: route.geometry.coordinates,
              duration: route.duration,
              distance: route.distance,
            })
          );
          setRoutes(routeData);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  return (
    <div className="h-full w-full relative min-h-[500px]">
      <Map
        viewport={viewport}
        onViewportChange={setViewport}
      >
        {/* Routes */}
        {sortedRoutes.map(({ route, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={index}
              coordinates={route.coordinates}
              color={isSelected ? "#6366f1" : "#94a3b8"}
              width={isSelected ? 6 : 5}
              opacity={isSelected ? 1 : 0.6}
              onClick={() => setSelectedIndex(index)}
            />
          );
        })}

        {/* Start marker (Amsterdam) */}
        <MapMarker longitude={start.lng} latitude={start.lat}>
          <MarkerContent>
            <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
            <MarkerLabel position="top">{start.label}</MarkerLabel>
          </MarkerContent>
          <MarkerPopup className="p-0 w-62">
            <div className="relative h-32 overflow-hidden rounded-t-md">
              <Image
                fill
                src={start.image}
                alt={start.name}
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {start.category}
                </span>
                <h3 className="font-semibold text-foreground leading-tight">
                  {start.name}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{start.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{start.hours}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8">
                  <Navigation className="size-3.5 mr-1.5" />
                  Directions
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>

        {/* End marker (Rotterdam) */}
        <MapMarker longitude={end.lng} latitude={end.lat}>
          <MarkerContent>
            <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
            <MarkerLabel position="bottom">{end.label}</MarkerLabel>
          </MarkerContent>
          <MarkerPopup className="p-0 w-62">
            <div className="relative h-32 overflow-hidden rounded-t-md">
              <Image
                fill
                src={end.image}
                alt={end.name}
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {end.category}
                </span>
                <h3 className="font-semibold text-foreground leading-tight">
                  {end.name}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{end.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{end.hours}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8">
                  <Navigation className="size-3.5 mr-1.5" />
                  Directions
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>

        {/* Map controls */}
        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
        />
      </Map>

      {/* Viewport overlay (lng, lat, zoom, bearing, pitch) */}
      <div className="absolute top-2 left-2 z-[100] flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono bg-background/80 backdrop-blur px-2 py-1.5 rounded border shadow-sm">
        <span>
          <span className="text-muted-foreground">lng:</span>{" "}
          {viewport.center[0].toFixed(3)}
        </span>
        <span>
          <span className="text-muted-foreground">lat:</span>{" "}
          {viewport.center[1].toFixed(3)}
        </span>
        <span>
          <span className="text-muted-foreground">zoom:</span>{" "}
          {viewport.zoom.toFixed(1)}
        </span>
        <span>
          <span className="text-muted-foreground">bearing:</span>{" "}
          {viewport.bearing.toFixed(1)}°
        </span>
        <span>
          <span className="text-muted-foreground">pitch:</span>{" "}
          {viewport.pitch.toFixed(1)}°
        </span>
      </div>

      {/* Route selector */}
      {routes.length > 0 && (
        <div className="absolute top-12 left-2 z-[100] flex flex-col gap-2">
          {routes.map((route, index) => {
            const isActive = index === selectedIndex;
            const isFastest = index === 0;
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedIndex(index)}
                className="justify-start gap-3"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="font-medium">
                    {formatDuration(route.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs opacity-80">
                  <Route className="size-3" />
                  {formatDistance(route.distance)}
                </div>
                {isFastest && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Fastest
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-background/50">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
