"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import { Loader2, MapPin, Navigation, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddressOption {
  id: string;
  text: string;
}

export interface AddressSelectorValue {
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode?: string;
  latitude: string;
  longitude: string;
}

interface AddressSelectorProps {
  value?: Partial<AddressSelectorValue>;
  onChange: (value: AddressSelectorValue) => void;
}

const API_BASE = "https://alamat.thecloudalert.com/api";
const MAX_OPTIONS_RENDER = 100;

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onSelect,
  disabled,
  loading,
  loadingLabel = "Memuat...",
}: {
  label: string;
  placeholder: string;
  options: AddressOption[];
  value: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((o) => o.text.toLowerCase().includes(q));
  }, [options, search]);
  const displayed = useMemo(() => {
    const slice = filtered.slice(0, MAX_OPTIONS_RENDER);
    const selectedInFull = value && options.find((o) => o.id === value);
    if (selectedInFull && !slice.some((o) => o.id === value)) {
      return [selectedInFull, ...slice].slice(0, MAX_OPTIONS_RENDER);
    }
    return slice;
  }, [filtered, value, options]);
  const selected = options.find((o) => o.id === value);
  const hasMore = filtered.length > MAX_OPTIONS_RENDER;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between bg-background font-normal"
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </span>
        ) : (
          <span className="truncate">{selected?.text || placeholder}</span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {displayed.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">Tidak ada hasil</p>
              ) : (
                <div className="space-y-0.5">
                  {displayed.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${value === o.id ? "bg-muted font-medium" : ""}`}
                      onClick={() => {
                        onSelect(o.id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      {o.text}
                    </button>
                  ))}
                  {hasMore && (
                    <p className="text-center py-2 text-xs text-muted-foreground">
                      Tampilkan 100 dari {filtered.length}. Ketik untuk memfilter.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AddressSelector({ value, onChange }: AddressSelectorProps) {
  const { toast } = useToast();

  const [markerPosition, setMarkerPosition] = useState(() => {
    if (value?.latitude && value?.longitude) {
      const lat = parseFloat(value.latitude);
      const lng = parseFloat(value.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lng, lat };
      }
    }
    return { lng: 106.8456, lat: -6.2088 };
  });
  const [mapKey, setMapKey] = useState(0);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [streetDetail, setStreetDetail] = useState("");

  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [subDistricts, setSubDistricts] = useState<AddressOption[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");

  const [provinceName, setProvinceName] = useState("");
  const [cityName, setCityName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [subDistrictName, setSubDistrictName] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);

  const emitChange = useCallback(
    (updates: Partial<AddressSelectorValue>) => {
      const base: AddressSelectorValue = {
        address: value?.address ?? "",
        province: value?.province ?? "",
        city: value?.city ?? "",
        district: value?.district ?? "",
        postalCode: value?.postalCode ?? "",
        latitude: value?.latitude ?? "",
        longitude: value?.longitude ?? "",
      };
      onChange({ ...base, ...updates });
    },
    [onChange, value]
  );

  // Sync province/city/district names from value (e.g. edit form)
  useEffect(() => {
    if (value?.province) setProvinceName((p) => p || (value.province ?? ""));
    if (value?.city) setCityName((c) => c || (value.city ?? ""));
    if (value?.district) setDistrictName((d) => d || (value.district ?? ""));
  }, [value?.province, value?.city, value?.district]);

  // Sync marker when value loads from parent (e.g. edit form fetches data)
  useEffect(() => {
    if (!value?.latitude || !value?.longitude) return;
    const lat = parseFloat(value.latitude);
    const lng = parseFloat(value.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    setMarkerPosition((prev) => {
      if (Math.abs(prev.lat - lat) < 1e-6 && Math.abs(prev.lng - lng) < 1e-6) return prev;
      setMapKey((k) => k + 1);
      return { lng, lat };
    });
  }, [value?.latitude, value?.longitude]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation tidak didukung",
        description: "Browser tidak mendukung fitur lokasi.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setMarkerPosition(newPosition);
        setMapKey((prev) => prev + 1);
        emitChange({
          latitude: String(newPosition.lat),
          longitude: String(newPosition.lng),
          address: `Lokasi GPS (${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)})`,
          province: "",
          city: "",
          district: "",
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Gagal mendapatkan lokasi",
          description: "Pastikan GPS aktif dan izin lokasi diberikan.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [emitChange, toast]);

  const handleMarkerDrag = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      setMarkerPosition(lngLat);
      const hasAdmin = provinceName && cityName && districtName;
      const addr = hasAdmin
        ? [streetDetail, subDistrictName, districtName, cityName, provinceName]
            .filter(Boolean)
            .join(", ")
        : `Lokasi Peta (${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)})`;
      emitChange({
        latitude: String(lngLat.lat),
        longitude: String(lngLat.lng),
        address: addr,
      });
    },
    [emitChange, provinceName, cityName, districtName, subDistrictName, streetDetail]
  );

  // Emit initial values on mount (lat/lng from marker, address from value or coords)
  useEffect(() => {
    const lat = markerPosition.lat.toFixed(6);
    const lng = markerPosition.lng.toFixed(6);
    const hasAdmin = provinceName || cityName || districtName;
    const addr = hasAdmin
      ? [streetDetail, subDistrictName, districtName, cityName, provinceName]
          .filter(Boolean)
          .join(", ")
      : (value?.address ?? `Lokasi Peta (${lat}, ${lng})`);
    onChange({
      address: addr,
      province: (provinceName || value?.province) ?? "",
      city: (cityName || value?.city) ?? "",
      district: (districtName || value?.district) ?? "",
      postalCode: value?.postalCode ?? "",
      latitude: lat,
      longitude: lng,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await fetch(`${API_BASE}/provinsi/get/`);
        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
          setProvinces(data.result);
        } else {
          setUseManualInput(true);
        }
      } catch {
        setUseManualInput(true);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      setSelectedCity("");
      setDistricts([]);
      setSelectedDistrict("");
      setSubDistricts([]);
      setSelectedSubDistrict("");
      try {
        const response = await fetch(
          `${API_BASE}/kabkota/get/?d_provinsi_id=${selectedProvince}`
        );
        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
          setCities(data.result);
        } else {
          setUseManualInput(true);
        }
      } catch {
        setUseManualInput(true);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedCity) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]);
      setSelectedDistrict("");
      setSubDistricts([]);
      setSelectedSubDistrict("");
      try {
        const response = await fetch(
          `${API_BASE}/kecamatan/get/?d_kabkota_id=${selectedCity}`
        );
        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
          setDistricts(data.result);
        } else {
          setUseManualInput(true);
        }
      } catch {
        setUseManualInput(true);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedDistrict) {
      setSubDistricts([]);
      return;
    }
    const fetchSubDistricts = async () => {
      setLoadingSubDistricts(true);
      setSubDistricts([]);
      setSelectedSubDistrict("");
      try {
        const response = await fetch(
          `${API_BASE}/kelurahan/get/?d_kecamatan_id=${selectedDistrict}`
        );
        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
          setSubDistricts(data.result);
        } else {
          setUseManualInput(true);
        }
      } catch {
        setUseManualInput(true);
      } finally {
        setLoadingSubDistricts(false);
      }
    };
    fetchSubDistricts();
  }, [selectedDistrict]);

  useEffect(() => {
    if (provinceName && cityName && districtName) {
      const parts = [streetDetail, subDistrictName, districtName, cityName, provinceName].filter(Boolean);
      emitChange({
        address: parts.join(", "),
        province: provinceName,
        city: cityName,
        district: districtName,
      });
    } else if (streetDetail) {
      // Manual input without admin selection
      emitChange({ address: streetDetail });
    }
  }, [provinceName, cityName, districtName, subDistrictName, streetDetail, emitChange]);

  const handleProvinceChange = (val: string) => {
    setSelectedProvince(val);
    const p = provinces.find((x) => x.id === val);
    setProvinceName(p?.text ?? "");
  };

  const handleCityChange = (val: string) => {
    setSelectedCity(val);
    const c = cities.find((x) => x.id === val);
    setCityName(c?.text ?? "");
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    const d = districts.find((x) => x.id === val);
    setDistrictName(d?.text ?? "");
  };

  const handleSubDistrictChange = (val: string) => {
    setSelectedSubDistrict(val);
    const s = subDistricts.find((x) => x.id === val);
    setSubDistrictName(s?.text ?? "");
  };

  const handleResetPosition = () => {
    const defaultPos = {
      lng: 106.8456,
      lat: -6.2088,
    };
    setMarkerPosition(defaultPos);
    setMapKey((prev) => prev + 1);
    emitChange({
      latitude: String(defaultPos.lat),
      longitude: String(defaultPos.lng),
      address: `Lokasi Peta (${defaultPos.lat.toFixed(6)}, ${defaultPos.lng.toFixed(6)})`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Titik Lokasi</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="text-xs"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3 mr-1" />
            )}
            Lokasi Saya
          </Button>
        </div>
        <div className="h-48 w-full rounded-lg overflow-hidden border">
          <Map
            key={mapKey}
            center={[markerPosition.lng, markerPosition.lat]}
            zoom={15}
            fadeDuration={0}
            className="w-full h-full"
          >
            <MapMarker
              draggable
              longitude={markerPosition.lng}
              latitude={markerPosition.lat}
              onDragEnd={handleMarkerDrag}
            >
              <MarkerContent>
                <div className="cursor-move">
                  <MapPin
                    className="fill-blue-500 stroke-white drop-shadow-lg"
                    size={32}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
          </Map>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted rounded px-3 py-2">
          <span>
            <strong>Lat:</strong> {markerPosition.lat.toFixed(6)}
          </span>
          <span>
            <strong>Lng:</strong> {markerPosition.lng.toFixed(6)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetPosition}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Alamat Jalan / Detail (opsional)</Label>
        <Input
          placeholder="Contoh: Jl. Sudirman No. 123, RT 01/RW 02"
          value={streetDetail}
          onChange={(e) => setStreetDetail(e.target.value)}
          className="bg-background"
        />
      </div>

      {!showManualAddress ? (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Koordinat telah ditentukan</p>
          <p className="text-sm font-medium flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowManualAddress(true)}
            className="text-xs mt-2 p-0 h-auto"
          >
            + Pilih alamat administratif (Provinsi, Kota, Kecamatan)
          </Button>
        </div>
      ) : (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {useManualInput ? "Input alamat secara manual" : "Alamat administratif dari API"}
            </p>
            <div className="flex items-center gap-2">
              {!useManualInput && provinces.length > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setUseManualInput(true)}
                  className="text-xs h-6 px-2"
                >
                  Ketik manual
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowManualAddress(false)}
                className="text-xs h-6 px-2"
              >
                Sembunyikan
              </Button>
            </div>
          </div>

          {useManualInput ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input
                  placeholder="Contoh: DKI Jakarta"
                  value={provinceName}
                  onChange={(e) => setProvinceName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Input
                  placeholder="Contoh: Jakarta Selatan"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Kecamatan</Label>
                <Input
                  placeholder="Contoh: Kebayoran Baru"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Kelurahan/Desa (opsional)</Label>
                <Input
                  placeholder="Contoh: Gunung"
                  value={subDistrictName}
                  onChange={(e) => setSubDistrictName(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          ) : (
            <>
              <SearchableSelect
                label="Provinsi"
                placeholder="Pilih Provinsi"
                options={provinces}
                value={selectedProvince}
                onSelect={handleProvinceChange}
                disabled={false}
                loading={loadingProvinces}
              />
              <SearchableSelect
                label="Kabupaten/Kota"
                placeholder="Pilih Kabupaten/Kota"
                options={cities}
                value={selectedCity}
                onSelect={handleCityChange}
                disabled={!selectedProvince}
                loading={loadingCities}
              />
              <SearchableSelect
                label="Kecamatan"
                placeholder="Pilih Kecamatan"
                options={districts}
                value={selectedDistrict}
                onSelect={handleDistrictChange}
                disabled={!selectedCity}
                loading={loadingDistricts}
              />
              <SearchableSelect
                label="Kelurahan/Desa (opsional)"
                placeholder="Pilih Kelurahan/Desa"
                options={subDistricts}
                value={selectedSubDistrict}
                onSelect={handleSubDistrictChange}
                disabled={!selectedDistrict}
                loading={loadingSubDistricts}
              />
            </>
          )}

          {provinceName && cityName && districtName && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Alamat terpilih:</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {[streetDetail, subDistrictName, districtName, cityName, provinceName]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
