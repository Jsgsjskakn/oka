import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/services/settings.service';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export async function GET() {
  const settings = await getPublicSettings(RESTAURANT_ID);
  return NextResponse.json(settings);
}
