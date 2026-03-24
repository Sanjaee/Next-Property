import { z } from "zod";

// ===========================================
// Properti Form
// ===========================================
const TIPE_PROPERTI_VALUES = ["house", "apartment", "villa", "land", "commercial"] as const;
const TIPE_LISTING_VALUES = ["sale", "rent"] as const;
const RENT_PERIOD_VALUES = ["monthly", "yearly"] as const;
const PRICE_UNIT_VALUES = ["IDR", "USD"] as const;

export const propertiFormSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
    description: z.string().min(1, "Deskripsi wajib diisi"),
    type: z.enum(TIPE_PROPERTI_VALUES, "Tipe properti tidak valid"),
    listingType: z.enum(TIPE_LISTING_VALUES, "Tipe listing tidak valid"),
    price: z.string().min(1, "Harga wajib diisi").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Harga harus angka positif"),
    priceUnit: z.enum(PRICE_UNIT_VALUES).default("IDR"),
    rentPeriod: z.enum(RENT_PERIOD_VALUES).optional().nullable(),
    address: z.string().min(1, "Alamat wajib diisi"),
    province: z.string().min(1, "Provinsi wajib diisi").max(100),
    city: z.string().min(1, "Kota wajib diisi").max(100),
    district: z.string().min(1, "Kecamatan wajib diisi").max(100),
    postalCode: z.string().max(10).optional().nullable(),
    latitude: z
      .string()
      .min(1, "Latitude wajib diisi")
      .refine((v) => {
        const n = parseFloat(v);
        return !Number.isNaN(n) && n >= -90 && n <= 90;
      }, "Latitude harus -90 sampai 90"),
    longitude: z
      .string()
      .min(1, "Longitude wajib diisi")
      .refine((v) => {
        const n = parseFloat(v);
        return !Number.isNaN(n) && n >= -180 && n <= 180;
      }, "Longitude harus -180 sampai 180"),
  })
  .refine(
    (data) => {
      if (data.listingType === "rent") return !!data.rentPeriod;
      return true;
    },
    { message: "Periode sewa wajib diisi untuk properti disewa", path: ["rentPeriod"] }
  );

export type PropertiFormData = z.infer<typeof propertiFormSchema>;

// ===========================================
// Auth - Login
// ===========================================
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ===========================================
// Auth - Register
// ===========================================
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username wajib diisi")
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter"),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ===========================================
// Auth - Reset Password Request
// ===========================================
export const resetPasswordRequestSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});

// ===========================================
// Auth - Verify OTP
// ===========================================
export const verifyOtpSchema = z.object({
  otp: z.string().min(1, "Kode OTP wajib diisi").length(6, "Kode OTP harus 6 digit"),
});

// ===========================================
// Auth - New Password (reset flow)
// ===========================================
export const newPasswordSchema = z
  .object({
    newPassword: z.string().min(1, "Password wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

// ===========================================
// Auth - Reset Password (with OTP)
// ===========================================
export const resetPasswordSchema = z
  .object({
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    otp: z.string().min(1, "Kode OTP wajib diisi").length(6, "Kode OTP harus 6 digit"),
    newPassword: z.string().min(1, "Password baru wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

// ===========================================
// Contact Form (Properti Detail)
// ===========================================
export const contactFormSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi").max(255),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().min(1, "Nomor telepon wajib diisi").max(20),
  message: z.string().min(1, "Pesan wajib diisi").max(2000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/** Form hubungi pemilik di halaman detail (hanya pesan; kontak dari data pemilik). */
export const contactPropertyMessageSchema = z.object({
  message: z.string().min(1, "Pesan wajib diisi").max(2000, "Pesan maksimal 2000 karakter"),
});

// ===========================================
// User Profile
// ===========================================
const GENDER_VALUES = ["male", "female", "other"] as const;

/** JSON `null` untuk field opsional gagal di `z.string()` — ubah ke "" dulu. */
function normalizeProfileBody(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    username: o.username == null ? "" : String(o.username),
    phone: o.phone == null ? "" : String(o.phone),
    dateOfBirth:
      o.dateOfBirth === null || o.dateOfBirth === undefined
        ? ""
        : String(o.dateOfBirth),
    profilePhoto:
      o.profilePhoto === null || o.profilePhoto === undefined
        ? ""
        : String(o.profilePhoto),
  };
}

export const profileFormSchema = z.preprocess(
  normalizeProfileBody,
  z
    .object({
      fullName: z.string().min(1, "Nama lengkap wajib diisi").max(255, "Nama maksimal 255 karakter"),
      username: z.string().max(50, "Username maksimal 50 karakter"),
      phone: z.string().max(20, "Nomor maksimal 20 karakter"),
      gender: z.enum(GENDER_VALUES).optional().nullable(),
      dateOfBirth: z.string(),
      profilePhoto: z.string(),
    })
    .superRefine((data, ctx) => {
      const u = data.username.trim();
      if (u && u.length > 0 && u.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username minimal 3 karakter",
          path: ["username"],
        });
      }
      if (u && !/^[a-zA-Z0-9_]+$/.test(u)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username hanya huruf, angka, dan underscore",
          path: ["username"],
        });
      }
      const dob = data.dateOfBirth.trim();
      if (dob) {
        const d = new Date(dob + "T12:00:00");
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tanggal lahir tidak valid",
            path: ["dateOfBirth"],
          });
        }
      }
      const photo = data.profilePhoto.trim();
      if (photo.length > 0) {
        try {
          // eslint-disable-next-line no-new
          new URL(photo);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "URL foto tidak valid",
            path: ["profilePhoto"],
          });
        }
      }
    })
);

export type ProfileFormData = z.infer<typeof profileFormSchema>;

/** Payload API setelah normalisasi string kosong → undefined */
export function normalizeProfilePayload(data: ProfileFormData) {
  return {
    fullName: data.fullName.trim(),
    username: data.username.trim() || undefined,
    phone: data.phone.trim() || undefined,
    gender: data.gender ?? null,
    dateOfBirth: data.dateOfBirth.trim() || null,
    profilePhoto: data.profilePhoto.trim() || null,
  };
}

// ===========================================
// Helper
// ===========================================
export function getFirstZodError(error: z.ZodError): string {
  const issues = "issues" in error ? (error as { issues?: Array<{ message?: string }> }).issues : [];
  const first = issues?.[0];
  return (first && "message" in first ? first.message : undefined) ?? "Data tidak valid";
}

/** Returns first error's field path for scroll/focus (e.g. "name", "rentPeriod") */
export function getFirstZodErrorPath(error: z.ZodError): string | undefined {
  const issues = "issues" in error ? (error as { issues?: Array<{ path?: (string | number)[] }> }).issues : [];
  const first = issues?.[0];
  const path = first && "path" in first ? first.path : undefined;
  if (Array.isArray(path) && path.length > 0) {
    return String(path[0]);
  }
  return undefined;
}

const LOCATION_FIELDS = ["address", "province", "city", "district", "latitude", "longitude"];

/** Scroll to invalid field and add red blink. Call after Zod validation fails. */
export function scrollToInvalidField(error: z.ZodError): void {
  const path = getFirstZodErrorPath(error);
  if (!path || typeof document === "undefined") return;

  const id = LOCATION_FIELDS.includes(path) ? "field-address" : path;
  const el = document.getElementById(id) ?? document.querySelector(`[data-field="${path}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("input-error-blink");
  const removeBlink = () => {
    el.classList.remove("input-error-blink");
    el.removeEventListener("input", removeBlink);
    el.removeEventListener("change", removeBlink);
    el.removeEventListener("blur", removeBlink);
  };
  el.addEventListener("input", removeBlink);
  el.addEventListener("change", removeBlink);
  el.addEventListener("blur", removeBlink);
  setTimeout(removeBlink, 4000);
}
