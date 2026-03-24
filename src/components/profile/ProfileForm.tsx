"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  profileFormSchema,
  normalizeProfilePayload,
  getFirstZodError,
  scrollToInvalidField,
} from "@/lib/schemas";
import { ProfileDateOfBirthField } from "@/components/profile/ProfileDateOfBirthField";

const GENDER_OPTIONS = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
  { value: "other", label: "Lainnya" },
] as const;

const MAX_PHOTO_MB = 3;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

export function ProfileForm() {
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [loadData, setLoadData] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [loginType, setLoginType] = useState<string>("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    gender: "" as "" | "male" | "female" | "other",
    dateOfBirth: "",
    profilePhoto: "",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat profil");
        return res.json();
      })
      .then((data) => {
        setEmail(data.email ?? "");
        setLoginType(data.loginType ?? "");
        setForm({
          fullName: data.fullName ?? "",
          username: data.username ?? "",
          phone: data.phone ?? "",
          gender: data.gender && ["male", "female", "other"].includes(data.gender)
            ? data.gender
            : "",
          dateOfBirth: data.dateOfBirth ?? "",
          profilePhoto: data.profilePhoto ?? "",
        });
      })
      .catch((err) => {
        toast({
          title: "Gagal memuat data",
          description: err instanceof Error ? err.message : "Coba lagi",
          variant: "destructive",
        });
      })
      .finally(() => setLoadData(false));
  }, [toast]);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format tidak valid",
        description: "Gunakan JPG, PNG, atau WEBP.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast({
        title: "Ukuran terlalu besar",
        description: `Maksimal ${MAX_PHOTO_MB}MB.`,
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadLoading(true);
      try {
        const uploadRes = await fetch("/api/upload/cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, folder: "profiles" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengunggah");
        }
        update("profilePhoto", uploadData.url);
        toast({ title: "Foto profil diunggah" });
      } catch (err) {
        toast({
          title: "Gagal unggah",
          description: err instanceof Error ? err.message : "Coba lagi",
          variant: "destructive",
        });
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => update("profilePhoto", "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileFormSchema.safeParse({
      ...form,
      gender: form.gender === "" ? null : form.gender,
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

    const body = normalizeProfilePayload(parsed.data);

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: body.fullName,
          username: body.username ?? null,
          phone: body.phone ?? null,
          gender: body.gender,
          dateOfBirth: body.dateOfBirth,
          profilePhoto: body.profilePhoto,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Gagal menyimpan"
        );
      }
      toast({
        title: "Profil disimpan",
        description: "Data Anda telah diperbarui.",
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Coba lagi",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loadData) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Foto profil</CardTitle>
          <p className="text-sm text-muted-foreground">
            Foto ditampilkan di navbar dan kontak. Maks. {MAX_PHOTO_MB}MB (JPG, PNG, WEBP).
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-24 border-2 border-border">
            <AvatarImage
              src={form.profilePhoto || undefined}
              alt="Foto profil"
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {getInitials(form.fullName || email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoFile}
              disabled={uploadLoading}
            />
            <Button
              type="button"
              variant="outline"
              className="border-border"
              disabled={uploadLoading}
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              <span className="ml-2">Unggah foto</span>
            </Button>
            {form.profilePhoto ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearPhoto}
                className="text-muted-foreground"
              >
                <X className="size-4 mr-1" />
                Hapus foto
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Data diri</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sesuai skema pengguna di sistem (nama, username, kontak, jenis kelamin, tanggal lahir).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama lengkap *</Label>
            <Input
              id="fullName"
              data-field="fullName"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Nama sesuai identitas"
              required
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted border-border"
            />
            <p className="text-xs text-muted-foreground">
              Email tidak dapat diubah. {loginType === "google" ? "Akun Google." : ""}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              data-field="username"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="huruf_angka (opsional)"
              className="bg-background border-border"
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">
              3–50 karakter, hanya huruf, angka, dan underscore. Kosongkan untuk menghapus.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor telepon</Label>
            <Input
              id="phone"
              data-field="phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="bg-background border-border"
              inputMode="tel"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis kelamin</Label>
              <Select
                value={form.gender || "none"}
                onValueChange={(v) =>
                  update("gender", v === "none" ? "" : v)
                }
              >
                <SelectTrigger
                  id="gender"
                  data-field="gender"
                  className="bg-background border-border w-full"
                >
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum diisi</SelectItem>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ProfileDateOfBirthField
              id="dateOfBirth"
              data-field="dateOfBirth"
              value={form.dateOfBirth}
              onValueChange={(v) => update("dateOfBirth", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={submitLoading}
        className="bg-foreground text-background hover:bg-foreground/90"
      >
        {submitLoading && <Loader2 className="size-4 animate-spin mr-2" />}
        Simpan profil
      </Button>
    </form>
  );
}
