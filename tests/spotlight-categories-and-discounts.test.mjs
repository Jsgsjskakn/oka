import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

test('Culinary Spotlight Modal - Categories, Redesigned Cravings, Smooth Scroll & 10-30% OFF Discounts Audit', async (t) => {
  const modalPath = path.join(PROJECT_ROOT, 'src/components/search/CulinarySpotlightModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'CulinarySpotlightModal.tsx must exist');

  const content = fs.readFileSync(modalPath, 'utf8');

  await t.test('1. Categories selector bar at top', () => {
    assert.match(content, /CATEGORIES:/, 'Must feature Categories header tag');
    assert.match(content, /categoryTabs/, 'Must define categoryTabs');
    assert.match(content, /Wood-Fired Pizzas/, 'Must have Wood-Fired Pizzas category');
    assert.match(content, /Gourmet Burgers/, 'Must have Gourmet Burgers category');
    assert.match(content, /Wok Specialties/, 'Must have Wok Specialties category');
    assert.match(content, /Sizzling Starters/, 'Must have Sizzling Starters category');
    assert.match(content, /activeCategory/, 'Must manage activeCategory filter state');
  });

  await t.test('2. Redesigned Popular Cravings with enlarged buttons & new options', () => {
    assert.match(content, /POPULAR CRAVINGS:/, 'Must feature Popular Cravings label');
    assert.match(content, /Special Offers/, 'Must feature Special Offers filter');
    assert.match(content, /Chef's Best Sellers/, "Must feature Chef's Best Sellers filter");
    assert.match(content, /Truffle & Gourmet/, 'Must feature Truffle & Gourmet filter');
    assert.match(content, /Fiery & Spicy/, 'Must feature Fiery & Spicy filter');
    assert.match(content, /100% Pure Veg/, 'Must feature Pure Veg filter');
    assert.match(content, /3D Studio Ready/, 'Must feature 3D Studio Ready filter');
    assert.match(content, /Up to 30% OFF/, 'Must feature discount badge');
  });

  await t.test('3. Smooth scrollability & custom luxury scrollbar', () => {
    assert.match(content, /overflow-y-auto/, 'Must enable overflow-y-auto scrolling');
    assert.match(content, /overscroll-contain/, 'Must contain overscroll for smooth mouse wheel navigation');
    assert.match(content, /scrollbar-width:thin|scrollbar-color/, 'Must style luxury scrollbar');
    assert.match(content, /scrollSelectedIntoView/, 'Must auto-scroll selected items into view on keyboard navigation');
  });

  await t.test('4. 10%, 20%, 30% OFF discounts on dishes', () => {
    assert.match(content, /originalPrice/, 'SpotlightDish interface must declare originalPrice');
    assert.match(content, /discountPercent/, 'SpotlightDish interface must declare discountPercent');
    assert.match(content, /10% OFF|discountPercent.*10/, 'Must have 10% OFF discounts');
    assert.match(content, /20% OFF|discountPercent.*20/, 'Must have 20% OFF discounts');
    assert.match(content, /30% OFF|discountPercent.*30/, 'Must have 30% OFF discounts');
    assert.match(content, /line-through/, 'Must display original strikethrough price');
    assert.match(content, /Save ₹/, 'Must calculate and display customer savings');
  });
});
