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
import { Loader2 } from "lucide-react";
import { PropertiImageUpload, type ImageItemType } from "./PropertiImageUpload";
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

export function PropertiEditForm({ editId }: { editId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [imageItems, setImageItems] = useState<ImageItemType[]>([]);
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
        const urls = data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : []);
        const urlList = Array.isArray(urls) ? urls : [];
        setImageItems(urlList.map((src) => ({ src, isNew: false })));
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
      for (const item of imageItems) {
        if (item.isNew) {
          const uploadRes = await fetch("/api/upload/cloudinary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: item.src }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah gambar");
          imageUrls.push(uploadData.url);
        } else {
          imageUrls.push(item.src);
        }
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
          imageUrls,
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
                <SelectTrigger id="type" className="bg-background border-border w-full">
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
                <SelectTrigger id="listingType" className="bg-background border-border w-full">
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

      <Card id="field-address" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Lokasi</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gunakan peta untuk menentukan titik lokasi, atau pilih alamat dari API.
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

      <PropertiImageUpload
        images={imageItems}
        onImagesChange={setImageItems}
      />

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
