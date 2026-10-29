import { Metadata } from 'next';
import { HeroSection } from '@/components/home/HeroSection';
import { CuratedSignaturesSection } from '@/components/home/CuratedSignaturesSection';
import { ARPromoSection } from '@/components/home/ARPromoSection';
import { StorySection } from '@/components/home/StorySection';
import { HomeReservationAndLocationSection } from '@/components/home/HomeReservationAndLocationSection';
import { getAllDishes } from '@/lib/services/menu.service';

export const metadata: Metadata = {
  title: 'The Golden Oak | Artisanal Dining & 3D Gastronomy',
  description:
    'Experience artisanal luxury dining with The Golden Oak. Hand-stretched sourdough pizzas, charcoal tandoori fusion, and interactive 3D culinary previews in Indiranagar, Bengaluru.',
};

export default async function Home() {
  const allDishes = await getAllDishes();

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. Asymmetric Split Editorial Hero with 3D Warrior Pedestal & Integrated Continue Exploring Dock */}
      <HeroSection />

      {/* 2. Chef's Curated Signatures: Merged 4-Card Luxury Grid with Architectural Tabs */}
      <CuratedSignaturesSection dishes={allDishes} />

      {/* 4. Spatial 3D Showcase Spotlight */}
      <ARPromoSection />

      {/* 5. Editorial Heritage Split Section (Ivory Contrast Flip) */}
      <StorySection />

      {/* 6. Side-by-Side Reservation & Our Location Flagship Map Cards (100% Reference Parity) */}
      <HomeReservationAndLocationSection />
    </div>
  );
}
