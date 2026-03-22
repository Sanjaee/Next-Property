import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { db } from "@/db";
import { properti } from "@/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/general/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const typeLabels: Record<string, string> = {
  house: "Rumah",
  apartment: "Apartemen",
  villa: "Villa",
  land: "Tanah",
  commercial: "Komersial",
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

export default function PropertiDetailPage({
  properti: p,
}: {
  properti: {
    id: string;
    name: string;
    description: string;
    type: string;
    listingType: string;
    price: string;
    priceUnit: string;
    rentPeriod: string | null;
    address: string;
    province: string;
    city: string;
    district: string;
    latitude: string;
    longitude: string;
  } | null;
}) {
  const router = useRouter();

  if (!p) {
    return (
      <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-background`}>
        <Navbar />
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Properti tidak ditemukan.</p>
          <Button variant="outline" onClick={() => router.push("/")} className="mt-4">
            Kembali ke Peta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-20">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="size-4 mr-2" />
          Kembali ke Peta
        </Button>
        <Card className="border-border bg-card">
          <CardHeader>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {typeLabels[p.type] ?? p.type} • {p.listingType === "rent" ? "Sewa" : "Jual"}
            </span>
            <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
            <p className="text-lg font-medium text-foreground">
              {formatPrice(p.price, p.priceUnit, p.listingType, p.rentPeriod)}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0 mt-0.5" />
              <div>
                <p>{p.address}</p>
                <p className="text-sm">
                  {p.district}, {p.city}, {p.province}
                </p>
              </div>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{p.description}</p>
            <Button asChild>
              <a
                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <MapPin className="size-4 mr-2" />
                Lihat di Google Maps
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  if (!slug) return { props: { properti: null } };

  const [row] = await db
    .select({
      id: properti.id,
      name: properti.name,
      description: properti.description,
      type: properti.type,
      listingType: properti.listingType,
      price: properti.price,
      priceUnit: properti.priceUnit,
      rentPeriod: properti.rentPeriod,
      address: properti.address,
      province: properti.province,
      city: properti.city,
      district: properti.district,
      latitude: properti.latitude,
      longitude: properti.longitude,
    })
    .from(properti)
    .where(eq(properti.slug, slug))
    .limit(1);

  if (!row) return { props: { properti: null } };

  return {
    props: {
      properti: {
        ...row,
        latitude: String(row.latitude),
        longitude: String(row.longitude),
      },
    },
  };
};
