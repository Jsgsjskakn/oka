import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Cart Stepper & Added Quantity Verification on Dish Cards', async (t) => {
  await t.test('1. MenuDishCard implements interactive quantity stepper and shows kitna add hua', () => {
    const filePath = path.join(ROOT_DIR, 'src/components/menu/MenuDishCard.tsx');
    assert.ok(fs.existsSync(filePath), 'MenuDishCard.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Imports lucide icons for stepper
    assert.match(content, /Minus/, 'Must import Minus icon');
    assert.match(content, /Plus/, 'Must import Plus icon');
    assert.match(content, /Trash2/, 'Must import Trash2 icon for 1-quantity removal');

    // Cart store integration
    assert.match(content, /useCartStore\(\(s\)\s*=>\s*s\.items\)/, 'Must subscribe to cart items');
    assert.match(content, /useCartStore\(\(s\)\s*=>\s*s\.updateQuantity\)/, 'Must access updateQuantity');
    assert.match(content, /useCartStore\(\(s\)\s*=>\s*s\.removeItem\)/, 'Must access removeItem');

    // Matching items and cart quantity computation
    assert.match(content, /const\s+matchingItems\s*=/, 'Must calculate matching items for this dish');
    assert.match(content, /const\s+cartQuantity\s*=/, 'Must calculate total cartQuantity');

    // Increment and Decrement handlers
    assert.match(content, /handleIncrement/, 'Must have handleIncrement function');
    assert.match(content, /handleDecrement/, 'Must have handleDecrement function');

    // Stop propagation so clicking + or - doesn't navigate to 3D view
    assert.match(content, /e\.stopPropagation\(\)/, 'Must stop event propagation on stepper clicks');
    assert.match(content, /e\.preventDefault\(\)/, 'Must prevent default navigation on stepper clicks');

    // Conditional render: ADD + when 0, Stepper when > 0
    assert.match(content, /cartQuantity\s*===\s*0\s*\?/, 'Must conditionally check cartQuantity === 0');
    assert.match(content, /ADD\s*\+/, 'Must render ADD + button when not in cart');
    assert.match(content, /in\s*bag/, 'Must display "in bag" quantity indicator');
  });

  await t.test('2. VerticalDishCard (Home & Signatures) implements interactive quantity stepper', () => {
    const filePath = path.join(ROOT_DIR, 'src/components/home/VerticalDishCard.tsx');
    assert.ok(fs.existsSync(filePath), 'VerticalDishCard.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Imports lucide icons
    assert.match(content, /Minus/, 'Must import Minus icon');
    assert.match(content, /Plus/, 'Must import Plus icon');
    assert.match(content, /Trash2/, 'Must import Trash2 icon');

    // Cart store methods
    assert.match(content, /updateQuantity/, 'Must use updateQuantity');
    assert.match(content, /removeItem/, 'Must use removeItem');

    // Handlers
    assert.match(content, /handleIncrement/, 'Must have handleIncrement');
    assert.match(content, /handleDecrement/, 'Must have handleDecrement');

    // Stepper & quantity display
    assert.match(content, /cartQuantity\s*===\s*0\s*\?/, 'Must check cartQuantity === 0');
    assert.match(content, /ADD\s*\+/, 'Must render ADD + when empty');
    assert.match(content, /in\s*bag/, 'Must display "in bag" text indicator');
  });

  await t.test('3. DishCard (UI generic) supports quantity stepper', () => {
    const filePath = path.join(ROOT_DIR, 'src/components/ui/DishCard.tsx');
    assert.ok(fs.existsSync(filePath), 'DishCard.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(content, /Minus/, 'DishCard must import Minus');
    assert.match(content, /Plus/, 'DishCard must import Plus');
    assert.match(content, /cartQuantity\s*===\s*0\s*\?/, 'Must check cartQuantity === 0');
    assert.match(content, /handleIncrement/, 'Must have handleIncrement');
    assert.match(content, /handleDecrement/, 'Must have handleDecrement');
  });

  await t.test('4. SpotlightSearchModal supports live bag quantity stepper on active dish', () => {
    const filePath = path.join(ROOT_DIR, 'src/components/search/CulinarySpotlightModal.tsx');
    assert.ok(fs.existsSync(filePath), 'CulinarySpotlightModal.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(content, /handleDecrementActiveDish/, 'Must have decrement handler for active dish');
    assert.match(content, /activeDishQty\s*===\s*0/, 'Must check activeDishQty in preview pane');
    assert.match(content, /Add More/, 'Must provide Add More action');
    assert.match(content, /in\s*bag/, 'Must show in bag quantity count');
  });
});
