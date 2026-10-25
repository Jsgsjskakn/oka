import { NextResponse } from 'next/server';
import { placeOrderAction } from '@/lib/actions/order-actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.items || !body.customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await placeOrderAction(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ orderId: result.orderId });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
