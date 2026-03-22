"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";

export interface PropertiUserItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  listingType: string;
  price: string;
  priceUnit: string;
  rentPeriod: string | null;
  city: string;
  district: string;
  imageUrl: string | null;
}

const typeLabels: Record<string, string> = {
  house: "Rumah",
  apartment: "Apartemen",
  villa: "Villa",
  land: "Tanah",
  commercial: "Komersial",
};

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&h=200&fit=crop";

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

export function PropertiListUser() {
  const router = useRouter();
  const [items, setItems] = useState<PropertiUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properti/my")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Properti Saya</h2>
        <p className="text-sm text-muted-foreground">
          Klik untuk mengubah data properti
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => router.push(`/properti/edit/${p.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left"
              >
                <div className="relative w-16 h-12 shrink-0 rounded overflow-hidden bg-muted">
                  <Image
                    src={p.imageUrl || PLACEHOLDER}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[p.type] ?? p.type} • {p.district}, {p.city}
                  </p>
                  <p className="text-sm font-medium">
                    {formatPrice(p.price, p.priceUnit, p.listingType, p.rentPeriod)}
                  </p>
                </div>
                <Pencil className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
