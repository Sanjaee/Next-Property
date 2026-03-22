"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Map,
  MapMarker,
  MapRoute,
  MapControls,
  MapClusterLayer,
  MapPopup,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  type MapViewport,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Loader2, Clock, Route, X } from "lucide-react";
import { useMapUI, MAP_STYLES } from "@/components/contex/MapUIContext";

export interface PropertiMapItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  status: string;
  listingType: string;
  price: string;
  priceUnit: string;
  rentPeriod: string | null;
  address: string;
  province: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
}

const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];
const initialViewport: MapViewport = {
  center: DEFAULT_CENTER,
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

function formatPrice(price: string, unit: string, listingType: string, rentPeriod?: string | null) {
  const num = Number(price);
  if (unit === "IDR") {
    const formatted = new Intl.NumberFormat("id-ID").format(num);
    return listingType === "rent"
      ? `Rp ${formatted}/${rentPeriod === "yearly" ? "tahun" : "bulan"}`
      : `Rp ${formatted}`;
  }
  return listingType === "rent"
    ? `$${num}/${rentPeriod === "yearly" ? "year" : "mo"}`
    : `$${num}`;
}

const typeLabels: Record<string, string> = {
  house: "Rumah",
  apartment: "Apartemen",
  villa: "Villa",
  land: "Tanah",
  commercial: "Komersial",
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
  return `${hours}j ${remainingMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&h=200&fit=crop";

function PropertyPopupContent({
  property: p,
  onShowRoute,
  routeLoading,
}: {
  property: PropertiMapItem;
  onShowRoute: (p: PropertiMapItem) => void;
  routeLoading: boolean;
}) {
  return (
    <div className="w-72 p-0">
      <div className="relative h-36 overflow-hidden rounded-t-md bg-muted">
        <Image
          fill
          src={p.imageUrl || PLACEHOLDER_IMAGE}
          alt={p.name}
          className="object-cover"
        />
      </div>
      <div className="space-y-2 p-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {typeLabels[p.type] ?? p.type} • {p.listingType === "rent" ? "Sewa" : "Jual"}
          </span>
          <h3 className="font-semibold text-foreground leading-tight">
            <a href={`/properti/${p.slug}`} className="hover:underline">{p.name}</a>
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="size-3 shrink-0" />
            {p.district}, {p.city}
          </p>
        </div>
        <p className="text-sm font-medium">
          {formatPrice(p.price, p.priceUnit, p.listingType, p.rentPeriod)}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8"
              variant="default"
              onClick={() => onShowRoute(p)}
              disabled={routeLoading}
            >
              {routeLoading ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Route className="size-3.5 mr-1.5" />
              )}
              Rute Jarak
            </Button>
            <Button size="sm" variant="outline" className="h-8" asChild>
              <a
                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Gunakan clustering saat properti >= threshold supaya peta tidak penuh marker */
const CLUSTER_THRESHOLD = 15;

export function UnifiedMap() {
  const mapUI = useMapUI();
  const [viewport, setViewport] = useState<MapViewport>(initialViewport);
  const [properties, setProperties] = useState<PropertiMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertiMapItem | null>(null);
  const [routeToProperty, setRouteToProperty] = useState<PropertiMapItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);

  const propertiesGeoJSON = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point, PropertiMapItem> => {
    return {
      type: "FeatureCollection",
      features: properties.map((p) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [p.longitude, p.latitude] as [number, number],
        },
        properties: p,
      })),
    };
  }, [properties]);

  const useClustering = properties.length >= CLUSTER_THRESHOLD;

  const mapStyles = useMemo(() => {
    const styleUrl = mapUI?.mapStyle ? MAP_STYLES[mapUI.mapStyle] : undefined;
    return styleUrl ? { light: styleUrl, dark: styleUrl } : undefined;
  }, [mapUI?.mapStyle]);

  const is3D = mapUI?.mapStyle === "openstreetmap3d";

  useEffect(() => {
    if (is3D) {
      setViewport((v) => ({ ...v, pitch: 60 }));
    } else {
      setViewport((v) => ({ ...v, pitch: 0 }));
    }
  }, [is3D]);

  const clearRoute = () => {
    setRouteToProperty(null);
    setUserLocation(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
  };

  const showRouteToProperty = async (property: PropertiMapItem) => {
    if (!navigator.geolocation) return;
    setRouteLoading(true);
    setRoutes([]);
    setSelectedRouteIndex(0);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLng = pos.coords.longitude;
        const userLat = pos.coords.latitude;
        setUserLocation({ lng: userLng, lat: userLat });
        setRouteToProperty(property);
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${property.longitude},${property.latitude}?overview=full&geometries=geojson&alternatives=true`
          );
          const data = await res.json();
          if (data.routes?.length > 0) {
            const routeData: RouteData[] = data.routes.map(
              (r: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }) => ({
                coordinates: r.geometry.coordinates,
                duration: r.duration,
                distance: r.distance,
              })
            );
            setRoutes(routeData);
          }
        } catch (err) {
          console.error("Route fetch error:", err);
        } finally {
          setRouteLoading(false);
        }
      },
      () => setRouteLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetch("/api/properti")
      .then((res) => res.json())
      .then((data) => setProperties(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full w-full relative min-h-[500px]">
      <Map
        viewport={viewport}
        onViewportChange={setViewport}
        styles={mapStyles}
      >
        {(() => {
          const sortedRoutes = routes
            .map((route, index) => ({ route, index }))
            .sort((a, b) => {
              if (a.index === selectedRouteIndex) return 1;
              if (b.index === selectedRouteIndex) return -1;
              return 0;
            });
          return sortedRoutes.map(({ route, index }) => {
            const isSelected = index === selectedRouteIndex;
            return (
              <MapRoute
                key={index}
                coordinates={route.coordinates}
                color={isSelected ? "#6366f1" : "#94a3b8"}
                width={isSelected ? 6 : 5}
                opacity={isSelected ? 1 : 0.6}
                onClick={() => setSelectedRouteIndex(index)}
              />
            );
          });
        })()}

        {userLocation && (
          <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
            <MarkerContent>
              <div className="size-5 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
              <MarkerLabel position="top">Lokasi Anda</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}

        {useClustering ? (
          <>
            <MapClusterLayer<PropertiMapItem>
              data={propertiesGeoJSON}
              clusterRadius={50}
              clusterMaxZoom={14}
              clusterColors={["#1d8cf8", "#6d5dfc", "#e23670"]}
              pointColor="#18181b"
              onPointClick={(feature) => {
                if (feature.properties) setSelectedProperty(feature.properties);
              }}
            />
            {selectedProperty && (
              <MapPopup
                key={selectedProperty.id}
                longitude={selectedProperty.longitude}
                latitude={selectedProperty.latitude}
                onClose={() => setSelectedProperty(null)}
                closeOnClick={false}
                focusAfterOpen={false}
                closeButton
              >
                <PropertyPopupContent
                  property={selectedProperty}
                  onShowRoute={showRouteToProperty}
                  routeLoading={routeLoading}
                />
              </MapPopup>
            )}
          </>
        ) : (
          properties.map((p) => (
            <MapMarker key={p.id} longitude={p.longitude} latitude={p.latitude}>
              <MarkerContent>
                <div className="size-5 rounded-full bg-foreground border-2 border-background shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="bottom">{typeLabels[p.type] ?? p.type}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-72">
                <PropertyPopupContent
                  property={p}
                  onShowRoute={showRouteToProperty}
                  routeLoading={routeLoading}
                />
              </MarkerPopup>
            </MapMarker>
          ))
        )}

        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
        />
      </Map>

      {routes.length > 0 && routeToProperty && (
        <div className="absolute top-20 left-2 z-[100] flex flex-col gap-2 bg-background/90 backdrop-blur px-3 py-2 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs text-muted-foreground">
              Ke: {routeToProperty.name}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={clearRoute}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {routes.map((route, index) => {
              const isActive = index === selectedRouteIndex;
              const isFastest = index === 0;
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedRouteIndex(index)}
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
                      Tercepat
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {mapUI?.showViewportOverlay && (
        <div
          className="absolute z-[100] flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono bg-background/90 backdrop-blur px-2 py-1.5 rounded border border-border shadow-sm"
          style={{ top: routes.length > 0 ? "8.5rem" : "5rem" }}
        >
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
      )}

      {loading && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-background/50">
          <div className="size-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      )}
    </div>
  );
}
