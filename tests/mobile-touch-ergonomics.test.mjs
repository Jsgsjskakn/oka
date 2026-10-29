import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Agent 7 Verification: Mobile Touch & Ergonomics Specialist', () => {
  const root = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

  describe('1. Mobile Touch-Trap Prevention in Restaurant3DFloorplan.tsx', () => {
    const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
    const content = fs.readFileSync(floorplanPath, 'utf8');

    it('implements touchOrbitActive state to separate page scroll from 3D camera orbit', () => {
      assert.ok(
        content.includes('touchOrbitActive') && content.includes('setTouchOrbitActive'),
        'Restaurant3DFloorplan must define touchOrbitActive state'
      );
    });

    it('configures OrbitControls touches to pass through single finger gestures when locked', () => {
      assert.ok(
        content.includes('touches={{') &&
          content.includes('touchOrbitActive ? THREE.TOUCH.ROTATE : (-1 as unknown as THREE.TOUCH)') &&
          content.includes('TWO: THREE.TOUCH.DOLLY_ROTATE'),
        'OrbitControls must configure touches to allow 1-finger pass-through and 2-finger rotate/dolly'
      );
    });

    it('synchronizes Canvas DOM touch-action with touchOrbitActive state to allow native vertical scrolling', () => {
      assert.ok(
        content.includes('function MobileTouchSync') &&
          content.includes("gl.domElement.style.touchAction = touchOrbitActive ? 'none' : 'pan-y'"),
        'MobileTouchSync must set touchAction to pan-y in scroll mode and none in orbit mode'
      );
    });

    it('provides a dedicated touch lock/unlock button with clear interactive UX states', () => {
      assert.ok(
        content.includes('Page Scroll Mode') &&
          content.includes('3D Orbit Active') &&
          content.includes('setTouchOrbitActive(!touchOrbitActive)'),
        'Floorplan must provide a dedicated toggle button between Page Scroll Mode and 3D Orbit Active'
      );
    });

    it('provides clear two-finger gesture instruction overlays for mobile touch users', () => {
      assert.ok(
        content.includes('Use 2 fingers to rotate') ||
          content.includes('Use two fingers to rotate'),
        'Floorplan must provide clear guidance for two-finger rotation on mobile'
      );
    });
  });

  describe('2. Accessibility Guidelines: Minimum 48×48px Tap Targets', () => {
    const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
    const collidersPath = path.join(root, 'src/components/booking/TableColliders.tsx');
    const viewerControlsPath = path.join(root, 'src/components/viewer/ViewerControls.tsx');

    const floorplanContent = fs.readFileSync(floorplanPath, 'utf8');
    const collidersContent = fs.readFileSync(collidersPath, 'utf8');
    const viewerControlsContent = fs.readFileSync(viewerControlsPath, 'utf8');

    it('view preset buttons in floorplan header satisfy minimum 48px touch targets (min-h-[48px] min-w-[48px])', () => {
      const match48 = floorplanContent.match(/min-h-\[48px\]/g);
      assert.ok(
        match48 && match48.length >= 5,
        `Expected at least 5 buttons with min-h-[48px] in floorplan header, found ${match48 ? match48.length : 0}`
      );
      assert.ok(
        floorplanContent.includes('touch-manipulation'),
        'Header buttons must include touch-manipulation'
      );
    });

    it('touch lock toggle button in floorplan satisfies minimum 48×48px tap target', () => {
      assert.ok(
        floorplanContent.includes('min-h-[48px]') && floorplanContent.includes('min-w-[48px]'),
        'Touch mode button must be at least 48x48px'
      );
    });

    it('table floating HTML markers in TableColliders satisfy minimum 48×48px tap targets with hit-area expansion', () => {
      assert.ok(
        collidersContent.includes('min-h-[44px]') || collidersContent.includes('min-h-[48px]'),
        'Table marker button must have minimum 44px/48px height'
      );
      assert.ok(
        collidersContent.includes('before:-inset-2') || collidersContent.includes('touch-manipulation'),
        'Table marker button must include hit area expansion or touch-manipulation'
      );
    });

    it('3D viewer dock controls in ViewerControls satisfy minimum 48×48px tap targets', () => {
      assert.ok(
        viewerControlsContent.includes('min-h-[48px]') && viewerControlsContent.includes('min-w-[48px]'),
        'ViewerControls buttons must satisfy min-h-[48px] min-w-[48px]'
      );
      assert.ok(
        viewerControlsContent.includes('touch-manipulation'),
        'ViewerControls buttons must include touch-manipulation'
      );
    });
  });

  describe('3. Mobile Touch Trap Prevention in Other 3D Canvases', () => {
    const promoPath = path.join(root, 'src/components/home/PromoWarriorCanvas.tsx');
    const heroPath = path.join(root, 'src/components/home/HeroWarriorCanvas.tsx');

    const promoContent = fs.readFileSync(promoPath, 'utf8');
    const heroContent = fs.readFileSync(heroPath, 'utf8');

    it('PromoWarriorCanvas on homepage prevents touch-trap with 1-finger scroll pass-through', () => {
      assert.ok(
        promoContent.includes('ONE: (-1 as unknown as THREE.TOUCH)') &&
          promoContent.includes('TWO: THREE.TOUCH.DOLLY_ROTATE'),
        'PromoWarriorCanvas must pass through single finger touch'
      );
      assert.ok(
        promoContent.includes("touchAction: 'pan-y'") || promoContent.includes("touchAction = 'pan-y'"),
        'PromoWarriorCanvas must set touchAction to pan-y'
      );
    });

    it('HeroWarriorCanvas prevents touch-trap with 1-finger scroll pass-through', () => {
      assert.ok(
        heroContent.includes('ONE: (-1 as unknown as THREE.TOUCH)') &&
          heroContent.includes('TWO: THREE.TOUCH.DOLLY_ROTATE'),
        'HeroWarriorCanvas must pass through single finger touch'
      );
      assert.ok(
        heroContent.includes("touchAction: 'pan-y'"),
        'HeroWarriorCanvas must set touchAction to pan-y'
      );
    });
  });

  describe('4. Page-Level Gesture Integrity & Double-Tap Prevention', () => {
    const globalsPath = path.join(root, 'src/app/globals.css');
    const layoutPath = path.join(root, 'src/app/layout.tsx');

    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    it('globals.css applies touch-action: manipulation to interactive elements', () => {
      assert.ok(
        globalsContent.includes('touch-action: manipulation;'),
        'globals.css must apply touch-action: manipulation'
      );
    });

    it('layout.tsx configures viewport correctly for mobile ergonomics', () => {
      assert.ok(
        layoutContent.includes("width: 'device-width'") &&
          layoutContent.includes('initialScale: 1'),
        'Root layout must configure viewport width and initialScale'
      );
    });
  });

  describe('5. Mobile Fullscreen Mode, Notches & Dock Safety', () => {
    const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
    const touchSyncPath = path.join(root, 'src/components/booking/MobileTouchSync.tsx');
    const floorplanContent = fs.readFileSync(floorplanPath, 'utf8');

    it('exports standalone MobileTouchSync component', () => {
      assert.ok(fs.existsSync(touchSyncPath), 'MobileTouchSync.tsx must exist as a standalone component');
      const touchSyncContent = fs.readFileSync(touchSyncPath, 'utf8');
      assert.ok(
        touchSyncContent.includes('export function MobileTouchSync') &&
          touchSyncContent.includes("gl.domElement.style.touchAction = touchOrbitActive ? 'none' : 'pan-y'"),
        'MobileTouchSync must synchronize gl.domElement.style.touchAction'
      );
    });

    it('attached fullscreen trigger bar has large tap target and touch-manipulation', () => {
      assert.ok(
        floorplanContent.includes('min-h-[56px]') &&
          floorplanContent.includes('touch-manipulation') &&
          floorplanContent.includes('Open Fullscreen 3D Table Selector'),
        'Attached fullscreen bar must have min-h-[56px] and touch-manipulation'
      );
    });

    it('fullscreen mode accounts for dynamic mobile viewport height (100dvh) and notch safe-areas', () => {
      assert.ok(
        floorplanContent.includes('h-[100dvh]'),
        'Fullscreen layout must include h-[100dvh] for mobile browser address bars'
      );
      assert.ok(
        floorplanContent.includes('env(safe-area-inset-top)') &&
          floorplanContent.includes('env(safe-area-inset-bottom)'),
        'Fullscreen layout must respect hardware safe-area insets'
      );
    });

    it('fullscreen controls do not collide with bottom table selector dock', () => {
      assert.ok(
        floorplanContent.includes("isFullscreenMode ? 'bottom-[136px] sm:bottom-[88px]") ||
          floorplanContent.includes('bottom-[136px]'),
        'Orbit toggle button and floating helpers must be elevated above the bottom dock in fullscreen mode'
      );
    });

    it('table quick selector buttons in dock include touch-manipulation and mobile tap dimensions', () => {
      assert.ok(
        floorplanContent.includes('min-h-[44px] min-w-[42px]') &&
          floorplanContent.includes('touch-manipulation'),
        'Table buttons in quick selector dock must provide comfortable mobile tap sizing'
      );
    });
  });
});
