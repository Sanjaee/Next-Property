import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  decimal,
  integer,
} from "drizzle-orm/pg-core";

// =========================================
// Enums — Auth
// =========================================
export const userTypeEnum = pgEnum("user_type", ["member", "admin", "moderator"]);
export const loginTypeEnum = pgEnum("login_type", ["credential", "google"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

// =========================================
// Enums — Properti
// =========================================
export const propertiTypeEnum = pgEnum("properti_type", [
  "house",
  "apartment",
  "villa",
  "land",
  "commercial",
]);
export const propertiStatusEnum = pgEnum("properti_status", [
  "active",
  "sold",
  "rented",
  "inactive",
]);
export const listingTypeEnum = pgEnum("listing_type", ["sale", "rent"]);
export const priceUnitEnum = pgEnum("price_unit", ["IDR", "USD"]);
export const rentPeriodEnum = pgEnum("rent_period", ["monthly", "yearly"]);
export const propertiConditionEnum = pgEnum("properti_condition", [
  "new",
  "used",
  "renovated",
]);
export const certificateTypeEnum = pgEnum("certificate_type", [
  "SHM",
  "HGB",
  "SHSRS",
  "girik",
  "other",
]);
export const imageTypeEnum = pgEnum("image_type", [
  "thumbnail",
  "gallery",
  "video",
]);

// =========================================
// Users table
// =========================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  phone: varchar("phone", { length: 20 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  password: text("password"),
  userType: userTypeEnum("user_type").default("member").notNull(),
  profilePhoto: text("profile_photo"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  lastLogin: timestamp("last_login"),
  loginType: loginTypeEnum("login_type").default("credential").notNull(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =========================================
// Sessions table
// =========================================
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
});

// =========================================
// OTP Codes table
// =========================================
export const otp_codes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================
// Verification tokens table
// =========================================
export const verification_tokens = pgTable("verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================
// Properti table
// =========================================
export const properti = pgTable("properti", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Info utama
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  type: propertiTypeEnum("type").notNull(),
  status: propertiStatusEnum("status").default("active").notNull(),
  listingType: listingTypeEnum("listing_type").notNull(),

  // Harga
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  priceUnit: priceUnitEnum("price_unit").default("IDR").notNull(),
  rentPeriod: rentPeriodEnum("rent_period"),

  // Lokasi
  address: text("address").notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),

  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),

  isFeatured: boolean("is_featured").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =========================================
// Properti Images table
// - image_type = "thumbnail" → foto cover utama
// - image_type = "gallery"   → foto galeri
// - image_type = "video"     → url video
// =========================================
export const properti_images = pgTable("properti_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertiId: uuid("properti_id")
    .references(() => properti.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  imageType: imageTypeEnum("image_type").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================
// Detail Properti table - one-to-one dengan properti
// =========================================
export const detail_properti = pgTable("detail_properti", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertiId: uuid("properti_id")
    .references(() => properti.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // Ukuran
  landArea: decimal("land_area", { precision: 10, scale: 2 }),
  buildingArea: decimal("building_area", { precision: 10, scale: 2 }),
  floorCount: integer("floor_count"),

  // Kamar
  bedroomCount: integer("bedroom_count"),
  bathroomCount: integer("bathroom_count"),
  garageCount: integer("garage_count"),
  carportCount: integer("carport_count"),

  // Kondisi & legalitas
  condition: propertiConditionEnum("condition"),
  certificateType: certificateTypeEnum("certificate_type"),
  yearBuilt: integer("year_built"),
  facingDirection: varchar("facing_direction", { length: 20 }),

  // Fasilitas internal
  isFurnished: boolean("is_furnished").default(false).notNull(),
  hasSwimmingPool: boolean("has_swimming_pool").default(false).notNull(),
  hasGarden: boolean("has_garden").default(false).notNull(),
  hasSecurity: boolean("has_security").default(false).notNull(),
  hasAc: boolean("has_ac").default(false).notNull(),
  hasWifi: boolean("has_wifi").default(false).notNull(),
  hasParking: boolean("has_parking").default(false).notNull(),

  // Utilitas
  electricityCapacity: integer("electricity_capacity"),
  waterSource: varchar("water_source", { length: 100 }),

  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =========================================
// Type exports
// =========================================

// Auth
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type OtpCode = typeof otp_codes.$inferSelect;
export type NewOtpCode = typeof otp_codes.$inferInsert;
export type VerificationToken = typeof verification_tokens.$inferSelect;
export type NewVerificationToken = typeof verification_tokens.$inferInsert;

// Properti
export type Properti = typeof properti.$inferSelect;
export type NewProperti = typeof properti.$inferInsert;
export type DetailProperti = typeof detail_properti.$inferSelect;
export type NewDetailProperti = typeof detail_properti.$inferInsert;
export type PropertiImage = typeof properti_images.$inferSelect;
export type NewPropertiImage = typeof properti_images.$inferInsert;