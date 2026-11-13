import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useToastStore, toast, MAX_TOASTS } from '../src/store/toast-store.ts';

const root = process.cwd();

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function parseZIndexValue(token) {
  const bracketMatch = token.match(/^z-\[(\d+)\]$/);
  if (bracketMatch) return Number(bracketMatch[1]);
  const namedMatch = token.match(/^z-(\d+)$/);
  if (namedMatch) return Number(namedMatch[1]);
  return NaN;
}

function extractMaxZIndex(source, predicate = () => true) {
  const matches = [...source.matchAll(/(?:^|[\s"'`])(z-(?:\[\d+\]|\d+))(?=$|[\s"'`])/g)]
    .map((m) => m[1])
    .filter(predicate)
    .map(parseZIndexValue)
    .filter(Number.isFinite);
  assert.ok(matches.length > 0, 'Expected at least one matching z-index utility');
  return Math.max(...matches);
}

test('Desktop & Mobile Bugfix Regression Suite', async (t) => {
  await t.test('1. Share & 3D/AR Routes: zero /dish/${dishId} 404 URLs and valid /3d & /ar navigation', () => {
    const shareSheetSrc = readProjectFile('src/components/ar/ARShareSheet.tsx');
    const topBarSrc = readProjectFile('src/components/layout/TopBar.tsx');
    const bottomNavSrc = readProjectFile('src/components/layout/BottomNav.tsx');

    // No broken /dish/ share URL in ARShareSheet
    assert.ok(
      !shareSheetSrc.includes('/dish/${dishId}') && !shareSheetSrc.includes("'/dish/'"),
      'ARShareSheet must not construct nonexistent /dish/${dishId} 404 share URLs'
    );
    assert.ok(
      shareSheetSrc.includes('/3d/${dishId}'),
      'ARShareSheet share URL must target valid /3d/${dishId} route'
    );
    assert.ok(
      shareSheetSrc.includes("e.key === 'Escape'"),
      'ARShareSheet must support Escape key dismissal'
    );
    assert.ok(
      shareSheetSrc.includes('min-w-[44px]') && shareSheetSrc.includes('min-h-[44px]'),
      'ARShareSheet close button must meet >=44px touch target ergonomics'
    );

    // Valid target route files must exist on disk
    assert.ok(fs.existsSync(path.join(root, 'src/app/3d/[dishId]/page.tsx')), '/3d/[dishId] route must exist');
    assert.ok(fs.existsSync(path.join(root, 'src/app/ar/page.tsx')), '/ar route must exist');
    assert.ok(fs.existsSync(path.join(root, 'src/app/ar/[dishId]/page.tsx')), '/ar/[dishId] route must exist');

    // TopBar 3D Lounge CTA and BottomNav AR Center CTA must target valid routes
    assert.match(topBarSrc, /href:\s*['"]\/3d\/[a-z0-9-]+['"]/i, 'TopBar 3D Experience nav link must target a valid /3d/<slug> route');
    assert.ok(
      bottomNavSrc.includes('href="/ar"') || bottomNavSrc.includes("href: '/ar'"),
      'BottomNav center button must link to /ar'
    );
  });

  await t.test('2. Mock Orders Media Audit: zero missing .jpg dish paths and every referenced asset exists', () => {
    const mockOrdersSrc = readProjectFile('src/data/mock-orders.ts');
    assert.ok(
      !/\/images\/dishes\/[^'"`\s]+\.jpg\b/i.test(mockOrdersSrc),
      'mock-orders.ts must not reference broken /images/dishes/*.jpg paths'
    );

    const imageRefs = [...mockOrdersSrc.matchAll(/['"](\/images\/[^'"`\s]+)['"]/g)].map((m) => m[1]);
    assert.ok(imageRefs.length >= 2, 'mock-orders.ts must reference dish images');
    for (const relImg of imageRefs) {
      const diskPath = path.join(root, 'public', relImg.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Referenced mock order image missing on disk: ${relImg}`);
    }
  });

  await t.test('3. TopBar, BottomNav & MobileShell: exact Home matching, SSR-safe badge & overflow guards', () => {
    const topBarSrc = readProjectFile('src/components/layout/TopBar.tsx');
    const bottomNavSrc = readProjectFile('src/components/layout/BottomNav.tsx');
    const mobileShellSrc = readProjectFile('src/components/layout/MobileShell.tsx');

    // No hardcoded '2' badge bug
    assert.ok(
      !topBarSrc.includes(": '2'") && !topBarSrc.includes(': "2"'),
      "TopBar must not fall back to hardcoded '2' badge before hydration"
    );
    assert.ok(
      topBarSrc.includes('isMounted && totalCartItems > 0'),
      'TopBar cart badge must render only after mount when totalCartItems > 0'
    );

    // Exact '/' match for Home nav active highlight in TopBar & BottomNav
    assert.ok(
      topBarSrc.includes("link.href === '/' ? pathname === '/'"),
      "TopBar must check exact pathname === '/' for Home active state"
    );
    assert.ok(
      bottomNavSrc.includes("item.href === '/' ? pathname === '/'"),
      "BottomNav must check exact pathname === '/' for Home active state"
    );
    assert.ok(
      bottomNavSrc.includes('pathname?.'),
      'BottomNav must guard nullable pathname with optional chaining'
    );

    // TopBar mobile drawer accessibility & scroll lock
    assert.ok(
      topBarSrc.includes("e.key === 'Escape'") && topBarSrc.includes('overflow'),
      'TopBar mobile drawer must lock body scroll and close on Escape'
    );

    // MobileShell layout containment
    assert.ok(mobileShellSrc.includes('overflow-x-hidden'), 'MobileShell must prevent horizontal overflow');
    assert.ok(
      mobileShellSrc.includes("pathname?.startsWith('/3d')") && mobileShellSrc.includes("pathname?.startsWith('/ar')"),
      'MobileShell must detect fullscreen /3d and /ar routes safely'
    );
    assert.ok(
      mobileShellSrc.includes('<ToastContainer'),
      'MobileShell must mount ToastContainer'
    );
  });

  await t.test('4. Responsive Sheets, 3D Viewer HUD & ToastContainer Regression Checks', () => {
    const sortSheetSrc = readProjectFile('src/components/menu/SortSheet.tsx');
    const filterSheetSrc = readProjectFile('src/components/menu/FilterSheet.tsx');
    const dishSwitcherSrc = readProjectFile('src/components/viewer/DishSwitcher.tsx');
    const dishInfoBarSrc = readProjectFile('src/components/viewer/DishInfoBar.tsx');
    const viewerControlsSrc = readProjectFile('src/components/viewer/ViewerControls.tsx');
    const toastContainerSrc = readProjectFile('src/components/ui/ToastContainer.tsx');

    // SortSheet & FilterSheet use modal lock/escape hook and safe-area mobile sizing
    for (const [label, src] of [
      ['SortSheet', sortSheetSrc],
      ['FilterSheet', filterSheetSrc],
    ]) {
      assert.ok(src.includes('useSheetModal'), `${label} must integrate useSheetModal for scroll lock and Escape handling`);
      assert.ok(src.includes('safe-area-inset-bottom'), `${label} must respect mobile safe-area-inset-bottom`);
      assert.ok(src.includes('sm:'), `${label} must provide responsive desktop modal layout breakpoints`);
    }

    // DishSwitcher: matches both id and slug & avoids colliding with DishInfoBar
    assert.ok(
      dishSwitcherSrc.includes('d.id === currentDishId || d.slug === currentDishId'),
      'DishSwitcher must match current dish by either id or slug'
    );
    assert.ok(
      dishSwitcherSrc.includes('sm:right-['),
      'DishSwitcher must reserve horizontal clearance on sm+ screens for DishInfoBar'
    );
    assert.ok(
      dishSwitcherSrc.includes('safe-area-inset-bottom'),
      'DishSwitcher mobile dock must position cleanly above DishInfoBar with safe-area offset'
    );

    // DishInfoBar: cleans up addedTimerRef timer on unmount / dish change
    assert.ok(
      dishInfoBarSrc.includes('clearTimeout(addedTimerRef.current)') &&
        dishInfoBarSrc.includes('safe-area-inset-bottom'),
      'DishInfoBar must clear feedback timeout on cleanup and support safe-area-inset-bottom'
    );

    // ViewerControls: modal JSX hoisted BEFORE variant === 'modal' early return (no TDZ crash)
    const modalDeclIndex = viewerControlsSrc.indexOf('const settingsModalNode =');
    const modalReturnIndex = viewerControlsSrc.indexOf("if (variant === 'modal')");
    assert.ok(modalDeclIndex !== -1 && modalReturnIndex !== -1, 'ViewerControls must define settingsModalNode and modal variant branch');
    assert.ok(
      modalDeclIndex < modalReturnIndex,
      'ViewerControls must initialize settingsModalNode before if (variant === "modal") return to avoid TDZ ReferenceError'
    );

    // ToastContainer: non-blocking outer wrapper, clickable cards, escaped JSX rendering
    assert.ok(toastContainerSrc.includes('pointer-events-none'), 'ToastContainer outer stack must be pointer-events-none');
    assert.ok(toastContainerSrc.includes('pointer-events-auto'), 'ToastContainer cards must be pointer-events-auto');
    assert.ok(!toastContainerSrc.includes('dangerouslySetInnerHTML'), 'ToastContainer must never use dangerouslySetInnerHTML');
  });

  await t.test('5. next.config.ts: PWA headers, WASM MIME/CSP, AR CORS, and LAN allowedDevOrigins', () => {
    const nextConfigSrc = readProjectFile('next.config.ts');

    assert.ok(nextConfigSrc.includes('getLocalIpAddresses'), 'next.config.ts must preserve LAN IP discovery');
    assert.ok(nextConfigSrc.includes('allowedDevOrigins'), 'next.config.ts must configure allowedDevOrigins');
    assert.ok(nextConfigSrc.includes("'wasm-unsafe-eval'"), "next.config.ts CSP script-src must allow 'wasm-unsafe-eval' for Draco WASM");
    assert.ok(nextConfigSrc.includes("hostname: '*.supabase.co'"), 'next.config.ts images.remotePatterns must include *.supabase.co');
    assert.ok(nextConfigSrc.includes("source: '/sw.js'"), 'next.config.ts must set explicit headers for /sw.js');
    assert.ok(
      nextConfigSrc.includes('no-cache, no-store, must-revalidate'),
      'next.config.ts /sw.js header must disable stale caching'
    );
    assert.ok(
      nextConfigSrc.includes('application/wasm') && nextConfigSrc.includes('.wasm'),
      'next.config.ts must serve .wasm files with application/wasm MIME type'
    );
    assert.ok(
      nextConfigSrc.includes("Access-Control-Allow-Origin") && nextConfigSrc.includes("'*'"),
      'next.config.ts must allow cross-origin fetch for static 3D/WASM/AR assets'
    );
    assert.ok(
      fs.existsSync(path.join(root, 'public/draco/draco_decoder.wasm')) &&
        fs.existsSync(path.join(root, 'public/draco/draco_wasm_wrapper.js')),
      'Draco decoder runtime files must exist in public/draco/'
    );
  });

  await t.test('6. Toast Store Behavior: deduping, timer cleanup, unique IDs, max cap & sanitization', async () => {
    useToastStore.getState().clearToasts();

    // Unique IDs across rapid burst
    const ids = new Set();
    for (let i = 0; i < 4; i++) {
      const id = useToastStore.getState().addToast({
        title: `Dish Alert ${i}`,
        type: 'info',
        duration: 5000,
      });
      assert.ok(id.length > 0, 'addToast must return a non-empty id');
      ids.add(id);
    }
    assert.equal(ids.size, 4, 'Rapid consecutive addToast calls must yield unique IDs');

    // Deduplication returns same ID without duplicating row
    const firstId = useToastStore.getState().addToast({
      title: 'Added to Bag',
      description: 'Truffle Mushroom Pizza',
      type: 'success',
      duration: 5000,
    });
    const dupId = useToastStore.getState().addToast({
      title: 'Added to Bag',
      description: 'Truffle Mushroom Pizza',
      type: 'success',
      duration: 5000,
    });
    assert.equal(dupId, firstId, 'Duplicate active toast must return and refresh existing id');
    const matches = useToastStore.getState().toasts.filter((t) => t.title === 'Added to Bag');
    assert.equal(matches.length, 1, 'Duplicate active toast must not render twice');

    // Bounded capacity eviction
    useToastStore.getState().clearToasts();
    for (let i = 0; i < MAX_TOASTS + 3; i++) {
      useToastStore.getState().addToast({
        title: `Cap Item ${i}`,
        type: 'info',
        duration: 5000,
      });
    }
    const active = useToastStore.getState().toasts;
    assert.equal(active.length, MAX_TOASTS, `Toast stack must be capped at MAX_TOASTS=${MAX_TOASTS}`);
    assert.equal(active[0].title, 'Cap Item 3', 'Oldest toasts must be evicted when capacity exceeded');

    // Control-char and nullish safety
    useToastStore.getState().clearToasts();
    const sanitizedId = toast.warning('  Table \u0000 Hold\tExpiring  ', undefined, 5000);
    const stored = useToastStore.getState().toasts.find((item) => item.id === sanitizedId);
    assert.ok(stored, 'toast.warning helper must add toast');
    assert.equal(stored.title, 'Table Hold Expiring', 'Toast text must sanitize control chars and normalize whitespace');
    assert.equal(stored.description, undefined);

    // Manual dismiss removes immediately and clears pending timer
    useToastStore.getState().removeToast(sanitizedId);
    assert.equal(useToastStore.getState().toasts.length, 0, 'removeToast must immediately remove toast');

    // Auto-dismiss fires cleanly
    const shortId = useToastStore.getState().addToast({
      title: 'Auto Dismiss Test',
      type: 'success',
      duration: 25,
    });
    assert.equal(useToastStore.getState().toasts.some((item) => item.id === shortId), true);
    await new Promise((resolve) => setTimeout(resolve, 90));
    assert.equal(
      useToastStore.getState().toasts.some((item) => item.id === shortId),
      false,
      'Toast must auto-dismiss once its duration elapses'
    );

    useToastStore.getState().clearToasts();
  });

  await t.test('7. Notification Store Static Safety: SSR hydration, safe storage, href validation & capped growth', () => {
    const notifSrc = readProjectFile('src/store/notification-store.ts');
    const initialBlockMatch = notifSrc.match(/const INITIAL_NOTIFICATIONS:[\s\S]*?\n\];/);

    assert.ok(initialBlockMatch, 'INITIAL_NOTIFICATIONS array block must exist');
    assert.ok(
      notifSrc.includes('INITIAL_SEED_TIMESTAMP') && !initialBlockMatch[0].includes('Date.now()'),
      'INITIAL_NOTIFICATIONS must use deterministic baseline timestamp instead of Date.now() for SSR hydration safety'
    );
    assert.ok(
      notifSrc.includes('createJSONStorage') && notifSrc.includes("typeof window === 'undefined'"),
      'notification-store must wrap persist storage with SSR window guard'
    );
    assert.ok(
      notifSrc.includes('sanitizeSafeActionHref') && notifSrc.includes("trimmed.startsWith('//')"),
      'notification-store must sanitize actionHref against unsafe protocols/protocol-relative redirects'
    );
    assert.ok(
      notifSrc.includes('MAX_NOTIFICATIONS') && notifSrc.includes('.slice(0, MAX_NOTIFICATIONS)'),
      'notification-store must bound stored notification history length'
    );
    assert.ok(
      !notifSrc.includes('`sim-${Date.now()}`'),
      'simulateNotification must not use raw Date.now() IDs prone to millisecond collisions'
    );
    assert.ok(
      notifSrc.includes('createNotificationId('),
      'notification-store must generate unique IDs via createNotificationId'
    );
    assert.ok(
      notifSrc.includes("merge:"),
      'notification-store persist config must sanitize/validate rehydrated storage state'
    );
  });

  await t.test('8. Z-Index Layering Hierarchy Constraints across Desktop & Mobile UI', () => {
    const dishInfoBarZ = extractMaxZIndex(readProjectFile('src/components/viewer/DishInfoBar.tsx'));
    const viewerHeaderZ = extractMaxZIndex(readProjectFile('src/components/viewer/ViewerHeader.tsx'));
    const dishSwitcherSrc = readProjectFile('src/components/viewer/DishSwitcher.tsx');
    const dishSwitcherDockZ = parseZIndexValue(dishSwitcherSrc.match(/fixed bottom-\[[^\]]+\][^"\n]*?(?:^|[\s"'`])(z-\[\d+\]|z-\d+)(?=$|[\s"'`])/)?.[1] ?? '');
    const topBarSrc = readProjectFile('src/components/layout/TopBar.tsx');
    const topBarZ = parseZIndexValue(topBarSrc.match(/<header[^>]*?(?:^|[\s"'`])(z-\[\d+\]|z-\d+)(?=$|[\s"'`])/)?.[1] ?? '');
    const bottomNavZ = extractMaxZIndex(readProjectFile('src/components/layout/BottomNav.tsx'));
    const notificationCenterZ = extractMaxZIndex(readProjectFile('src/components/layout/NotificationCenter.tsx'));
    const arShareZ = extractMaxZIndex(readProjectFile('src/components/ar/ARShareSheet.tsx'));
    const ingredientPanelZ = extractMaxZIndex(readProjectFile('src/components/viewer/IngredientPanel.tsx'));
    const sortSheetZ = extractMaxZIndex(readProjectFile('src/components/menu/SortSheet.tsx'));
    const filterSheetZ = extractMaxZIndex(readProjectFile('src/components/menu/FilterSheet.tsx'));
    const viewerModalZ = extractMaxZIndex(readProjectFile('src/components/viewer/ViewerControls.tsx'));
    const topBarDrawerZ = extractMaxZIndex(topBarSrc);
    const floorplanPortalZ = extractMaxZIndex(readProjectFile('src/components/booking/Restaurant3DFloorplan.tsx'));
    const toastZ = extractMaxZIndex(readProjectFile('src/components/ui/ToastContainer.tsx'));

    assert.equal(viewerHeaderZ, 40, 'ViewerHeader should be z-40');
    assert.equal(dishInfoBarZ, 40, 'DishInfoBar should be z-40');
    assert.equal(dishSwitcherDockZ, 45, 'DishSwitcher dock should sit above DishInfoBar at z-[45]');
    assert.equal(topBarZ, 50, 'TopBar header should be z-50');
    assert.equal(bottomNavZ, 50, 'BottomNav should be z-50');
    assert.equal(notificationCenterZ, 50, 'NotificationCenter popover should be z-50');

    assert.ok(dishSwitcherDockZ > dishInfoBarZ, 'DishSwitcher dock must layer above DishInfoBar');
    assert.ok(topBarZ > dishSwitcherDockZ, 'TopBar must layer above 3D dock controls');
    assert.ok(arShareZ > bottomNavZ && arShareZ > topBarZ, 'ARShareSheet must layer above TopBar & BottomNav');
    assert.ok(ingredientPanelZ > topBarZ, 'IngredientPanel drawer must layer above TopBar & viewer docks');
    assert.ok(sortSheetZ >= arShareZ && filterSheetZ >= arShareZ, 'Menu SortSheet & FilterSheet must layer above nav & lower sheets');
    assert.ok(viewerModalZ > sortSheetZ, 'ViewerControls calibration modal must layer above sheets & nav');
    assert.ok(topBarDrawerZ > viewerModalZ, 'TopBar mobile drawer must layer above modals');
    assert.ok(floorplanPortalZ > topBarDrawerZ, 'Fullscreen 3D Floorplan portal must layer above page drawers/nav');
    assert.ok(toastZ > floorplanPortalZ, 'ToastContainer must remain topmost above all portals & modals');
  });
});
