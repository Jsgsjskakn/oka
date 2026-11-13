import type { MetadataRoute } from 'next';
import { getAllDishes, getCategories } from '@/lib/services/menu.service';
import { categories as mockCategories, dishes as mockDishes } from '@/data/mock-menu';

export const dynamic = 'force-dynamic';

function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Fallback to canonical domain if NEXT_PUBLIC_APP_URL is malformed
    }
  }
  return 'https://thegoldenoak.in';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const now = new Date();

  const [fetchedCategories, fetchedDishes] = await Promise.all([
    getCategories().catch(() => mockCategories),
    getAllDishes().catch(() => mockDishes),
  ]);

  const categories = fetchedCategories.length > 0 ? fetchedCategories : mockCategories;
  const dishes = fetchedDishes.length > 0 ? fetchedDishes : mockDishes;

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/menu`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/booking`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/ar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cart`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const seenUrls = new Set(entries.map((entry) => entry.url));
  const pushUnique = (entry: MetadataRoute.Sitemap[number]) => {
    if (!seenUrls.has(entry.url)) {
      seenUrls.add(entry.url);
      entries.push(entry);
    }
  };

  for (const category of categories) {
    const isActive = 'is_active' in category ? category.is_active : true;
    if (isActive === false || !category.slug) continue;
    pushUnique({
      url: `${baseUrl}/menu/${encodeURIComponent(category.slug)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    });
  }

  for (const dish of dishes) {
    const isAvailable = 'is_available' in dish ? dish.is_available : ('available' in dish ? (dish as { available?: boolean }).available : true);
    if (isAvailable === false || !dish.slug) continue;
    const encodedSlug = encodeURIComponent(dish.slug);
    pushUnique({
      url: `${baseUrl}/3d/${encodedSlug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
    pushUnique({
      url: `${baseUrl}/ar/${encodedSlug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}
