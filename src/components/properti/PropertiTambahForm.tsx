"use client";

import { useState } from "react";
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
import { Loader2, Upload, X } from "lucide-react";
import { propertiFormSchema, getFirstZodError, scrollToInvalidField } from "@/lib/schemas";
import { AddressSelector } from "@/components/address/AddressSelector";

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

export function PropertiTambahForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const MAX_IMAGES = 10;
  const MAX_SIZE_MB = 3;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    const remaining = MAX_IMAGES - imageFiles.length;
    if (files.length > remaining) {
      toast({
        title: "Batas gambar tercapai",
        description: `Maksimal ${MAX_IMAGES} gambar. Anda dapat menambah ${remaining} gambar lagi.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format tidak valid",
          description: `${file.name}: Hanya JPG, PNG, WEBP yang didukung.`,
          variant: "destructive",
        });
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({
          title: "Ukuran terlalu besar",
          description: `${file.name}: Maksimal ${MAX_SIZE_MB}MB per gambar.`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImageFiles((prev) => {
          const next = [...prev, reader.result as string];
          return next.slice(0, MAX_IMAGES);
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (data: {
    address: string;
    province: string;
    city: string;
    district: string;
    postalCode?: string;
    latitude: string;
    longitude: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      address: data.address,
      province: data.province,
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = propertiFormSchema.safeParse({
      ...form,
      rentPeriod: form.listingType === "rent" ? form.rentPeriod : null,
    });
    if (!parsed.success) {
      scrollToInvalidField(parsed.error);
      toast({
        title: "Data tidak valid",
        description: getFirstZodError(parsed.error),
        variant: "destructive",
      });
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);

    setSubmitLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const img of imageFiles) {
        const uploadRes = await fetch("/api/upload/cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: img }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah gambar");
        imageUrls.push(uploadData.url);
      }

      const res = await fetch("/api/properti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          latitude: lat,
          longitude: lng,
          rentPeriod: form.listingType === "rent" ? form.rentPeriod : null,
          imageUrls,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan properti");
      }

      toast({
        title: "Properti berhasil ditambahkan",
        description: "Properti akan muncul di peta.",
      });
      router.push("/");
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
              placeholder="Deskripsi detail properti..."
              rows={4}
              required
              className="bg-background border-border"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Properti *</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger id="type" className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_PROPERTI.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipe Listing *</Label>
              <Select
                value={form.listingType}
                onValueChange={(v) => update("listingType", v)}
              >
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_LISTING.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.listingType === "rent" && (
            <div className="space-y-2">
              <Label>Periode Sewa</Label>
              <Select
                value={form.rentPeriod}
                onValueChange={(v) => update("rentPeriod", v)}
              >
                <SelectTrigger id="rentPeriod" className="bg-background border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENT_PERIOD.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Harga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga *</Label>
              <PriceInput
                id="price"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0"
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
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="field-address" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Lokasi</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gunakan peta untuk menentukan titik lokasi, atau pilih alamat dari API. Alamat jalan bisa diketik manual.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddressSelector
            value={{
              address: form.address,
              province: form.province,
              city: form.city,
              district: form.district,
              latitude: form.latitude,
              longitude: form.longitude,
              postalCode: form.postalCode,
            }}
            onChange={handleAddressChange}
          />
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos (opsional)</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              placeholder="12110"
              className="bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Gambar (Opsional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Unggah foto properti. Maks. 10 gambar, {MAX_SIZE_MB}MB per gambar.
            Format: JPG, PNG, WEBP.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageFiles.map((src, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 size-7 rounded-full opacity-90 group-hover:opacity-100"
                  onClick={() => removeImage(i)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            {imageFiles.length < MAX_IMAGES && (
              <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Upload className="size-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  Tambah ({imageFiles.length}/{MAX_IMAGES})
                </span>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitLoading}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {submitLoading && <Loader2 className="size-4 animate-spin mr-2" />}
          Publikasikan Properti
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/")}
          className="border-border"
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
