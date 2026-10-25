import { Metadata } from 'next';
import { getAllDishes } from '@/lib/services/menu.service';

export const metadata: Metadata = {
  title: 'AR Experience | The Golden Oak',
};
import Link from 'next/link';
import Image from 'next/image';

export default async function ARPage() {
  const dishes = await getAllDishes();
  // All dishes now support 3D and AR via centralized model configuration
  const arDishes = dishes;

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-4 py-12 max-w-7xl mx-auto">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-champagne to-[#e8c547] flex items-center justify-center text-black mb-6 shadow-[0_0_40px_rgba(201,168,76,0.4)] animate-float">
        <span className="text-4xl">✨</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-text-primary mb-2 text-center">AR Experience</h1>
      <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-4">
        Explore our signature dishes in stunning 3D. Tap on any dish below to view it from all angles and place it in your space using Augmented Reality.
      </p>

      <div className="flex items-center gap-2 mb-8 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-300">
        <span>ℹ️</span>
        <span>Interactive 3D & AR Demonstration [Prototype Model Pipeline Active]</span>
      </div>

      {arDishes.length === 0 ? (
        <p className="text-text-secondary/70">No AR dishes available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {arDishes.map((dish) => (
            <div key={dish.id} className="glass-card rounded-2xl overflow-hidden border border-border-subtle transition-all hover:border-champagne/50 group">
              <div className="relative aspect-[4/3] bg-surface overflow-hidden">
                {dish.image_url ? (
                  <Image 
                    src={dish.image_url} 
                    alt={dish.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="font-heading font-semibold text-lg text-text-primary">{dish.name}</span>
                </div>
              </div>
              <div className="flex bg-obsidian/50 p-3 gap-3">
                <Link href={`/3d/${dish.slug}`} className="flex-1 bg-white/10 hover:bg-white/20 text-text-primary text-center py-2 rounded-lg text-sm font-semibold transition-colors">
                  View in 3D
                </Link>
                <Link href={`/ar/${dish.slug}`} className="flex-1 bg-champagne hover:bg-[#d6b759] text-black text-center py-2 rounded-lg text-sm font-semibold transition-colors">
                  View in AR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
