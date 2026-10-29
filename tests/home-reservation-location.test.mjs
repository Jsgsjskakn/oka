import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

test('HomeReservationAndLocationSection Component & Layout Audit', async (t) => {
  const componentPath = path.join(PROJECT_ROOT, 'src/components/home/HomeReservationAndLocationSection.tsx');
  assert.ok(fs.existsSync(componentPath), 'HomeReservationAndLocationSection.tsx should exist');

  const content = fs.readFileSync(componentPath, 'utf8');

  await t.test('1. Card 1 (Reservation / Find Seats) visual elements match reference', () => {
    // Overline and exclusivity badges
    assert.match(content, /RESERVATION/, 'Must feature RESERVATION badge/ribbon');
    assert.match(content, /Exclusive Dining/, 'Must feature Exclusive Dining badge');
    assert.match(content, /An Unforgettable Evening Awaits/, 'Must feature exact title');
    assert.match(content, /Reserve your table for a truly exceptional dining experience\./, 'Must feature subtitle');

    // Dropdown input boxes
    assert.match(content, /Guests/, 'Must have Guests dropdown box');
    assert.match(content, /Date/, 'Must have Date dropdown box');
    assert.match(content, /Time/, 'Must have Time dropdown box');

    // CTA Button
    assert.match(content, /Find a Table/, 'Must have Find a Table CTA');

    // 4 Bottom badges
    assert.match(content, /Instant Confirmation/, 'Must feature Instant Confirmation badge');
    assert.match(content, /Secure Payment/, 'Must feature Secure Payment badge');
    assert.match(content, /Premium Experience/, 'Must feature Premium Experience badge');
    assert.match(content, /Free Cancellation/, 'Must feature Free Cancellation badge');
  });

  await t.test('2. Card 2 (Our Location & Map) visual elements match reference', () => {
    // Badges and location header
    assert.match(content, /OUR LOCATION/, 'Must feature OUR LOCATION badge');
    assert.match(content, /The Golden Oak/, 'Must mention The Golden Oak');
    assert.match(content, /Indiranagar, Bengaluru/, 'Must specify Indiranagar, Bengaluru');
    assert.match(content, /4\.8[\s\S]*?1,240\+\s*Verified Diners/, 'Must show exact rating and diner review count');

    // Address & copy action
    assert.match(content, /45 Golden Oak Boulevard, 100 Feet Road, Indiranagar, Bengaluru/, 'Must have exact street address');
    assert.match(content, /Operating Hours/, 'Must show Operating Hours');
    assert.match(content, /12:00 PM – 11:30 PM/, 'Must show operating time slot');
    assert.match(content, /Open at 12:00 PM/, 'Must show live open status');
    assert.match(content, /Online Bookings Open/, 'Must confirm online bookings are active');

    // Interactive Map & Compass
    assert.match(content, /View Map/, 'Must have View Map link button');
    assert.match(content, /Indiranagar Metro Station|Metro Station/, 'Must feature Metro Station marker');
    assert.match(content, /indiranagar-night-map-clean\.png|map/, 'Must reference custom map graphic');

    // 4 Feature badges
    assert.match(content, /Complimentary Valet/, 'Must feature Complimentary Valet badge');
    assert.match(content, /Wood-Fired Hearth/, 'Must feature Wood-Fired Hearth badge');
    assert.match(content, /Sommelier Wine Cellar/, 'Must feature Sommelier Wine Cellar badge');
    assert.match(content, /Private Dining Suites/, 'Must feature Private Dining Suites badge');
  });

  await t.test('3. Backend state and store integration', () => {
    // Store integration
    assert.match(content, /useNotificationStore/, 'Must integrate with useNotificationStore');
    assert.match(content, /addNotification/, 'Must call addNotification upon reservation inquiry');
    assert.match(content, /toast\.success/, 'Must trigger visual toast confirmation');
    assert.match(content, /router\.push/, 'Must route to booking with query parameters');
    assert.match(content, /guests=/, 'Must pass guests query param');
    assert.match(content, /date=/, 'Must pass date query param');
    assert.match(content, /time=/, 'Must pass time query param');
  });

  await t.test('4. Page mounting verification', () => {
    const pagePath = path.join(PROJECT_ROOT, 'src/app/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    assert.match(pageContent, /HomeReservationAndLocationSection/, 'page.tsx must import and mount HomeReservationAndLocationSection');
  });

  await t.test('5. Static asset assets existence', () => {
    const wineImg = path.join(PROJECT_ROOT, 'public/images/reservation-wine-table-clean.png');
    const mapImg = path.join(PROJECT_ROOT, 'public/images/indiranagar-night-map-clean.png');
    assert.ok(fs.existsSync(wineImg), 'reservation-wine-table-clean.png must exist in public/images');
    assert.ok(fs.existsSync(mapImg), 'indiranagar-night-map-clean.png must exist in public/images');
  });

  await t.test('6. Stationary Oak Tree background integration ("tree ek he jagha rahega")', () => {
    const treeCompPath = path.join(PROJECT_ROOT, 'src/components/home/StationaryOakTreeBackground.tsx');
    assert.ok(fs.existsSync(treeCompPath), 'StationaryOakTreeBackground.tsx must exist');

    const treeContent = fs.readFileSync(treeCompPath, 'utf8');
    assert.match(treeContent, /generateOakParticleMap/, 'Must use same preloader Oak tree particle generator');
    assert.match(treeContent, /GOLD_PALETTE/, 'Must use luxury gold palette constants');
    assert.match(treeContent, /canvas/, 'Must render 2D high-performance canvas');
    assert.match(treeContent, /p\.targetX/, 'Must anchor particles to target emblem positions');
    assert.match(treeContent, /p\.targetY/, 'Must anchor particles to target emblem positions');
    assert.match(treeContent, /IntersectionObserver/, 'Must optimize performance with offscreen intersection pausing');

    // Section integration
    assert.match(content, /StationaryOakTreeBackground/, 'HomeReservationAndLocationSection must mount StationaryOakTreeBackground');
  });
});
