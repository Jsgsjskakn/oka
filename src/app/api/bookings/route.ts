import { NextResponse } from 'next/server';
import { createBookingAction } from '@/lib/actions/booking-actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.customerPhone || !body.bookingDate || !body.bookingTime || !body.guests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createBookingAction(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ bookingId: result.bookingId, status: 'pending' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
