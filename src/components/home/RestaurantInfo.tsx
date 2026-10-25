'use client';

import { MapPin, Clock, Phone, Star } from 'lucide-react';
import { restaurantInfo } from '@/data/mock-menu';

export function RestaurantInfo() {
  return (
    <section className="py-10 px-4">
      <div className="glass-card p-6 rounded-2xl max-w-md mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-heading text-2xl font-semibold gold-gradient mb-1">
              {restaurantInfo.name}
            </h2>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium text-text-primary">{restaurantInfo.rating}</span>
              <span className="text-muted-foreground">({restaurantInfo.reviewCount}+ reviews)</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary/80 leading-relaxed">
              {restaurantInfo.address}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-text-primary/80">
              <p className="font-medium text-text-primary mb-1">Opening Hours</p>
              <p>{restaurantInfo.openingHours}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <a 
              href={`tel:${restaurantInfo.phone}`}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 active:scale-95 transition-transform"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text-primary">Call</span>
            </a>
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(restaurantInfo.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 active:scale-95 transition-transform"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text-primary">Directions</span>
            </a>
          </div>

          <div className="mt-6 rounded-2xl overflow-hidden border border-border-subtle h-[300px] w-full bg-surface relative">
            <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0 }}
              title="Restaurant Location Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.6316,12.9616,77.6516,12.9816&layer=mapnik&marker=12.9716,77.6416"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
