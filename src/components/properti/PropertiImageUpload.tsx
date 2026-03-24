"use client";

import { useState } from "react";
import { Upload, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MAX_IMAGES = 10;
const MAX_SIZE_MB = 3;

export interface ImageItemType {
  src: string;
  isNew: boolean; // true = base64 perlu di-upload, false = URL existing
}

interface PropertiImageUploadProps {
  images: ImageItemType[];
  onImagesChange: (images: ImageItemType[]) => void;
}

export function PropertiImageUpload({
  images,
  onImagesChange,
}: PropertiImageUploadProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIndex, setDialogIndex] = useState(0);

  const totalImages = images.length;
  const allSrcs = images.map((i) => i.src);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    const remaining = MAX_IMAGES - totalImages;
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

    const results: (string | null)[] = new Array(validFiles.length).fill(null);
    let loaded = 0;

    validFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        results[idx] = reader.result as string;
        loaded++;
        if (loaded === validFiles.length) {
          const newItems = results
            .filter((r): r is string => r != null)
            .map((src) => ({ src, isNew: true }));
          onImagesChange([...images, ...newItems].slice(0, MAX_IMAGES));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const setAsThumbnail = (index: number) => {
    if (index === 0) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.unshift(moved);
    onImagesChange(reordered);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
    if (dialogOpen) {
      const nextIndex = Math.min(dialogIndex, images.length - 2);
      setDialogIndex(Math.max(0, nextIndex));
    }
  };

  const openDialog = (index: number) => {
    setDialogIndex(index);
    setDialogOpen(true);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="px-4 py-5 sm:px-6 sm:py-6">
        <CardTitle className="text-lg sm:text-xl">Gambar (Opsional)</CardTitle>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Unggah foto properti. Maks. {MAX_IMAGES} gambar, {MAX_SIZE_MB}MB per gambar.
          Format: JPG, PNG, WEBP. Gambar pertama = thumbnail (muncul di peta).
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {images.map((item, i) => (
            <ImageItem
              key={`img-${i}-${item.src.slice(0, 30)}`}
              src={item.src}
              index={i}
              isThumbnail={i === 0}
              onSetThumbnail={() => setAsThumbnail(i)}
              onRemove={() => removeImage(i)}
              onClick={() => openDialog(i)}
            />
          ))}
          {totalImages < MAX_IMAGES && (
            <label className="flex min-h-44 sm:min-h-52 md:min-h-60 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-3 py-6 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/60">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Upload className="size-10 sm:size-12 text-muted-foreground" />
              <span className="text-sm sm:text-base font-medium text-foreground text-center">
                Tambah gambar
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground text-center">
                {totalImages}/{MAX_IMAGES}
              </span>
            </label>
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 border-0 bg-black/95 gap-0 overflow-hidden [&>button]:right-2 [&>button]:top-2 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white">
          <div className="relative w-full h-[85vh] flex items-center justify-center">
            {allSrcs[dialogIndex] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={allSrcs[dialogIndex]}
                alt={`Gambar ${dialogIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {allSrcs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setDialogIndex((i) =>
                      i <= 0 ? allSrcs.length - 1 : i - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Gambar sebelumnya"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDialogIndex((i) =>
                      i >= allSrcs.length - 1 ? 0 : i + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Gambar berikutnya"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          <p className="text-center text-white/80 text-sm py-2">
            {dialogIndex + 1} / {allSrcs.length}
            {dialogIndex === 0 && " (Thumbnail / tampil di peta)"}
          </p>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ImageItem({
  src,
  index,
  isThumbnail,
  onSetThumbnail,
  onRemove,
  onClick,
}: {
  src: string;
  index: number;
  isThumbnail: boolean;
  onSetThumbnail: () => void;
  onRemove: () => void;
  onClick: () => void;
}) {
  return (
    <div className="relative min-h-44 sm:min-h-52 md:min-h-60 w-full overflow-hidden rounded-xl border-2 border-border bg-muted/20 shadow-sm group">
      <button
        type="button"
        className="absolute inset-0 z-0 flex h-full min-h-44 sm:min-h-52 md:min-h-60 w-full cursor-zoom-in items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onClick}
        aria-label="Lihat gambar lebih besar"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Gambar ${index + 1}`}
          className="h-full w-full min-h-44 sm:min-h-52 md:min-h-60 object-cover"
        />
      </button>
      {isThumbnail && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-primary-foreground text-xs font-medium shadow sm:text-sm">
          <Star className="size-3.5 shrink-0 fill-current sm:size-4" />
          Thumbnail
        </div>
      )}
      {!isThumbnail && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute top-2 left-2 z-10 h-auto min-h-9 max-w-[calc(100%-3.5rem)] px-2 py-1.5 text-[10px] leading-tight opacity-95 shadow sm:max-w-[85%] sm:text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onSetThumbnail();
          }}
        >
          <Star className="size-3 shrink-0 sm:size-3.5" />
          <span className="line-clamp-2 text-left">Jadikan thumbnail</span>
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 z-10 size-9 rounded-full shadow sm:size-10"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Hapus gambar"
      >
        <X className="size-4 sm:size-5" />
      </Button>
    </div>
  );
}
