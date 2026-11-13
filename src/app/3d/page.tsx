import { redirect } from 'next/navigation';
import { getAllDishes } from '@/lib/services/menu.service';

export default async function ThreeDIndexPage() {
  const allDishes = await getAllDishes();
  const defaultDish =
    allDishes.find((d) => d.slug === 'mushroom-truffle-pizza') ||
    allDishes.find((d) => d.has_3d_model) ||
    allDishes[0];

  if (defaultDish?.slug) {
    redirect(`/3d/${defaultDish.slug}`);
  }

  redirect('/menu');
}

