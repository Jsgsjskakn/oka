'use server';

import { requireAdmin } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';
import { type TableStatus } from '@/lib/db/types';
import * as tableService from '@/lib/services/table.service';

export async function updateTableStatus(tableId: string, status: TableStatus) {
  try {
    await requireAdmin();
    const result = await tableService.updateTableStatus(tableId, status);
    if (result.error) throw new Error(result.error);

    revalidatePath('/admin/tables');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update table status' };
  }
}

export async function updateTableCapacity(tableId: string, capacity: number) {
  try {
    await requireAdmin();
    const result = await tableService.updateTableCapacity(tableId, capacity);
    if (result.error) throw new Error(result.error);

    revalidatePath('/admin/tables');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update table capacity' };
  }
}

export async function createTable(payload: {
  table_number: number;
  capacity: number;
  status: TableStatus;
  notes?: string;
}) {
  try {
    await requireAdmin();
    const result = await tableService.createTable(payload);
    if (result.error) throw new Error(result.error);

    revalidatePath('/admin/tables');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to create table' };
  }
}

export async function deleteTable(tableId: string) {
  try {
    await requireAdmin();
    const result = await tableService.deleteTable(tableId);
    if (result.error) throw new Error(result.error);

    revalidatePath('/admin/tables');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to delete table' };
  }
}
