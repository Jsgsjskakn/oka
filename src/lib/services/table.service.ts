import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';
import { type RestaurantTable, type TableStatus } from '@/lib/db/types';
import { RESTAURANT_ID } from '@/lib/config';
import { getSessionToken } from '@/lib/auth/admin-auth';

export async function getTables(): Promise<RestaurantTable[]> {
  // 1. Primary: Convex Query
  try {
    const tables = await fetchQuery(api.tables.getAllTables, {});
    if (tables && tables.length > 0) {
      return tables.map((t: any) => ({
        id: t._id,
        restaurant_id: RESTAURANT_ID,
        table_number: t.tableNumber,
        capacity: t.capacity,
        status: t.status as TableStatus,
        notes: t.notes || null,
        created_at: new Date(t.createdAt).toISOString(),
        updated_at: new Date(t.createdAt).toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[table.service] Convex getAllTables failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('table_number');

    if (error || !data) return [];
    return data as RestaurantTable[];
  } catch {
    return [];
  }
}

export async function createTable(payload: {
  table_number: number;
  capacity: number;
  status: TableStatus;
  notes?: string;
}, sessionToken?: string): Promise<{ success?: boolean; error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const convexStatus = (payload.status === 'booked' ? 'reserved' : payload.status === 'unavailable' ? 'maintenance' : 'available') as "available" | "occupied" | "reserved" | "maintenance";
    const res = await fetchMutation(api.tables.createTable, {
      tableNumber: payload.table_number,
      capacity: payload.capacity,
      status: convexStatus,
      notes: payload.notes,
      sessionToken: token,
    });

    if (res && res.error) return { error: res.error };
    if (res && res.success) return { success: true };
  } catch (err) {
    console.warn('[table.service] Convex createTable failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const sbStatus = payload.status === 'booked' ? 'reserved' : payload.status === 'unavailable' ? 'maintenance' : 'available';
    const { error } = await db.from('tables').insert({
      restaurant_id: RESTAURANT_ID,
      table_number: payload.table_number,
      capacity: payload.capacity,
      status: sbStatus,
      notes: payload.notes || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to create table' };
  }
}

export async function updateTableStatus(
  tableId: string,
  status: TableStatus,
  sessionToken?: string
): Promise<{ success?: boolean; error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const convexStatus = (status === 'booked' ? 'reserved' : status === 'unavailable' ? 'maintenance' : 'available') as "available" | "occupied" | "reserved" | "maintenance";
    const res = await fetchMutation(api.tables.updateTableStatus, {
      tableId,
      status: convexStatus,
      sessionToken: token,
    });
    if (res && res.success) return { success: true };
    if (res && res.error) return { error: res.error };
  } catch (err) {
    console.warn('[table.service] Convex updateTableStatus failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const sbStatus = status === 'booked' ? 'reserved' : status === 'unavailable' ? 'maintenance' : 'available';
    const { error } = await db.from('tables').update({ status: sbStatus }).eq('id', tableId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update table status' };
  }
}

export async function updateTableCapacity(
  tableId: string,
  capacity: number,
  sessionToken?: string
): Promise<{ success?: boolean; error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const res = await fetchMutation(api.tables.updateTableCapacity, {
      tableId,
      capacity,
      sessionToken: token,
    });
    if (res && res.success) return { success: true };
    if (res && res.error) return { error: res.error };
  } catch (err) {
    console.warn('[table.service] Convex updateTableCapacity failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { error } = await db.from('tables').update({ capacity }).eq('id', tableId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update table capacity' };
  }
}

export async function deleteTable(
  tableId: string,
  sessionToken?: string
): Promise<{ success?: boolean; error?: string }> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const res = await fetchMutation(api.tables.deleteTable, {
      tableId,
      sessionToken: token,
    });
    if (res && res.success) return { success: true };
    if (res && res.error) return { error: res.error };
  } catch (err) {
    console.warn('[table.service] Convex deleteTable failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { error } = await db.from('tables').delete().eq('id', tableId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to delete table' };
  }
}
