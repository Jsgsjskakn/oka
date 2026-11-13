import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/services/order.service';

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const order = await getOrderById(id);

    const requestDigits = normalizePhoneDigits(phone);
    const orderDigits = order?.customer_phone ? normalizePhoneDigits(order.customer_phone) : '';

    if (!order || !requestDigits || orderDigits !== requestDigits) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
