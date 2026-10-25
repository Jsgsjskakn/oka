import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';
import { getSessionToken } from '@/lib/auth/admin-auth';

export async function getSetting(restaurantId: string, key: string): Promise<unknown> {
  // 1. Convex primary
  try {
    const val = await fetchQuery(api.settings.getSetting, { key });
    if (val !== null && val !== undefined) return val;
  } catch {
    // continue to Supabase
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    const { data }: QR<{ value: unknown }> = await db.from('restaurant_settings').select('value').eq('restaurant_id', restaurantId).eq('key', key).single();
    return data?.value ?? null;
  } catch { return null; }
}

export async function getSettings(restaurantId: string, keys: string[]): Promise<Record<string, unknown>> {
  // 1. Convex primary
  try {
    const all = await fetchQuery(api.settings.getAllSettings, {});
    if (all && Object.keys(all).length > 0) {
      const filtered: Record<string, unknown> = {};
      for (const k of keys) {
        if (k in all) filtered[k] = all[k];
      }
      return filtered;
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    const { data }: QR<Array<{ key: string; value: unknown }>> = await db.from('restaurant_settings').select('key, value').eq('restaurant_id', restaurantId).in('key', keys);
    const result: Record<string, unknown> = {};
    (data ?? []).forEach(row => { result[row.key] = row.value; });
    return result;
  } catch { return {}; }
}

export async function updateSetting(
  restaurantId: string,
  key: string,
  value: unknown,
  sessionToken?: string
): Promise<{ error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // 1. Convex primary
  try {
    const res = await fetchMutation(api.settings.updateSetting, { key, value, sessionToken: token });
    if (res && res.error) return { error: res.error };
    return {};
  } catch (err) {
    console.warn('[settings.service] Convex updateSetting failed, trying Supabase:', err);
  }

  // 2. Supabase fallback
  try {
    const db = sb(await createClient());
    const { error }: QR<null> = await db.from('restaurant_settings').upsert({ restaurant_id: restaurantId, key, value }, { onConflict: 'restaurant_id,key' });
    if (error) throw error;
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getPublicSettings(restaurantId: string): Promise<Record<string, unknown>> {
  return getSettings(restaurantId, [
    'customer_cancellation_enabled', 
    'cancellation_window_minutes', 
    'tax_rate_percent', 
    'tip_presets_percent', 
    'advance_booking_amount_paise',
    'auto_confirm_orders',
    'rush_mode_buffer_mins',
    'table_hold_time_mins',
    'max_booking_party_size',
    'support_phone',
    'support_email',
    'restaurant_tagline'
  ]);
}
