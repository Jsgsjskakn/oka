'use server';

import { checkTableAvailability } from '@/lib/services/booking.service';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export async function checkAvailabilityAction(
  date: string,
  startTime: string,
  endTime: string,
  guests: number
): Promise<{
  available: boolean;
  tableCount: number;
  availableTables?: Array<{ tableNumber: number; capacity: number }>;
  error?: string;
}> {
  try {
    const result = await checkTableAvailability(RESTAURANT_ID, date, startTime, endTime, guests);
    return {
      available: result.available,
      tableCount: result.tables.length,
      availableTables: result.tables.map((t) => ({
        tableNumber: t.table_number,
        capacity: t.capacity,
      })),
      error: result.error,
    };
  } catch (err: unknown) {
    return {
      available: false,
      tableCount: 0,
      availableTables: [],
      error: err instanceof Error ? err.message : 'Failed to check availability',
    };
  }
}
