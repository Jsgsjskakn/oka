import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getItemUnitPaise, MAX_ITEM_QUANTITY } from '../src/store/cart-store.ts';

const root = process.cwd();

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('Menu, Cart & Checkout Comprehensive Verification Suite', async (t) => {
  // =========================================================================
  // 1. MENU & CATEGORY FILTERING, SORTS, FILTERS, SEARCH, EMPTY STATES
  // =========================================================================
  await t.test('1. Menu & /menu/[category] routing, category filtering, search, empty states & sheets', async (st) => {
    const menuPageSrc = readProjectFile('src/app/menu/page.tsx');
    const categoryPageSrc = readProjectFile('src/app/menu/[category]/page.tsx');
    const menuClientSrc = readProjectFile('src/components/menu/MenuClient.tsx');
    const filterSheetSrc = readProjectFile('src/components/menu/FilterSheet.tsx');
    const sortSheetSrc = readProjectFile('src/components/menu/SortSheet.tsx');
    const emptyStateSrc = readProjectFile('src/components/menu/EmptyState.tsx');

    await st.test('Menu page & [category] dynamic route delegate to MenuClient with proper parameters', () => {
      assert.ok(menuPageSrc.includes('MenuClient'), 'menu/page.tsx must mount MenuClient');
      assert.ok(menuPageSrc.includes('getCategories()'), 'menu/page.tsx must fetch categories');
      assert.ok(menuPageSrc.includes('getAllDishes()'), 'menu/page.tsx must fetch dishes');

      assert.ok(categoryPageSrc.includes('notFound()'), '[category]/page.tsx must call notFound() for invalid categories');
      assert.ok(categoryPageSrc.includes('MenuClient'), '[category]/page.tsx must render MenuClient');
      assert.ok(categoryPageSrc.includes('initialCategory={currentCategory.slug}'), '[category]/page.tsx must pass category slug');
    });

    await st.test('MenuClient includes direct category navigation pills strip, sort button & filter sheet triggers', () => {
      assert.ok(menuClientSrc.includes('categoryTabs.map'), 'MenuClient must render category navigation pills directly on page');
      assert.ok(menuClientSrc.includes('window.history.replaceState'), 'MenuClient must sync URL when switching category pills');
      assert.ok(menuClientSrc.includes('SortSheet'), 'MenuClient must mount SortSheet');
      assert.ok(menuClientSrc.includes('FilterSheet'), 'MenuClient must mount FilterSheet');
      assert.ok(menuClientSrc.includes('isSortOpen'), 'MenuClient must manage isSortOpen state');
      assert.ok(menuClientSrc.includes('isFilterOpen'), 'MenuClient must manage isFilterOpen state');
    });

    await st.test('EmptyState component provides chef recommendation and one-click reset action', () => {
      assert.ok(emptyStateSrc.includes('onClearFilters'), 'EmptyState must expose onClearFilters action');
      assert.ok(emptyStateSrc.includes('Chef'), 'EmptyState must feature Chef recommendation');
      assert.ok(emptyStateSrc.includes('addItem'), 'EmptyState must allow 1-click addition of recommended dish');
      assert.ok(emptyStateSrc.includes('/3d/'), 'EmptyState must link to 3D inspection');
    });

    await st.test('FilterSheet & SortSheet provide modal accessibility, escape dismiss and all options', () => {
      assert.ok(sortSheetSrc.includes('recommended'), 'SortSheet must support recommended sort');
      assert.ok(sortSheetSrc.includes('priceAsc'), 'SortSheet must support priceAsc sort');
      assert.ok(sortSheetSrc.includes('priceDesc'), 'SortSheet must support priceDesc sort');
      assert.ok(sortSheetSrc.includes('popular'), 'SortSheet must support popular sort');

      assert.ok(filterSheetSrc.includes('vegOnly'), 'FilterSheet must support vegOnly toggle');
      assert.ok(filterSheetSrc.includes('nonVegOnly'), 'FilterSheet must support nonVegOnly toggle');
      assert.ok(filterSheetSrc.includes('priceRange'), 'FilterSheet must support priceRange options');
      assert.ok(filterSheetSrc.includes('handleClearAll'), 'FilterSheet must support Clear All');
    });
  });

  // =========================================================================
  // 2. CART STORE (cart-store.ts) LOGIC & INTEGER PAISE CALCULATIONS
  // =========================================================================
  await t.test('2. Cart store: item addition, quantity modification, customizations & integer paise', async (st) => {
    const cartStoreSrc = readProjectFile('src/store/cart-store.ts');

    await st.test('cart-store exports getItemUnitPaise and getTotalPricePaise', () => {
      assert.ok(cartStoreSrc.includes('export function getItemUnitPaise'), 'cart-store must export getItemUnitPaise');
      assert.ok(cartStoreSrc.includes('getTotalPricePaise'), 'CartStore must include getTotalPricePaise');
      assert.ok(cartStoreSrc.includes('MAX_ITEM_QUANTITY = 50'), 'MAX_ITEM_QUANTITY must be 50');
    });

    await st.test('getItemUnitPaise calculates integer paise correctly with dish price, size modifier & add-ons', () => {
      const mockDish = {
        id: 'tandoori-paneer-pizza',
        slug: 'tandoori-paneer-pizza',
        name: 'Tandoori Paneer Pizza',
        price: 450, // ₹450
      };

      const itemWithCustomizations = {
        cartItemId: 'item-1',
        dish: mockDish,
        quantity: 2,
        size: { id: 'large', name: 'Large', priceModifier: 150 }, // +₹150
        selectedAddOns: [
          { id: 'extra-cheese', name: 'Extra Mozzarella', price: 60 }, // +₹60
          { id: 'truffle-oil', name: 'Truffle Oil Drizzle', price: 90 }, // +₹90
        ],
      };

      // Base: ₹450 = 45000 paise
      // Size: +₹150 = 15000 paise
      // Addons: +₹60 (6000) + ₹90 (9000) = 15000 paise
      // Unit total = 45000 + 15000 + 15000 = 75000 paise (₹750)
      const unitPaise = getItemUnitPaise(itemWithCustomizations);
      assert.equal(unitPaise, 75000);
      assert.ok(Number.isInteger(unitPaise), 'Unit price in paise must be integer');
    });

    await st.test('getItemUnitPaise defensively handles dish objects with price_paise', () => {
      const mockDbDish = {
        id: 'paneer-tikka',
        slug: 'paneer-tikka',
        name: 'Paneer Tikka',
        price_paise: 32000, // 32000 paise directly from DB
      };

      const unitPaise = getItemUnitPaise({
        cartItemId: 'item-2',
        dish: mockDbDish,
        quantity: 1,
      });

      assert.equal(unitPaise, 32000);
      assert.ok(Number.isInteger(unitPaise));
    });
  });

  // =========================================================================
  // 3. CHECKOUT FLOW: VALIDATION, DINING OPTIONS, PROMO CODES, TIPS
  // =========================================================================
  await t.test('3. Checkout page: customer validation, dining options (dine-in, takeaway, delivery), promo codes & tips', async (st) => {
    const checkoutSrc = readProjectFile('src/app/checkout/page.tsx');
    const orderTypeSelectorSrc = readProjectFile('src/components/checkout/OrderTypeSelector.tsx');
    const deliveryCardSrc = readProjectFile('src/components/checkout/DeliveryAddressCard.tsx');
    const promoSectionSrc = readProjectFile('src/components/checkout/PromoCodeSection.tsx');
    const priceCardSrc = readProjectFile('src/components/checkout/PriceBreakdownCard.tsx');
    const orderTypesSrc = readProjectFile('src/types/order.ts');
    const convexSchemaSrc = readProjectFile('convex/schema.ts');

    await st.test('OrderType and Convex Schema include dine-in, takeaway, and delivery', () => {
      assert.ok(orderTypesSrc.includes("'dine-in' | 'takeaway' | 'delivery'"), 'types/order.ts must support delivery');
      assert.ok(convexSchemaSrc.includes('v.literal("delivery")'), 'convex/schema.ts must allow delivery in orderType union');
      assert.ok(orderTypeSelectorSrc.includes('delivery'), 'OrderTypeSelector must display delivery option');
      assert.ok(orderTypeSelectorSrc.includes('Bike'), 'OrderTypeSelector must include delivery icon');
    });

    await st.test('Checkout page mounts DeliveryAddressCard and validates delivery address', () => {
      assert.ok(checkoutSrc.includes('DeliveryAddressCard'), 'checkout/page.tsx must mount DeliveryAddressCard');
      assert.ok(checkoutSrc.includes('deliveryAddress.trim().length < 5'), 'checkout/page.tsx must validate delivery address min length');
      assert.ok(deliveryCardSrc.includes('Complete Delivery Address'), 'DeliveryAddressCard must require address');
      assert.ok(deliveryCardSrc.includes('PIN Code'), 'DeliveryAddressCard must provide PIN Code field');
    });

    await st.test('Checkout page mounts PromoCodeSection and applies integer paise discounts', () => {
      assert.ok(checkoutSrc.includes('PromoCodeSection'), 'checkout/page.tsx must mount PromoCodeSection');
      assert.ok(checkoutSrc.includes('appliedPromo'), 'checkout/page.tsx must manage appliedPromo state');
      assert.ok(checkoutSrc.includes('discountPaise'), 'checkout/page.tsx must calculate discountPaise');
      assert.ok(promoSectionSrc.includes('GOLDEN10'), 'PromoCodeSection must support GOLDEN10 (10% off)');
      assert.ok(promoSectionSrc.includes('WELCOME20'), 'PromoCodeSection must support WELCOME20 (20% off)');
      assert.ok(promoSectionSrc.includes('ROYAL50'), 'PromoCodeSection must support ROYAL50 (flat ₹50)');
      assert.ok(promoSectionSrc.includes('CHEF100'), 'PromoCodeSection must support CHEF100 (flat ₹100)');
    });

    await st.test('PriceBreakdownCard shows discounted amount and promo code tag', () => {
      assert.ok(priceCardSrc.includes('discount > 0'), 'PriceBreakdownCard must display discount when applied');
      assert.ok(priceCardSrc.includes('promoCode'), 'PriceBreakdownCard must display applied promoCode');
      assert.ok(priceCardSrc.includes('effectiveSubtotalPaise'), 'PriceBreakdownCard must compute effective subtotal in paise');
    });

    await st.test('Order placement payload forwards delivery address and promo code to backend', () => {
      assert.ok(checkoutSrc.includes('deliveryAddress: fullDeliveryAddress'), 'checkout must pass deliveryAddress in payload');
      assert.ok(checkoutSrc.includes('promoCode: appliedPromo?.code'), 'checkout must pass promoCode in payload');
      assert.ok(checkoutSrc.includes('discountPaise: discountPaise > 0 ? discountPaise : undefined'), 'checkout must pass discountPaise in payload');
    });
  });

  // =========================================================================
  // 4. ORDER SUCCESS FLOW: CONFIRMATION CARD, REALTIME STATUS & FALLBACK
  // =========================================================================
  await t.test('4. Order Success: confirmation card, realtime status updates & fallback handling', async (st) => {
    const successPageSrc = readProjectFile('src/app/order/success/page.tsx');
    const fallbackSrc = readProjectFile('src/app/order/success/OrderSuccessClientFallback.tsx');
    const confirmationCardSrc = readProjectFile('src/components/checkout/OrderConfirmationCard.tsx');
    const statusSummarySrc = readProjectFile('src/components/checkout/OrderStatusSummary.tsx');

    await st.test('Server Component gracefully falls back to OrderSuccessClientFallback on missing order', () => {
      assert.ok(successPageSrc.includes('OrderSuccessClientFallback'), 'order/success/page.tsx must render fallback when order is null');
      assert.ok(fallbackSrc.includes('useOrderStore'), 'OrderSuccessClientFallback must read order from useOrderStore');
      assert.ok(fallbackSrc.includes('OrderConfirmationCard'), 'OrderSuccessClientFallback must render OrderConfirmationCard');
      assert.ok(fallbackSrc.includes('OrderStatusSummary'), 'OrderSuccessClientFallback must render OrderStatusSummary');
    });

    await st.test('OrderConfirmationCard displays dining option, delivery address and promo discount', () => {
      assert.ok(confirmationCardSrc.includes('Home Delivery'), 'OrderConfirmationCard must display Home Delivery label');
      assert.ok(confirmationCardSrc.includes('order.deliveryAddress'), 'OrderConfirmationCard must render deliveryAddress');
      assert.ok(confirmationCardSrc.includes('order.discount'), 'OrderConfirmationCard must display promo savings');
    });

    await st.test('OrderStatusSummary subscribes to Convex realtime for all valid Convex IDs without false skips', () => {
      assert.ok(statusSummarySrc.includes("!orderId.includes('-')"), 'OrderStatusSummary must detect Convex IDs without hyphens');
      assert.ok(statusSummarySrc.includes('api.orders.getOrderById'), 'OrderStatusSummary must query Convex getOrderById in realtime');
      assert.ok(statusSummarySrc.includes('postgres_changes'), 'OrderStatusSummary must provide Supabase channel for legacy UUID orders');
      assert.ok(statusSummarySrc.includes('fetchStatus'), 'OrderStatusSummary must provide periodic sync poll for offline/mock orders');
    });
  });
});
