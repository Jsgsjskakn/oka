import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Concierge Notification Center Specialist Audit', async (t) => {
  const notifStorePath = path.join(root, 'src/store/notification-store.ts');
  const notifCenterPath = path.join(root, 'src/components/layout/NotificationCenter.tsx');
  const topBarPath = path.join(root, 'src/components/layout/TopBar.tsx');

  await t.test('1. Core File Architecture Existence', () => {
    assert.ok(fs.existsSync(notifStorePath), 'notification-store.ts must exist');
    assert.ok(fs.existsSync(notifCenterPath), 'NotificationCenter.tsx must exist');
    assert.ok(fs.existsSync(topBarPath), 'TopBar.tsx must exist');
  });

  const storeSrc = fs.readFileSync(notifStorePath, 'utf8');
  const centerSrc = fs.readFileSync(notifCenterPath, 'utf8');
  const topBarSrc = fs.readFileSync(topBarPath, 'utf8');

  await t.test('2. TopBar Integration & Exact Location Audit', () => {
    // NotificationCenter must be mounted in TopBar in the action cluster
    assert.ok(
      topBarSrc.includes('<NotificationCenter />') || topBarSrc.includes('<NotificationCenter/>'),
      'TopBar must mount NotificationCenter'
    );
    assert.ok(
      topBarSrc.includes("import { NotificationCenter } from '@/components/layout/NotificationCenter';"),
      'TopBar must import NotificationCenter'
    );
  });

  await t.test('3. Notification Types Coverage Audit', () => {
    // Must support Payment Accepted, Payment Failed, Table / Seat Confirmation, Order In Kitchen, Order Delivered
    const requiredTypes = [
      'payment_success',
      'payment_failed',
      'table_confirmed',
      'order_preparing',
      'order_delivered',
    ];

    for (const type of requiredTypes) {
      assert.ok(
        storeSrc.includes(type),
        `notification-store must define and support '${type}' notification type`
      );
    }

    // Must support categories: payment, table, order
    assert.ok(storeSrc.includes("'payment'"), "Must support 'payment' category");
    assert.ok(storeSrc.includes("'table'"), "Must support 'table' category");
    assert.ok(storeSrc.includes("'order'"), "Must support 'order' category");
  });

  await t.test('4. Notification Center Luxury UI & Clean Guest Experience Audit', () => {
    // Bell icon with badge
    assert.ok(centerSrc.includes('<Bell'), 'NotificationCenter must render Bell trigger icon');
    assert.ok(centerSrc.includes('unreadCount'), 'NotificationCenter must display unread count badge');

    // Filter tabs
    assert.ok(centerSrc.includes('Payments'), 'NotificationCenter must include Payments tab');
    assert.ok(centerSrc.includes('Table / Seat'), 'NotificationCenter must include Table / Seat tab');
    assert.ok(centerSrc.includes('Orders'), 'NotificationCenter must include Orders tab');

    // Luxury refinement: Mark-as-read and delete options strictly removed from UI per owner specification
    assert.ok(!centerSrc.includes('markAllAsRead'), 'NotificationCenter must remove mark-all-as-read button');
    assert.ok(!centerSrc.includes('clearAll'), 'NotificationCenter must remove clear-all button');
    assert.ok(!centerSrc.includes('deleteNotification'), 'NotificationCenter must remove delete/dismiss buttons from cards');

    // Simulator dock strictly removed from guest-facing luxury UI
    assert.ok(!centerSrc.includes('+ Paid'), 'Simulator + Paid button must be removed from luxury guest UI');
    assert.ok(!centerSrc.includes('+ Fail'), 'Simulator + Fail button must be removed from luxury guest UI');
    assert.ok(!centerSrc.includes('+ Seat'), 'Simulator + Seat button must be removed from luxury guest UI');
    assert.ok(!centerSrc.includes('+ Order'), 'Simulator + Order button must be removed from luxury guest UI');

    // Store continues to retain underlying support
    assert.ok(storeSrc.includes('markAllAsRead'), 'notification-store must retain markAllAsRead in store API');
    assert.ok(storeSrc.includes('deleteNotification'), 'notification-store must retain deleteNotification in store API');
  });

  await t.test('5. Accessibility & Responsive Dialog Ergonomics', () => {
    assert.ok(centerSrc.includes('aria-expanded'), 'Bell button must manage aria-expanded');
    assert.ok(centerSrc.includes('aria-haspopup'), 'Bell button must declare aria-haspopup');
    assert.ok(centerSrc.includes("role=\"dialog\""), 'Notification panel must specify role="dialog"');
    assert.ok(centerSrc.includes("e.key === 'Escape'"), 'Must handle Escape key dismissal');
  });
});
