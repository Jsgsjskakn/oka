import { Metadata } from 'next';
import { HeroSection } from '@/components/home/HeroSection';

export const metadata: Metadata = {
  title: 'The Golden Oak | Gourmet Indian Fusion Dining',
  description: 'Experience gourmet Indian fusion dining at The Golden Oak.',
};
import { QuickActions } from '@/components/home/QuickActions';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { ARPromoSection } from '@/components/home/ARPromoSection';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { BookingCTASection } from '@/components/home/BookingCTASection';
import { RestaurantInfo } from '@/components/home/RestaurantInfo';
import { CompactFooter } from '@/components/layout/CompactFooter';
import { getCategories, getAllDishes, getFeaturedDishes } from '@/lib/services/menu.service';

export default async function Home() {
  const [categories, featuredDishes, allDishes] = await Promise.all([
    getCategories(),
    getFeaturedDishes(),
    getAllDishes(),
  ]);
  const bestSellers = allDishes.filter(d => d.is_best_seller);

  return (
    <div className="flex flex-col gap-4">
      <HeroSection />
      <QuickActions />
      <FeaturedSection dishes={featuredDishes} />
      <CategoriesSection categories={categories} />
      <ARPromoSection />
      <BestSellersSection dishes={bestSellers} />
      <BookingCTASection />
      <RestaurantInfo />
      <CompactFooter />
    </div>
  );
}
