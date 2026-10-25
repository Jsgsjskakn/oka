# Schema Mapping: Supabase Relational to Convex Reactive Documents

> Generated: 2026-10-25
> Target: Convex Schema (`convex/schema.ts`)

---

## 1. Core Principles
1. **Legacy ID Preservation:** Every migrated document retains `legacyId: v.optional(v.string())` (storing original Supabase UUID or slug). This guarantees that existing QR codes, bookmarks, or external links never break.
2. **Denormalization for Speed:** Nested objects like dish sizes and add-ons are embedded directly into the `dishes` document for instant, single-query rendering, while maintaining indexed collections for transactional entities (orders, bookings).
3. **Type Safety:** All fields are strictly validated using Convex's `v.*` validator system.

---

## 2. Table-by-Table Schema Mapping

### A. `restaurants`
| Supabase Column | Supabase Type | Convex Field | Convex Type |
|---|---|---|---|
| `id` | UUID | `_id` + `legacyId` | `v.string()` |
| `name` | TEXT | `name` | `v.string()` |
| `tagline` | TEXT | `tagline` | `v.optional(v.string())` |
| `description` | TEXT | `description` | `v.optional(v.string())` |
| `address` | TEXT | `address` | `v.optional(v.string())` |
| `phone` | TEXT | `phone` | `v.optional(v.string())` |
| `email` | TEXT | `email` | `v.optional(v.string())` |
| `currency` | TEXT | `currency` | `v.string()` (default 'INR') |
| `timezone` | TEXT | `timezone` | `v.string()` |
| `opening_hours` | TEXT | `openingHours` | `v.optional(v.string())` |
| `rating` | NUMERIC | `rating` | `v.optional(v.number())` |
| `review_count` | INTEGER | `reviewCount` | `v.number()` |

### B. `categories`
| Supabase Column | Supabase Type | Convex Field | Convex Type |
|---|---|---|---|
| `id` | UUID | `_id` + `legacyId` | `v.string()` |
| `restaurant_id` | UUID | `restaurantId` | `v.optional(v.string())` |
| `name` | TEXT | `name` | `v.string()` |
| `slug` | TEXT | `slug` | `v.string()` (Indexed) |
| `icon` | TEXT | `icon` | `v.optional(v.string())` |
| `sort_order` | INTEGER | `sortOrder` | `v.number()` |
| `is_active` | BOOLEAN | `isActive` | `v.boolean()` |

### C. `dishes` (with embedded sizes, add-ons, 3D model config)
| Supabase Column | Supabase Type | Convex Field | Convex Type |
|---|---|---|---|
| `id` | UUID | `_id` + `legacyId` | `v.string()` |
| `category_id` | UUID | `categoryId` | `v.string()` (or `categorySlug`) |
| `name` | TEXT | `name` | `v.string()` |
| `slug` | TEXT | `slug` | `v.string()` (Indexed) |
| `description` | TEXT | `description` | `v.optional(v.string())` |
| `price_paise` | INTEGER | `pricePaise` | `v.number()` |
| `original_price_paise` | INTEGER | `originalPricePaise` | `v.optional(v.number())` |
| `image_url` | TEXT | `imageUrl` | `v.optional(v.string())` |
| `is_veg` | BOOLEAN | `isVeg` | `v.boolean()` |
| `is_available` | BOOLEAN | `isAvailable` | `v.boolean()` |
| `is_featured` | BOOLEAN | `isFeatured` | `v.boolean()` |
| `is_best_seller` | BOOLEAN | `isBestSeller` | `v.boolean()` |
| `spice_level` | TEXT | `spiceLevel` | `v.optional(v.string())` |
| `calories` | INTEGER | `calories` | `v.optional(v.number())` |
| `preparation_time` | TEXT | `preparationTime` | `v.optional(v.string())` |
| `allergens` | TEXT[] | `allergens` | `v.optional(v.array(v.string()))` |
| `has_3d_model` | BOOLEAN | `has3DModel` | `v.boolean()` |
| `model_path` (from dish_models) | TEXT | `modelUrl` | `v.optional(v.string())` |
| (dish_sizes) | Relation | `sizes` | `v.optional(v.array(v.object({ id: v.string(), name: v.string(), priceModifierPaise: v.number() })))` |
| (dish_addons) | Relation | `addOns` | `v.optional(v.array(v.object({ id: v.string(), name: v.string(), pricePaise: v.number() })))` |
| (ingredients) | Relation | `ingredients` | `v.optional(v.array(v.string()))` |
| (removable) | Relation | `removableIngredients` | `v.optional(v.array(v.string()))` |

### D. `orders` & `order_items`
| Field | Convex Type | Description |
|---|---|---|
| `legacyId` | `v.optional(v.string())` | Legacy UUID if migrated |
| `restaurantId` | `v.string()` | Restaurant reference |
| `customerName` | `v.string()` | Contact name |
| `customerPhone` | `v.string()` | Contact phone |
| `customerEmail` | `v.optional(v.string())` | Optional email |
| `orderType` | `v.union(v.literal('dine-in'), v.literal('takeaway'))` | Order classification |
| `tableNumber` | `v.optional(v.number())` | Dine-in table |
| `status` | `v.union(v.literal('pending'), v.literal('confirmed'), v.literal('preparing'), v.literal('ready'), v.literal('completed'), v.literal('cancelled'))` | Order lifecycle |
| `paymentStatus` | `v.union(v.literal('pending'), v.literal('paid'), v.literal('failed'), v.literal('refunded'))` | Settlement |
| `paymentMethod` | `v.union(v.literal('upi'), v.literal('cash'))` | In-person method |
| `subtotalPaise` | `v.number()` | Calculated subtotal |
| `taxPaise` | `v.number()` | Calculated tax |
| `tipPaise` | `v.number()` | Optional tip |
| `totalPaise` | `v.number()` | Total in paise |
| `idempotencyKey` | `v.optional(v.string())` | Replay protection |
| `accessTokenHash`| `v.optional(v.string())` | Guest order verification |
| `items` | `v.array(v.object({...}))` | Embedded order items & add-ons |
| `createdAt` | `v.number()` | Epoch timestamp |

### E. `bookings`
| Field | Convex Type | Description |
|---|---|---|
| `legacyId` | `v.optional(v.string())` | Legacy UUID |
| `restaurantId` | `v.string()` | Restaurant reference |
| `customerName` | `v.string()` | Customer name |
| `customerPhone` | `v.string()` | Customer phone |
| `customerEmail` | `v.optional(v.string())` | Optional email |
| `bookingDate` | `v.string()` | YYYY-MM-DD |
| `bookingTime` | `v.string()` | HH:MM |
| `bookingEndTime` | `v.optional(v.string())` | HH:MM |
| `guests` | `v.number()` | Party size (1-50) |
| `tablePreference` | `v.optional(v.string())` | Indoor/Outdoor/Window |
| `specialRequests`| `v.optional(v.string())` | Dietary or occasion notes |
| `status` | `v.union(v.literal('pending'), v.literal('confirmed'), v.literal('cancelled'), v.literal('completed'))` | Booking state |
| `advanceAmountPaise` | `v.number()` | Advance fee |
| `paymentStatus` | `v.union(v.literal('pending'), v.literal('paid'), v.literal('failed'))` | Advance payment state |
| `createdAt` | `v.number()` | Epoch timestamp |

### F. `profiles` & `employees`
| Field | Convex Type | Description |
|---|---|---|
| `userId` | `v.string()` | Auth ID / Token |
| `name` | `v.string()` | Display name |
| `email` | `v.optional(v.string())` | Email address |
| `phone` | `v.optional(v.string())` | Phone number |
| `role` | `v.union(v.literal('admin'), v.literal('employee'), v.literal('customer'))` | Role security |
| `isActive` | `v.boolean()` | Active flag |
