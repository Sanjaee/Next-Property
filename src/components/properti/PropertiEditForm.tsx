"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Upload, X } from "lucide-react";

const TIPE_PROPERTI = [
  { value: "house", label: "Rumah" },
  { value: "apartment", label: "Apartemen" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Tanah" },
  { value: "commercial", label: "Komersial" },
];

const TIPE_LISTING = [
  { value: "sale", label: "Dijual" },
  { value: "rent", label: "Disewa" },
];

const RENT_PERIOD = [
  { value: "monthly", label: "Per Bulan" },
  { value: "yearly", label: "Per Tahun" },
];

const PRICE_UNIT = [
  { value: "IDR", label: "IDR" },
  { value: "USD", label: "USD" },
];

const initialForm = {
  name: "",
  description: "",
  type: "house",
  listingType: "sale",
  price: "",
  priceUnit: "IDR",
  rentPeriod: "monthly",
  address: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  latitude: "",
  longitude: "",
};

export function PropertiEditForm({ editId }: { editId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetch(`/api/properti/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Properti tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          type: data.type ?? "house",
          listingType: data.listingType ?? "sale",
          price: String(data.price ?? ""),
          priceUnit: data.priceUnit ?? "IDR",
          rentPeriod: data.rentPeriod ?? "monthly",
          address: data.address ?? "",
          province: data.province ?? "",
          city: data.city ?? "",
          district: data.district ?? "",
          postalCode: data.postalCode ?? "",
          latitude: String(data.latitude ?? ""),
          longitude: String(data.longitude ?? ""),
        });
        if (data.imageUrl) {
          setExistingImageUrl(data.imageUrl);
          setImageRemoved(false);
        }
      })
      .catch((err) => {
        toast({
          title: "Gagal memuat data",
          description: err.message,
          variant: "destructive",
        });
        router.push("/properti/tambah");
      })
      .finally(() => setDataLoading(false));
  }, [editId, router, toast]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format tidak valid",
        description: "Hanya file gambar (JPG, PNG, WEBP) yang didukung.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "Ukuran terlalu besar",
        description: "Maksimal 4MB per gambar.",
        variant: "destructive",
      });
      return;
    }
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
      setExistingImageUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", String(pos.coords.latitude));
        update("longitude", String(pos.coords.longitude));
        setLocationLoading(false);
        toast({ title: "Lokasi berhasil", description: "Koordinat telah diisi." });
      },
      () => {
        setLocationLoading(false);
        toast({
          title: "Gagal mendapatkan lokasi",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.description ||
      !form.price ||
      !form.address ||
      !form.province ||
      !form.city ||
      !form.district ||
      !form.latitude ||
      !form.longitude
    ) {
      toast({ title: "Data belum lengkap", variant: "destructive" });
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      toast({
        title: "Latitude tidak valid",
        description: "Gunakan angka -90 sampai 90 (contoh: -6.2088)",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      toast({
        title: "Longitude tidak valid",
        description: "Gunakan angka -180 sampai 180 (contoh: 106.8456)",
        variant: "destructive",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      let imageUrl: string | undefined;
      let removeImage = false;

      if (imageFile) {
        const uploadRes = await fetch("/api/upload/cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageFile }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah gambar");
        imageUrl = uploadData.url;
      } else if (existingImageUrl && !imageRemoved) {
        imageUrl = existingImageUrl;
      } else if (imageRemoved) {
        removeImage = true;
      }

      const res = await fetch(`/api/properti/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          latitude: lat,
          longitude: lng,
          rentPeriod: form.listingType === "rent" ? form.rentPeriod : null,
          imageUrl,
          removeImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengubah properti");
      }

      toast({ title: "Properti berhasil diperbarui" });
      router.push("/properti/tambah");
    } catch (err) {
      toast({
        title: "Gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const currentImage = !imageRemoved ? (imageFile || existingImageUrl) : null;

  if (dataLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Info Properti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Properti *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Contoh: Rumah Minimalis 2 Lantai"
              required
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              required
              className="bg-background border-border"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Properti *</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_PROPERTI.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipe Listing *</Label>
              <Select value={form.listingType} onValueChange={(v) => update("listingType", v)}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_LISTING.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.listingType === "rent" && (
            <div className="space-y-2">
              <Label>Periode Sewa</Label>
              <Select value={form.rentPeriod} onValueChange={(v) => update("rentPeriod", v)}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENT_PERIOD.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Harga</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga *</Label>
              <PriceInput
                id="price"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Select value={form.priceUnit} onValueChange={(v) => update("priceUnit", v)}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_UNIT.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Lokasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap *</Label>
            <Textarea id="address" value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} required className="bg-background border-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Provinsi *</Label>
              <Input id="province" value={form.province} onChange={(e) => update("province", e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Kota/Kabupaten *</Label>
              <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} required className="bg-background border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="district">Kecamatan *</Label>
              <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Kode Pos</Label>
              <Input id="postalCode" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="bg-background border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} required className="bg-background border-border" />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={handleGetLocation} disabled={locationLoading} className="border-border">
            {locationLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <MapPin className="size-4 mr-2" />}
            Ambil Lokasi Saat Ini
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Gambar (Opsional)</CardTitle>
          <p className="text-sm text-muted-foreground">Unggah foto utama properti. Maks. 4MB.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentImage ? (
            <div className="relative inline-block">
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-border">
                <img src={currentImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 size-7 rounded-full" onClick={() => { setImageFile(null); setExistingImageUrl(null); setImageRemoved(true); }}>
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
              <Upload className="size-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Klik untuk memilih gambar</span>
            </label>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitLoading} className="bg-foreground text-background hover:bg-foreground/90">
          {submitLoading && <Loader2 className="size-4 animate-spin mr-2" />}
          Perbarui Properti
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/properti/tambah")} className="border-border">Batal</Button>
      </div>
    </form>
  );
}
