import { internalMutation } from "./_generated/server";

export const seedDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Restaurant Info if not exists
    const existingRestaurant = await ctx.db.query("restaurants").first();
    if (!existingRestaurant) {
      await ctx.db.insert("restaurants", {
        name: "The Golden Oak",
        tagline: "Gourmet Indian Fusion & Artisanal Dining",
        description:
          "Experience luxury dining with premium Indian fusion flavors, hand-stretched wood-fired pizzas, handcrafted burgers, and signature street fare made from organic local ingredients.",
        address: "45 Golden Oak Boulevard, Indiranagar, Bengaluru, Karnataka 560038",
        phone: "+91 99907 74565",
        email: "contact@thegoldenoak.in",
        currency: "INR",
        timezone: "Asia/Kolkata",
        openingHours: "12:00 PM - 11:30 PM (Daily)",
        rating: 4.8,
        reviewCount: 1240,
        legacyId: "a1b2c3d4-0000-0000-0000-000000000001",
      });
    }

    // 2. Seed Categories
    const categoriesData = [
      { name: "Pizzas", slug: "pizza", icon: "pizza", sortOrder: 1, isActive: true },
      { name: "Burgers", slug: "burger", icon: "burger", sortOrder: 2, isActive: true },
      { name: "Chinese", slug: "chinese", icon: "utensils", sortOrder: 3, isActive: true },
      { name: "Starters", slug: "starters", icon: "flame", sortOrder: 4, isActive: true },
      { name: "Desserts", slug: "desserts", icon: "ice-cream", sortOrder: 5, isActive: false },
    ];

    for (const cat of categoriesData) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
        .first();
      if (!existing) {
        await ctx.db.insert("categories", cat);
      }
    }

    // 3. Seed Dishes (with full metadata and 3D AR references)
    const dishesData = [
      // PIZZAS
      {
        slug: "tandoori-paneer-pizza",
        name: "Tandoori Paneer Pizza",
        categorySlug: "pizza",
        description:
          "Charcoal-grilled cottage cheese marinated in aromatic spices, topped with bell peppers, smoked mozzarella, and signature makhani glaze on artisan sourdough crust.",
        pricePaise: 44900,
        originalPricePaise: 49900,
        imageUrl: "/images/dishes/tandoori-paneer-pizza.webp",
        thumbnailUrl: "/images/dishes/tandoori-paneer-pizza.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: true,
        isBestSeller: true,
        spiceLevel: "medium",
        calories: 780,
        preparationTime: "20-25 mins",
        ingredients: [
          "Sourdough Base",
          "Marinated Paneer",
          "Smoked Mozzarella",
          "Bell Peppers",
          "Red Onion",
          "Makhani Sauce Glaze",
          "Fresh Cilantro",
        ],
        allergens: ["Dairy", "Gluten"],
        sizes: [
          { id: "small", name: 'Small (8")', priceModifierPaise: -5000 },
          { id: "medium", name: 'Medium (10")', priceModifierPaise: 0 },
          { id: "large", name: 'Large (12")', priceModifierPaise: 15000 },
        ],
        addOns: [
          { id: "extra-cheese", name: "Extra Cheese", pricePaise: 5000 },
          { id: "jalapenos", name: "Jalapeños", pricePaise: 4000 },
        ],
        removableIngredients: ["Red Onion", "Bell Peppers"],
        has3DModel: true,
        modelUrl: "/models/tandoori-paneer-pizza.glb",
        sortOrder: 1,
      },
      {
        slug: "chicken-tikka-pizza",
        name: "Chicken Tikka Pizza",
        categorySlug: "pizza",
        description:
          "Tandoor-smoked chicken tikka with pickled onions, aged cheddar, and smoky mint chutney drizzle on stone-baked base.",
        pricePaise: 49900,
        originalPricePaise: 54900,
        imageUrl: "/images/dishes/chicken-tikka-pizza.webp",
        thumbnailUrl: "/images/dishes/chicken-tikka-pizza.webp",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        isBestSeller: true,
        spiceLevel: "medium",
        calories: 850,
        preparationTime: "22-28 mins",
        ingredients: [
          "Stone-Baked Crust",
          "Smoked Chicken Tikka",
          "Aged Cheddar",
          "Pickled Onions",
          "Mint Chutney Drizzle",
        ],
        allergens: ["Dairy", "Gluten"],
        sizes: [
          { id: "small", name: 'Small (8")', priceModifierPaise: -5000 },
          { id: "medium", name: 'Medium (10")', priceModifierPaise: 0 },
          { id: "large", name: 'Large (12")', priceModifierPaise: 15000 },
        ],
        addOns: [
          { id: "extra-chicken", name: "Extra Chicken Tikka", pricePaise: 8000 },
          { id: "extra-cheese", name: "Extra Cheese", pricePaise: 5000 },
        ],
        removableIngredients: ["Pickled Onions"],
        has3DModel: true,
        modelUrl: "/models/chicken-tikka-pizza.glb",
        sortOrder: 2,
      },
      {
        slug: "mushroom-truffle-pizza",
        name: "Mushroom Truffle Pizza",
        categorySlug: "pizza",
        description:
          "Wild mushroom medley with black truffle oil, aged parmesan, fresh thyme, and buffalo mozzarella on a thin artisan base.",
        pricePaise: 54900,
        imageUrl: "/images/dishes/mushroom-truffle-pizza.webp",
        thumbnailUrl: "/images/dishes/mushroom-truffle-pizza.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        spiceLevel: "mild",
        calories: 720,
        preparationTime: "20-25 mins",
        ingredients: [
          "Artisan Base",
          "Wild Mushrooms",
          "Black Truffle Oil",
          "Aged Parmesan",
          "Fresh Thyme",
          "Buffalo Mozzarella",
        ],
        allergens: ["Dairy", "Gluten"],
        sizes: [
          { id: "small", name: 'Small (8")', priceModifierPaise: -5000 },
          { id: "medium", name: 'Medium (10")', priceModifierPaise: 0 },
          { id: "large", name: 'Large (12")', priceModifierPaise: 15000 },
        ],
        addOns: [
          { id: "truffle-oil", name: "Extra Truffle Drizzle", pricePaise: 9000 },
        ],
        removableIngredients: [],
        has3DModel: false,
        sortOrder: 3,
      },
      {
        slug: "peri-peri-fiesta-pizza",
        name: "Peri Peri Fiesta Pizza",
        categorySlug: "pizza",
        description:
          "Spicy peri peri sauce base with roasted capsicum, corn, black olives, and a fresh herb salsa topping.",
        pricePaise: 42900,
        imageUrl: "/images/dishes/peri-peri-fiesta-pizza.webp",
        thumbnailUrl: "/images/dishes/peri-peri-fiesta-pizza.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        spiceLevel: "hot",
        calories: 760,
        preparationTime: "20-25 mins",
        ingredients: ["Peri Peri Sauce", "Roasted Capsicum", "Corn", "Black Olives", "Mozzarella"],
        allergens: ["Dairy", "Gluten"],
        sizes: [
          { id: "small", name: 'Small (8")', priceModifierPaise: -5000 },
          { id: "medium", name: 'Medium (10")', priceModifierPaise: 0 },
          { id: "large", name: 'Large (12")', priceModifierPaise: 15000 },
        ],
        has3DModel: false,
        sortOrder: 4,
      },
      {
        slug: "bbq-chicken-overload",
        name: "BBQ Chicken Overload",
        categorySlug: "pizza",
        description:
          "Hickory BBQ marinated chicken cubes with caramelized onions, bacon bits, and sharp cheddar blend.",
        pricePaise: 52900,
        imageUrl: "/images/dishes/bbq-chicken-overload.webp",
        thumbnailUrl: "/images/dishes/bbq-chicken-overload.webp",
        isVeg: false,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: true,
        spiceLevel: "medium",
        calories: 890,
        preparationTime: "22-28 mins",
        ingredients: ["BBQ Sauce", "Chicken", "Caramelized Onions", "Bacon Bits", "Cheddar"],
        allergens: ["Dairy", "Gluten"],
        sizes: [
          { id: "small", name: 'Small (8")', priceModifierPaise: -5000 },
          { id: "medium", name: 'Medium (10")', priceModifierPaise: 0 },
          { id: "large", name: 'Large (12")', priceModifierPaise: 15000 },
        ],
        has3DModel: false,
        sortOrder: 5,
      },

      // BURGERS
      {
        slug: "classic-smash-burger",
        name: "Classic Smash Burger",
        categorySlug: "burger",
        description:
          "Double smashed tender patty with melted American cheese, house secret sauce, and crispy lettuce in toasted brioche.",
        pricePaise: 37900,
        imageUrl: "/images/dishes/classic-smash-burger.webp",
        thumbnailUrl: "/images/dishes/classic-smash-burger.webp",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        isBestSeller: true,
        spiceLevel: "mild",
        calories: 680,
        preparationTime: "15-20 mins",
        ingredients: ["Brioche Bun", "Double Patty", "American Cheese", "Secret Sauce", "Pickles"],
        allergens: ["Dairy", "Gluten"],
        addOns: [
          { id: "extra-patty", name: "Extra Patty", pricePaise: 9000 },
          { id: "bacon", name: "Crispy Bacon", pricePaise: 6000 },
        ],
        has3DModel: true,
        modelUrl: "/models/classic-smash-burger.glb",
        sortOrder: 6,
      },
      {
        slug: "golden-oak-signature-burger",
        name: "Golden Oak Signature Burger",
        categorySlug: "burger",
        description:
          "Triple-stack gourmet delight with caramelized balsamic onions, aged gruyère, and truffled garlic aioli.",
        pricePaise: 49900,
        imageUrl: "/images/dishes/golden-oak-signature-burger.webp",
        thumbnailUrl: "/images/dishes/golden-oak-signature-burger.webp",
        isVeg: false,
        isAvailable: true,
        isFeatured: true,
        isBestSeller: false,
        spiceLevel: "mild",
        calories: 820,
        preparationTime: "18-22 mins",
        ingredients: ["Artisan Bun", "Triple Gourmet Patty", "Gruyère", "Truffle Aioli"],
        allergens: ["Dairy", "Gluten"],
        has3DModel: true,
        modelUrl: "/models/golden-oak-burger.glb",
        sortOrder: 7,
      },
      {
        slug: "crispy-paneer-burger",
        name: "Crispy Paneer Burger",
        categorySlug: "burger",
        description:
          "Panko-crusted spiced cottage cheese steak with mint slaw and tangy tamarind reduction in artisan potato bun.",
        pricePaise: 34900,
        imageUrl: "/images/dishes/crispy-paneer-burger.webp",
        thumbnailUrl: "/images/dishes/crispy-paneer-burger.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        spiceLevel: "medium",
        calories: 640,
        preparationTime: "15-18 mins",
        ingredients: ["Potato Bun", "Panko Paneer Steak", "Mint Slaw", "Tamarind Reduction"],
        allergens: ["Dairy", "Gluten"],
        has3DModel: false,
        sortOrder: 8,
      },

      // CHINESE & STARTERS
      {
        slug: "wok-tossed-chow-mein",
        name: "Wok Tossed Chow Mein",
        categorySlug: "chinese",
        description:
          "Hand-pulled noodles stir-fried with julienned vegetables in dark aged soy and toasted sesame chili oil.",
        pricePaise: 29900,
        imageUrl: "/images/dishes/wok-tossed-chow-mein.webp",
        thumbnailUrl: "/images/dishes/wok-tossed-chow-mein.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        spiceLevel: "medium",
        calories: 520,
        preparationTime: "12-15 mins",
        ingredients: ["Hand-Pulled Noodles", "Bok Choy", "Bell Peppers", "Soy", "Sesame Oil"],
        allergens: ["Gluten", "Soy"],
        has3DModel: false,
        sortOrder: 9,
      },
      {
        slug: "dynamite-chilli-potatoes",
        name: "Dynamite Chilli Potatoes",
        categorySlug: "starters",
        description:
          "Twice-cooked crispy potato wedges tossed in spicy Szechuan sauce with spring onion and roasted sesame.",
        pricePaise: 24900,
        imageUrl: "/images/dishes/dynamite-chilli-potatoes.webp",
        thumbnailUrl: "/images/dishes/dynamite-chilli-potatoes.webp",
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: true,
        spiceLevel: "hot",
        calories: 450,
        preparationTime: "10-12 mins",
        ingredients: ["Potato Wedges", "Szechuan Pepper Sauce", "Scallions", "Toasted Sesame"],
        allergens: ["Soy", "Sesame"],
        has3DModel: false,
        sortOrder: 10,
      },
    ];

    for (const dish of dishesData) {
      const existing = await ctx.db
        .query("dishes")
        .withIndex("by_slug", (q) => q.eq("slug", dish.slug))
        .first();
      if (!existing) {
        await ctx.db.insert("dishes", dish);
      }
    }

    // 4. Seed Settings
    const settingsData = [
      { key: "tax_rate_percent", value: 5 },
      { key: "customer_cancellation_enabled", value: true },
      { key: "cancellation_window_minutes", value: 10 },
      { key: "advance_booking_amount_paise", value: 50000 },
      { key: "booking_hold_minutes", value: 5 },
      { key: "rush_mode_buffer_mins", value: 15 },
      { key: "max_booking_party_size", value: 20 },
      { key: "support_phone", value: "+91 99907 74565" },
      { key: "support_email", value: "contact@thegoldenoak.in" },
      { key: "restaurant_tagline", value: "Gourmet Indian Fusion & Artisanal Dining" },
    ];

    for (const setting of settingsData) {
      const existing = await ctx.db
        .query("restaurant_settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();
      if (!existing) {
        await ctx.db.insert("restaurant_settings", setting);
      }
    }

    // 5. Seed Dining Tables (1 to 15)
    const existingTable = await ctx.db.query("tables").first();
    if (!existingTable) {
      for (let i = 1; i <= 15; i++) {
        let capacity = 2;
        if (i > 6 && i <= 12) capacity = 4;
        if (i > 12) capacity = 6;
        await ctx.db.insert("tables", {
          tableNumber: i,
          capacity,
          status: "available",
          createdAt: Date.now(),
        });
      }
    }

    // 6. Seed Staff Employee
    const existingEmployee = await ctx.db.query("employees").first();
    if (!existingEmployee) {
      await ctx.db.insert("employees", {
        name: "Staff User",
        role: "staff",
        email: "staff@thegoldenoak.in",
        phone: "+91 99907 74565",
        isActive: true,
        hiredAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      seededCategories: categoriesData.length,
      seededDishes: dishesData.length,
      seededSettings: settingsData.length,
    };
  },
});


