import { NextResponse } from 'next/server';
import { getCategories, getAllDishes } from '@/lib/services/menu.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const [categories, allDishes] = await Promise.all([
      getCategories(),
      getAllDishes(),
    ]);

    const dishes = category
      ? allDishes.filter(d => d.category_id === category || d.categories?.slug === category)
      : allDishes;

    return NextResponse.json({ categories, dishes }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
