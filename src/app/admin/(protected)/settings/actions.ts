'use server';

import { requireAdmin } from '@/lib/auth/admin-auth';
import { updateSetting } from '@/lib/services/settings.service';
import { revalidatePath } from 'next/cache';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export async function updateSettingAction(key: string, value: unknown): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    const res = await updateSetting(RESTAURANT_ID, key, value);
    if (res && res.error) return { error: res.error };
    revalidatePath('/admin/settings');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save' };
  }
}
