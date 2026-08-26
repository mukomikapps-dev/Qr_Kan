import { pgTable, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  isPro: boolean("is_pro").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  activeProfileId: text("active_profile_id").references(() => profiles.id, { onDelete: "set null" }),
  // Subscription fields
  subscriptionTier: text("subscription_tier").default("free"), // "free", "pro", "business"
  subscriptionStatus: text("subscription_status").default("active"), // "active", "cancelled", "expired", "pending"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeProfileIdx: index("idx_users_active_profile_id").on(table.activeProfileId),
}));

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  logoUrl: text("logo_url"),
  bgType: text("bg_type").default("none"),
  bgSolidColor: text("bg_solid_color"),
  bgImageUrl: text("bg_image_url"),
  bgPatternId: text("bg_pattern_id"),
  bgGradientColors: text("bg_gradient_colors"),
  showAvatar: boolean("show_avatar").notNull().default(true),
  showDisplayName: boolean("show_display_name").notNull().default(true),
  showBio: boolean("show_bio").notNull().default(true),
  showLogo: boolean("show_logo").notNull().default(true),
  showQr: boolean("show_qr").notNull().default(true),
  showIcons: boolean("show_icons").notNull().default(true),
  stickyHeaderBg: boolean("sticky_header_bg").notNull().default(true),
  themePresetId: text("theme_preset_id").default("monochrome"),
  themeJson: text("theme_json"),
  useCustomColors: boolean("use_custom_colors").notNull().default(false),
  customColors: text("custom_colors"),
  detailedColors: text("detailed_colors"),
  status: text("status"),
  statusType: text("status_type").default("text"), // "text" or "image"
  coverImageUrl: text("cover_image_url"),
  category: text("category"), // Category untuk grouping di explore page
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_profiles_user_id").on(table.userId),
  usernameIdx: index("idx_profiles_username").on(table.username),
  categoryIdx: index("idx_profiles_category").on(table.category),
}));

export const blocks = pgTable("blocks", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  dataJson: text("data_json").notNull(),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  scheduledFrom: timestamp("scheduled_from"),
  scheduledTo: timestamp("scheduled_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index("idx_blocks_profile_id").on(table.profileId),
}));

export const visits = pgTable("visits", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ts: timestamp("ts").notNull().defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
}, (table) => ({
  profileIdIdx: index("idx_visits_profile_id").on(table.profileId),
}));

export const clicks = pgTable("clicks", {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => blocks.id, { onDelete: "cascade" }),
  variantId: text("variant_id"),
  ts: timestamp("ts").notNull().defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
}, (table) => ({
  blockIdIdx: index("idx_clicks_block_id").on(table.blockId),
}));

export const blockVariants = pgTable("block_variants", {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => blocks.id, { onDelete: "cascade" }),
  variantName: text("variant_name").notNull(),
  dataJson: text("data_json").notNull(),
  trafficSplit: integer("traffic_split").notNull().default(50),
  impressions: integer("impressions").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  blockIdIdx: index("idx_block_variants_block_id").on(table.blockId),
}));

// Tabel mapping untuk category (alternatif jika kolom category belum ada di profiles)
export const profileCategories = pgTable("profile_categories", {
  profileId: text("profile_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("idx_profile_categories_category").on(table.category),
  profileIdIdx: index("idx_profile_categories_profile_id").on(table.profileId),
}));

// Payment requests table for tracking subscription payments
export const paymentRequests = pgTable("payment_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(), // "pro", "business"
  amount: integer("amount").notNull(), // Amount in IDR
  status: text("status").notNull().default("pending"), // "pending", "paid", "expired", "cancelled"
  mootaTransactionId: text("moota_transaction_id"), // Moota transaction ID
  virtualAccount: text("virtual_account"), // Virtual account number from Moota
  paymentMethod: text("payment_method"), // "bank_transfer", etc.
  expiresAt: timestamp("expires_at"), // Payment expiration time
  paidAt: timestamp("paid_at"), // When payment was confirmed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_payment_requests_user_id").on(table.userId),
  statusIdx: index("idx_payment_requests_status").on(table.status),
  mootaTransactionIdIdx: index("idx_payment_requests_moota_transaction_id").on(table.mootaTransactionId),
}));
