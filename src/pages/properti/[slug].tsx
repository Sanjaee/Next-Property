import React from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Image from "next/image";
import { db } from "@/db";
import { properti, properti_images, detail_properti, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Navbar from "@/components/general/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Home,
  BedDouble,
  Bath,
  Maximize2,
  Car,
  TreePine,
  Waves,
  Shield,
  Wind,
  Wifi,
  ParkingCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  contactPropertyMessageSchema,
  getFirstZodError,
  scrollToInvalidField,
} from "@/lib/schemas";

const PropertyLocationMap = dynamic(
  () =>
    import("@/components/map/PropertyLocationMap").then((m) => m.PropertyLocationMap),
  { ssr: false }
);

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

const conditionLabels: Record<string, string> = {
  new: "Baru",
  used: "Bekas",
  renovated: "Renovasi",
};

const certLabels: Record<string, string> = {
  SHM: "SHM",
  HGB: "HGB",
  SHSRS: "SHSRS",
  girik: "Girik",
  other: "Lainnya",
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

function formatPrice(
  price: string,
  unit: string,
  listingType: string,
  rentPeriod?: string | null
) {
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

export default function PropertiDetailPage({ data }: { data: PageData | null }) {
  const router = useRouter();
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [contactMessage, setContactMessage] = React.useState("");
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);

  const buildContactBody = (message: string, propertyName: string, url: string) => {
    const t = message.trim();
    const footer = `\n\n---\nProperti: ${propertyName}\n${url}`;
    return t ? `${t}${footer}` : footer.trim();
  };

  /** Nomor untuk wa.me (62…) dari nilai di DB */
  const toWhatsAppDigits = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    if (digits.length >= 9) return `62${digits}`;
    return null;
  };

  const openOwnerEmail = (ownerEmail: string, propertyName: string, url: string) => {
    const parsed = contactPropertyMessageSchema.safeParse({ message: contactMessage });
    if (!parsed.success) {
      scrollToInvalidField(parsed.error);
      toast({
        title: "Data tidak valid",
        description: getFirstZodError(parsed.error),
        variant: "destructive",
      });
      return;
    }
    const body = buildContactBody(parsed.data.message, propertyName, url);
    const subject = encodeURIComponent(`Minat properti: ${propertyName}`);
    const mailto = `mailto:${ownerEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      window.location.href = mailto;
    }
  };

  const openOwnerWhatsApp = (phoneRaw: string | null | undefined, propertyName: string, url: string) => {
    const parsed = contactPropertyMessageSchema.safeParse({ message: contactMessage });
    if (!parsed.success) {
      scrollToInvalidField(parsed.error);
      toast({
        title: "Data tidak valid",
        description: getFirstZodError(parsed.error),
        variant: "destructive",
      });
      return;
    }
    const wa = toWhatsAppDigits(phoneRaw);
    if (!wa) {
      toast({
        title: "WhatsApp tidak tersedia",
        description: "Pemilik belum mencantumkan nomor telepon.",
        variant: "destructive",
      });
      return;
    }
    const body = buildContactBody(parsed.data.message, propertyName, url);
    const href = `https://wa.me/${wa}?text=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  if (!data) {
    return (
      <div
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background`}
      >
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

  const { properti: p, detail, images, owner } = data;
  const mainImage =
    images.find((i) => i.imageType === "thumbnail")?.imageUrl ||
    images[0]?.imageUrl ||
    PLACEHOLDER;
  const galleryUrls = images
    .filter((i) => i.imageType === "gallery")
    .map((g) => g.imageUrl)
    .filter((url) => url !== mainImage);
  const displayImages = [mainImage, ...galleryUrls].filter(Boolean);
  const hasMultipleImages = displayImages.length > 1;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: p.name,
          url: window.location.href,
        });
      } catch {
        navigator.clipboard?.writeText(window.location.href);
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  const landArea = detail?.landArea ? Number(detail.landArea) : null;
  const buildingArea = detail?.buildingArea ? Number(detail.buildingArea) : null;
  const sqft = buildingArea ?? landArea;

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1">
        {/* Top bar */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="size-4 mr-2" />
            Kembali
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSaved(!saved)}
              className={saved ? "text-red-500" : ""}
            >
              <Heart
                className={`size-4 ${saved ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6 mt-20">
              {/* Image gallery - Carousel */}
              <div className="relative rounded-xl overflow-hidden h-80 bg-muted">
                {/* Slide */}
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full cursor-zoom-in focus:outline-none"
                  onClick={() => setImageDialogOpen(true)}
                  aria-label="Lihat gambar lebih besar"
                >
                  <Image
                    src={displayImages[slideIndex] || PLACEHOLDER}
                    alt={`${p.name} - ${slideIndex + 1}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority={slideIndex === 0}
                  />
                </button>

                {/* Prev / Next */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Gambar sebelumnya"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Gambar berikutnya"
                    >
                      <ChevronRight className="size-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {displayImages.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlideIndex(idx);
                          }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === slideIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                          }`}
                          aria-label={`Gambar ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {/* Counter */}
                    <span className="absolute top-3 right-3 z-10 px-2 py-1 rounded-md bg-black/50 text-white text-xs">
                      {slideIndex + 1} / {displayImages.length}
                    </span>
                  </>
                )}
              </div>

              {/* Dialog - Gambar diperbesar */}
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 border-0 bg-black/95 gap-0 overflow-hidden [&>button]:right-2 [&>button]:top-2 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white">
                  <div className="relative w-full h-[85vh] flex items-center justify-center">
                    <Image
                      src={displayImages[slideIndex] || PLACEHOLDER}
                      alt={`${p.name} - ${slideIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="95vw"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {hasMultipleImages && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSlideIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          aria-label="Gambar sebelumnya"
                        >
                          <ChevronLeft className="size-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlideIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          aria-label="Gambar berikutnya"
                        >
                          <ChevronRight className="size-6" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-center text-white/80 text-sm py-2">
                    {slideIndex + 1} / {displayImages.length}
                  </p>
                </DialogContent>
              </Dialog>

              {/* Title & price */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
                  <p className="text-xl font-bold text-orange-500 shrink-0">
                    {formatPrice(p.price, p.priceUnit, p.listingType, p.rentPeriod)}
                  </p>
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="size-4 shrink-0" />
                  {p.address}, {p.district}, {p.city}, {p.province}
                  {p.postalCode && ` ${p.postalCode}`}
                </p>
              </div>

              {/* Key features */}
              <div className="flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Home className="size-4 text-muted-foreground" />
                  {typeLabels[p.type] ?? p.type}
                </span>
                {detail?.bedroomCount != null && (
                  <span className="flex items-center gap-2">
                    <BedDouble className="size-4 text-muted-foreground" />
                    {detail.bedroomCount} Kamar Tidur
                  </span>
                )}
                {detail?.bathroomCount != null && (
                  <span className="flex items-center gap-2">
                    <Bath className="size-4 text-muted-foreground" />
                    {detail.bathroomCount} Kamar Mandi
                  </span>
                )}
                {sqft != null && (
                  <span className="flex items-center gap-2">
                    <Maximize2 className="size-4 text-muted-foreground" />
                    {sqft.toLocaleString("id-ID")} m²
                  </span>
                )}
              </div>

              {/* Property detail / description */}
              <section>
                <h2 className="text-lg font-semibold mb-2">Detail Properti</h2>
                <p
                  className={`text-muted-foreground ${
                    showFullDesc ? "" : "line-clamp-4"
                  }`}
                >
                  {p.description}
                </p>
                {p.description.length > 200 && (
                  <button
                    type="button"
                    className="text-primary text-sm font-medium mt-1 hover:underline"
                    onClick={() => setShowFullDesc(!showFullDesc)}
                  >
                    {showFullDesc ? "Sembunyikan" : "Tampilkan lebih banyak"}
                  </button>
                )}
              </section>

              {/* Location */}
              <section>
                <h2 className="text-lg font-semibold mb-3">Lokasi</h2>
                <PropertyLocationMap longitude={lng} latitude={lat} />
                <Button variant="outline" className="mt-2" asChild>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="size-4 mr-2" />
                    Buka di Google Maps
                  </a>
                </Button>
              </section>

              {/* Interior & Exterior specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {detail && (
                  <>
                    <section className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">Interior</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {detail.bedroomCount != null && (
                          <li>
                            <strong className="text-foreground">Kamar Tidur:</strong>{" "}
                            {detail.bedroomCount}
                          </li>
                        )}
                        {detail.bathroomCount != null && (
                          <li>
                            <strong className="text-foreground">Kamar Mandi:</strong>{" "}
                            {detail.bathroomCount}
                          </li>
                        )}
                        {detail.floorCount != null && (
                          <li>
                            <strong className="text-foreground">Lantai:</strong>{" "}
                            {detail.floorCount}
                          </li>
                        )}
                        {detail.buildingArea != null && (
                          <li>
                            <strong className="text-foreground">Luas Bangunan:</strong>{" "}
                            {Number(detail.buildingArea).toLocaleString("id-ID")} m²
                          </li>
                        )}
                        {detail.isFurnished && (
                          <li className="flex items-center gap-1.5">
                            <span className="text-foreground">Furnished</span>
                          </li>
                        )}
                        {detail.hasAc && (
                          <li className="flex items-center gap-1.5">
                            <Wind className="size-3.5" />
                            AC
                          </li>
                        )}
                        {detail.hasWifi && (
                          <li className="flex items-center gap-1.5">
                            <Wifi className="size-3.5" />
                            Wi-Fi
                          </li>
                        )}
                        {detail.electricityCapacity != null && (
                          <li>
                            <strong className="text-foreground">Daya Listrik:</strong>{" "}
                            {detail.electricityCapacity} VA
                          </li>
                        )}
                        {detail.waterSource && (
                          <li>
                            <strong className="text-foreground">Sumber Air:</strong>{" "}
                            {detail.waterSource}
                          </li>
                        )}
                      </ul>
                    </section>
                    <section className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">Eksterior</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {detail.landArea != null && (
                          <li>
                            <strong className="text-foreground">Luas Tanah:</strong>{" "}
                            {Number(detail.landArea).toLocaleString("id-ID")} m²
                          </li>
                        )}
                        {detail.hasGarden && (
                          <li className="flex items-center gap-1.5">
                            <TreePine className="size-3.5" />
                            Taman
                          </li>
                        )}
                        {detail.hasSwimmingPool && (
                          <li className="flex items-center gap-1.5">
                            <Waves className="size-3.5" />
                            Kolam Renang
                          </li>
                        )}
                        {detail.hasSecurity && (
                          <li className="flex items-center gap-1.5">
                            <Shield className="size-3.5" />
                            Keamanan 24/7
                          </li>
                        )}
                        {(detail.garageCount != null || detail.carportCount != null) && (
                          <li className="flex items-center gap-1.5">
                            <Car className="size-3.5" />
                            Garasi: {detail.garageCount ?? 0}, Carport:{" "}
                            {detail.carportCount ?? 0}
                          </li>
                        )}
                        {detail.hasParking && (
                          <li className="flex items-center gap-1.5">
                            <ParkingCircle className="size-3.5" />
                            Parkir
                          </li>
                        )}
                        {detail.condition && (
                          <li>
                            <strong className="text-foreground">Kondisi:</strong>{" "}
                            {conditionLabels[detail.condition] ?? detail.condition}
                          </li>
                        )}
                        {detail.certificateType && (
                          <li>
                            <strong className="text-foreground">Sertifikat:</strong>{" "}
                            {certLabels[detail.certificateType] ?? detail.certificateType}
                          </li>
                        )}
                        {detail.yearBuilt != null && (
                          <li>
                            <strong className="text-foreground">Tahun Dibangun:</strong>{" "}
                            {detail.yearBuilt}
                          </li>
                        )}
                        {detail.facingDirection && (
                          <li>
                            <strong className="text-foreground">Hadap:</strong>{" "}
                            {detail.facingDirection}
                          </li>
                        )}
                      </ul>
                    </section>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar - Contact */}
            <div className="lg:col-span-1">
              <div className="sticky top-40">
                <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
                  <h3 className="font-semibold text-lg">Hubungi Pemilik</h3>
                  {owner ? (
                    <>
                      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                        <div className="flex gap-2 min-w-0">
                          <Mail className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <a
                              href={`mailto:${owner.email}`}
                              className="font-medium text-foreground break-all hover:underline"
                            >
                              {owner.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2 min-w-0">
                          <Phone className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">WhatsApp / Telepon</p>
                            {owner.phone ? (
                              <span className="font-medium text-foreground break-all">{owner.phone}</span>
                            ) : (
                              <span className="text-muted-foreground">Belum diisi pemilik</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Pesan</Label>
                        <Textarea
                          id="message"
                          data-field="message"
                          placeholder="Tulis pesan singkat (wajib). Akan disertakan ke email atau WhatsApp."
                          rows={4}
                          className="bg-background resize-none border-border"
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tombol di bawah membuka aplikasi email atau WhatsApp dengan pesan Anda dan tautan properti ini.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
                          onClick={() =>
                            openOwnerEmail(owner.email, p.name, typeof window !== "undefined" ? window.location.href : "")
                          }
                        >
                          <Mail className="size-4" />
                          Buka email
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                          disabled={!owner.phone}
                          onClick={() =>
                            openOwnerWhatsApp(owner.phone, p.name, typeof window !== "undefined" ? window.location.href : "")
                          }
                        >
                          <MessageCircle className="size-4" />
                          Buka WhatsApp
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Diposting oleh {owner.fullName}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Data pemilik tidak tersedia.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type PageData = {
  properti: {
    id: string;
    name: string;
    slug: string;
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
    postalCode: string | null;
    latitude: string;
    longitude: string;
  };
  detail: {
    landArea: string | null;
    buildingArea: string | null;
    floorCount: number | null;
    bedroomCount: number | null;
    bathroomCount: number | null;
    garageCount: number | null;
    carportCount: number | null;
    condition: string | null;
    certificateType: string | null;
    yearBuilt: number | null;
    facingDirection: string | null;
    isFurnished: boolean;
    hasSwimmingPool: boolean;
    hasGarden: boolean;
    hasSecurity: boolean;
    hasAc: boolean;
    hasWifi: boolean;
    hasParking: boolean;
    electricityCapacity: number | null;
    waterSource: string | null;
  } | null;
  images: { imageUrl: string; imageType: string }[];
  owner: { fullName: string; email: string; phone: string | null } | null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  if (!slug) return { props: { data: null } };

  const [row] = await db
    .select()
    .from(properti)
    .where(eq(properti.slug, slug))
    .limit(1);

  if (!row) return { props: { data: null } };

  const [detailRow] = await db
    .select()
    .from(detail_properti)
    .where(eq(detail_properti.propertiId, row.id))
    .limit(1);

  const imageRows = await db
    .select({ imageUrl: properti_images.imageUrl, imageType: properti_images.imageType })
    .from(properti_images)
    .where(eq(properti_images.propertiId, row.id))
    .orderBy(asc(properti_images.sortOrder));

  const [ownerRow] = await db
    .select({
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, row.ownerId))
    .limit(1);

  return {
    props: {
      data: {
        properti: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          type: row.type,
          listingType: row.listingType,
          price: String(row.price),
          priceUnit: row.priceUnit,
          rentPeriod: row.rentPeriod,
          address: row.address,
          province: row.province,
          city: row.city,
          district: row.district,
          postalCode: row.postalCode,
          latitude: String(row.latitude),
          longitude: String(row.longitude),
        },
        detail: detailRow
          ? {
              landArea: detailRow.landArea ? String(detailRow.landArea) : null,
              buildingArea: detailRow.buildingArea
                ? String(detailRow.buildingArea)
                : null,
              floorCount: detailRow.floorCount,
              bedroomCount: detailRow.bedroomCount,
              bathroomCount: detailRow.bathroomCount,
              garageCount: detailRow.garageCount,
              carportCount: detailRow.carportCount,
              condition: detailRow.condition,
              certificateType: detailRow.certificateType,
              yearBuilt: detailRow.yearBuilt,
              facingDirection: detailRow.facingDirection,
              isFurnished: detailRow.isFurnished,
              hasSwimmingPool: detailRow.hasSwimmingPool,
              hasGarden: detailRow.hasGarden,
              hasSecurity: detailRow.hasSecurity,
              hasAc: detailRow.hasAc,
              hasWifi: detailRow.hasWifi,
              hasParking: detailRow.hasParking,
              electricityCapacity: detailRow.electricityCapacity,
              waterSource: detailRow.waterSource,
            }
          : null,
        images: imageRows.map((r) => ({
          imageUrl: r.imageUrl,
          imageType: r.imageType,
        })),
        owner: ownerRow
          ? {
              fullName: ownerRow.fullName,
              email: ownerRow.email,
              phone: ownerRow.phone ?? null,
            }
          : null,
      },
    },
  };
};
