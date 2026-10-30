import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

describe('Menu Admin Actions Contract & Invalidation Verification (Stage 3)', () => {
  const actionsPath = path.join(ROOT_DIR, 'src/app/admin/(protected)/menu/actions.ts');

  it('1. Verifies actions.ts imports invalidateMenuCache from menu.service', () => {
    assert.ok(fs.existsSync(actionsPath), 'actions.ts must exist');
    const content = fs.readFileSync(actionsPath, 'utf-8');

    assert.match(
      content,
      /import\s+\{\s*invalidateMenuCache\s*\}\s+from\s+['"]@\/lib\/services\/menu\.service['"];?/,
      'actions.ts must import invalidateMenuCache from @/lib/services/menu.service'
    );
  });

  it('2. Verifies all 6 admin mutations call invalidateMenuCache on both Convex and Supabase success paths', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8');

    const expectedActions = [
      'updateDishAvailability',
      'updateDishFeatured',
      'updateDishPrice',
      'updateFullDishDetails',
      'updateCategoryDetails',
      'createCategory',
    ];

    for (let i = 0; i < expectedActions.length; i++) {
      const actionName = expectedActions[i];
      const startMarker = `export async function ${actionName}`;
      const startIndex = content.indexOf(startMarker);
      assert.ok(startIndex !== -1, `Action function ${actionName} must be present in actions.ts`);

      let endIndex = content.length;
      if (i < expectedActions.length - 1) {
        const nextActionMarker = `export async function ${expectedActions[i + 1]}`;
        const nextIndex = content.indexOf(nextActionMarker);
        if (nextIndex !== -1) endIndex = nextIndex;
      }

      const funcBody = content.slice(startIndex, endIndex);

      // Must require admin authorization
      assert.match(funcBody, /await\s+requireAdmin\(\)/, `${actionName} must call requireAdmin() first`);

      // Must call invalidateMenuCache in Convex success branch
      assert.match(
        funcBody,
        /if\s*\(\s*res\s*&&\s*res\.success\s*\)\s*\{[\s\S]*?invalidateMenuCache\(\);[\s\S]*?revalidatePath/,
        `${actionName} must invoke invalidateMenuCache() before revalidatePath in Convex success path`
      );

      // Must call invalidateMenuCache in Supabase fallback success path
      assert.match(
        funcBody,
        /invalidateMenuCache\(\);\s*\r?\n\s*revalidatePath\('\/menu'\);/,
        `${actionName} must invoke invalidateMenuCache() before revalidatePath('/menu') in Supabase success path`
      );

      // Outer catch block must not invoke invalidateMenuCache
      const outerCatchMatch = funcBody.match(/catch\s*\(\s*e\s*:\s*any\s*\)\s*\{([\s\S]*?)\}/);
      assert.ok(outerCatchMatch, `${actionName} must have an outer catch (e: any) block`);
      assert.strictEqual(
        outerCatchMatch[1].includes('invalidateMenuCache'),
        false,
        `${actionName} catch block must NOT invoke invalidateMenuCache on failure`
      );
    }
  });

  it('3. Verifies total invalidateMenuCache invocation count matches exact 6 action matrix (12 sites)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8');

    // Count non-import occurrences of invalidateMenuCache()
    const callMatches = content.match(/invalidateMenuCache\(\);/g);
    assert.ok(callMatches, 'Must have invalidateMenuCache calls');
    assert.strictEqual(
      callMatches.length,
      12,
      'Must have exactly 12 invalidateMenuCache() call sites (2 per action across 6 actions)'
    );
  });
});
