import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Restaurant Profile & Branding
  restaurants: defineTable({
    name: v.string(),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    currency: v.string(),
    timezone: v.string(),
    openingHours: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviewCount: v.number(),
    legacyId: v.optional(v.string()),
  }),

  // Categories
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    restaurantId: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_sort_order", ["sortOrder"]),

  // Dishes with 3D AR Model references
  dishes: defineTable({
    name: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
    description: v.optional(v.string()),
    pricePaise: v.number(),
    originalPricePaise: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    isVeg: v.boolean(),
    isAvailable: v.boolean(),
    isFeatured: v.boolean(),
    isBestSeller: v.boolean(),
    spiceLevel: v.optional(v.string()),
    calories: v.optional(v.number()),
    preparationTime: v.optional(v.string()),
    allergens: v.optional(v.array(v.string())),
    has3DModel: v.boolean(),
    modelUrl: v.optional(v.string()),
    sizes: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          priceModifierPaise: v.number(),
        })
      )
    ),
    addOns: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          pricePaise: v.number(),
        })
      )
    ),
    ingredients: v.optional(v.array(v.string())),
    removableIngredients: v.optional(v.array(v.string())),
    sortOrder: v.optional(v.number()),
    legacyId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categorySlug"])
    .index("by_featured", ["isFeatured"])
    .index("by_availability", ["isAvailable"]),

  // Realtime Orders
  orders: defineTable({
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    orderType: v.union(v.literal("dine-in"), v.literal("takeaway")),
    tableNumber: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.union(v.literal("upi"), v.literal("cash")),
    pickupTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    subtotalPaise: v.number(),
    taxPaise: v.number(),
    tipPaise: v.number(),
    totalPaise: v.number(),
    idempotencyKey: v.optional(v.string()),
    accessTokenHash: v.optional(v.string()),
    items: v.array(
      v.object({
        dishId: v.string(),
        dishName: v.string(),
        dishPricePaise: v.number(),
        quantity: v.number(),
        sizeName: v.optional(v.string()),
        sizePriceModifierPaise: v.optional(v.number()),
        lineTotalPaise: v.number(),
        specialInstructions: v.optional(v.string()),
        addons: v.optional(
          v.array(
            v.object({
              name: v.string(),
              pricePaise: v.number(),
            })
          )
        ),
        removedIngredients: v.optional(v.array(v.string())),
      })
    ),
    cancelledAt: v.optional(v.number()),
    cancelledBy: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_phone", ["customerPhone"])
    .index("by_idempotency", ["idempotencyKey"]),

  // Table Bookings
  bookings: defineTable({
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    bookingDate: v.string(),
    bookingTime: v.string(),
    bookingEndTime: v.optional(v.string()),
    guests: v.number(),
    occasion: v.optional(v.string()),
    tablePreference: v.optional(v.string()),
    tableNumber: v.optional(v.number()),
    tableId: v.optional(v.string()),
    specialRequests: v.optional(v.string()),
    holdExpiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("seated"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
    advanceAmountPaise: v.number(),
    paymentReference: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    cancelledBy: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_date", ["bookingDate"])
    .index("by_status", ["status"])
    .index("by_phone", ["customerPhone"])
    .index("by_table_and_date", ["tableNumber", "bookingDate"]),

  // Restaurant Settings (Key-Value)
  restaurant_settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Employees Roster
  employees: defineTable({
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    hiredAt: v.optional(v.string()),
  }),

  // Restaurant Dining Tables
  tables: defineTable({
    tableNumber: v.number(),
    capacity: v.number(),
    status: v.union(
      v.literal("available"),
      v.literal("occupied"),
      v.literal("reserved"),
      v.literal("maintenance")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_table_number", ["tableNumber"]),

  // User Authentication & RBAC
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("customer"),
      v.literal("staff"),
      v.literal("employee"),
      v.literal("manager"),
      v.literal("chef"),
      v.literal("admin")
    ),
    isActive: v.boolean(),
    resetToken: v.optional(v.string()),
    resetTokenExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Authenticated Sessions
  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    role: v.string(),
    name: v.string(),
    email: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Health / Connection test table
  test_connection: defineTable({
    text: v.string(),
    timestamp: v.number(),
    status: v.optional(v.string()),
  }),
});
