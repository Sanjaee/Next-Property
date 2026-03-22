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
    type: z.enum(TIPE_PROPERTI_VALUES, { errorMap: () => ({ message: "Tipe properti tidak valid" }) }),
    listingType: z.enum(TIPE_LISTING_VALUES, { errorMap: () => ({ message: "Tipe listing tidak valid" }) }),
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

// ===========================================
// Helper
// ===========================================
export function getFirstZodError(error: z.ZodError): string {
  const first = error.errors[0];
  return first ? first.message : "Data tidak valid";
}
