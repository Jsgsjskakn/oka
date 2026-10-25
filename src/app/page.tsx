import { Metadata } from 'next';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickActions } from '@/components/home/QuickActions';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection';
import { ARPromoSection } from '@/components/home/ARPromoSection';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { StorySection } from '@/components/home/StorySection';
import { BookingCTASection } from '@/components/home/BookingCTASection';
import { RestaurantInfo } from '@/components/home/RestaurantInfo';
import { getCategories, getAllDishes, getFeaturedDishes } from '@/lib/services/menu.service';

export const metadata: Metadata = {
  title: 'The Golden Oak | Gourmet Indian Fusion & Artisanal Dining',
  description:
    'Experience luxury dining with The Golden Oak. Hand-stretched sourdough pizzas, charcoal tandoori fusion, and interactive 3D culinary previews in Indiranagar, Bengaluru.',
};

export default async function Home() {
  const [categories, featuredDishes, allDishes] = await Promise.all([
    getCategories(),
    getFeaturedDishes(),
    getAllDishes(),
  ]);
  const bestSellers = allDishes.filter((d) => d.is_best_seller);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <HeroSection />
      <QuickActions />
      <RecentlyViewedSection />
      <FeaturedSection dishes={featuredDishes} />
      <CategoriesSection categories={categories} />
      <BestSellersSection dishes={bestSellers} />
      <ARPromoSection />
      <StorySection />
      <BookingCTASection />
      <RestaurantInfo />
    </div>
  );
}
