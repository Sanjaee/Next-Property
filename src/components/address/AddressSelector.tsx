"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import { Loader2, MapPin, Navigation, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Select
                  value={selectedProvince}
                  onValueChange={handleProvinceChange}
                  disabled={loadingProvinces}
                >
                  <SelectTrigger className="bg-background">
                    {loadingProvinces ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memuat...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Pilih Provinsi" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Select
                  value={selectedCity}
                  onValueChange={handleCityChange}
                  disabled={!selectedProvince || loadingCities}
                >
                  <SelectTrigger className="bg-background">
                    {loadingCities ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memuat...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Pilih Kabupaten/Kota" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kecamatan</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  disabled={!selectedCity || loadingDistricts}
                >
                  <SelectTrigger className="bg-background">
                    {loadingDistricts ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memuat...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Pilih Kecamatan" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kelurahan/Desa</Label>
                <Select
                  value={selectedSubDistrict}
                  onValueChange={handleSubDistrictChange}
                  disabled={!selectedDistrict || loadingSubDistricts}
                >
                  <SelectTrigger className="bg-background">
                    {loadingSubDistricts ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memuat...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Pilih Kelurahan/Desa (opsional)" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {subDistricts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
