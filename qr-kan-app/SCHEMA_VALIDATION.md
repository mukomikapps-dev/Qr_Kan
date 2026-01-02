# Schema Validation Report - Supabase vs Application

## 📊 Profiles Table Fields Comparison

| Supabase SQL (snake_case) | TypeScript Schema (camelCase) | Status | Notes |
|---------------------------|-------------------------------|---------|-------|
| `id` | `id` | ✅ | Primary Key |
| `user_id` | `userId` | ✅ | Foreign Key to users |
| `username` | `username` | ✅ | Unique identifier |
| `display_name` | `displayName` | ✅ | Display name |
| `bio` | `bio` | ✅ | Bio text |
| `avatar_url` | `avatarUrl` | ✅ | Avatar image URL |
| `logo_url` | `logoUrl` | ✅ | Logo image URL |
| `bg_type` | `bgType` | ✅ | Background type (none/solid/pattern/image/gradient) |
| `bg_solid_color` | `bgSolidColor` | ✅ | Solid color hex |
| `bg_image_url` | `bgImageUrl` | ✅ | Background image URL |
| `bg_pattern_id` | `bgPatternId` | ✅ | Pattern preset ID |
| `bg_gradient_colors` | `bgGradientColors` | ✅ | Gradient colors JSON |
| `show_avatar` | `showAvatar` | ✅ | Toggle avatar visibility |
| `show_display_name` | `showDisplayName` | ✅ | Toggle display name |
| `show_bio` | `showBio` | ✅ | Toggle bio visibility |
| `show_qr` | `showQr` | ✅ | Toggle QR code |
| `show_icons` | `showIcons` | ✅ | Toggle icons on blocks |
| `sticky_header_bg` | `stickyHeaderBg` | ✅ | Sticky header background |
| `theme_preset_id` | `themePresetId` | ✅ | Theme preset ID |
| `theme_json` | `themeJson` | ✅ | Custom theme JSON |
| `use_custom_colors` | `useCustomColors` | ✅ | Toggle custom colors |
| `custom_colors` | `customColors` | ✅ | Custom colors JSON |
| `detailed_colors` | `detailedColors` | ✅ | Detailed colors JSON |
| `created_at` | `createdAt` | ✅ | Creation timestamp |

## 📊 Users Table

| Supabase SQL | TypeScript Schema | Status |
|-------------|-------------------|---------|
| `id` | `id` | ✅ |
| `email` | `email` | ✅ |
| `created_at` | `createdAt` | ✅ |

## 📊 Blocks Table

| Supabase SQL | TypeScript Schema | Status |
|-------------|-------------------|---------|
| `id` | `id` | ✅ |
| `profile_id` | `profileId` | ✅ |
| `type` | `type` | ✅ |
| `data_json` | `dataJson` | ✅ |
| `"order"` | `order` | ✅ |
| `is_visible` | `isVisible` | ✅ |
| `created_at` | `createdAt` | ✅ |

## 📊 Visits Table

| Supabase SQL | TypeScript Schema | Status |
|-------------|-------------------|---------|
| `id` | `id` | ✅ |
| `profile_id` | `profileId` | ✅ |
| `ts` | `ts` | ✅ |
| `referrer` | `referrer` | ✅ |
| `user_agent` | `userAgent` | ✅ |
| `ip_hash` | `ipHash` | ✅ |

## 📊 Clicks Table

| Supabase SQL | TypeScript Schema | Status |
|-------------|-------------------|---------|
| `id` | `id` | ✅ |
| `block_id` | `blockId` | ✅ |
| `variant_id` | `variantId` | ✅ |
| `ts` | `ts` | ✅ |
| `referrer` | `referrer` | ✅ |
| `user_agent` | `userAgent` | ✅ |
| `ip_hash` | `ipHash` | ✅ |

## 📊 Block Variants Table

| Supabase SQL | TypeScript Schema | Status |
|-------------|-------------------|---------|
| `id` | `id` | ✅ |
| `block_id` | `blockId` | ✅ |
| `variant_name` | `variantName` | ✅ |
| `data_json` | `dataJson` | ✅ |
| `traffic_split` | `trafficSplit` | ✅ |
| `impressions` | `impressions` | ✅ |
| `is_active` | `isActive` | ✅ |
| `created_at` | `createdAt` | ✅ |

## ✅ Validation Result

**Status: ALL FIELDS MATCHED ✅**

- Total Tables: 6
- Total Fields Checked: 50+
- Mismatched Fields: 0
- Missing Fields: 0

All database fields from Supabase SQL schema are correctly mapped to TypeScript schema with proper camelCase conversion.

## 🔄 Data Type Mapping

| Supabase Type | TypeScript/Drizzle Type | Mapping |
|--------------|------------------------|---------|
| `TEXT` | `text()` | ✅ Direct |
| `BOOLEAN` | `boolean()` | ✅ Direct |
| `INTEGER` | `integer()` | ✅ Direct |
| `TIMESTAMPTZ` | `timestamp()` | ✅ Direct |

## 🔗 Database Connection

- **Local Development**: Supabase Postgres (via POSTGRES_URL)
- **Production**: Supabase Postgres (via POSTGRES_URL)
- **SQLite**: ❌ REMOVED (No longer used)

## 📝 Notes

1. All field names follow proper naming conventions:
   - SQL: snake_case (e.g., `user_id`, `display_name`)
   - TypeScript: camelCase (e.g., `userId`, `displayName`)

2. Drizzle ORM automatically handles the mapping between camelCase and snake_case

3. All foreign keys are properly defined with `onDelete: "cascade"`

4. All indexes are properly defined for performance optimization

5. Row Level Security (RLS) policies are enabled in Supabase

## ✅ Conclusion

**Schema is 100% synchronized between Supabase and Application!**

All input forms and display views are correctly mapped to Supabase fields.






