export const DISH_IMAGE_MAP: Record<string, string> = {
  'tandoori-paneer-pizza': '/images/dishes/tandoori-paneer-pizza.webp',
  'chicken-tikka-pizza': '/images/dishes/chicken-tikka-pizza.webp',
  'mushroom-truffle-pizza': '/images/dishes/mushroom-truffle-pizza.webp',
  'keema-masala-pizza': '/images/dishes/bbq-chicken-overload.webp',
  'farmhouse-supreme-pizza': '/images/dishes/peri-peri-fiesta-pizza.webp',
  'bbq-chicken-overload': '/images/dishes/bbq-chicken-overload.webp',
  'peri-peri-fiesta-pizza': '/images/dishes/peri-peri-fiesta-pizza.webp',
  'golden-oak-signature-burger': '/images/dishes/golden-oak-signature-burger.webp',
  'classic-smash-burger': '/images/dishes/classic-smash-burger.webp',
  'paneer-royale-burger': '/images/dishes/crispy-paneer-burger.webp',
  'crispy-paneer-burger': '/images/dishes/crispy-paneer-burger.webp',
  'truffle-mushroom-cheese-burger': '/images/dishes/classic-smash-burger.webp',
  'hakka-street-chow-mein': '/images/dishes/wok-tossed-chow-mein.webp',
  'wok-tossed-chow-mein': '/images/dishes/wok-tossed-chow-mein.webp',
  'golden-chilli-potato': '/images/dishes/dynamite-chilli-potatoes.webp',
  'dynamite-chilli-potatoes': '/images/dishes/dynamite-chilli-potatoes.webp',
};

export function resolveDishImageUrl(slug: string, currentUrl?: string | null): string {
  if (currentUrl && currentUrl !== '/images/dishes/placeholder.jpg' && !currentUrl.includes('placeholder')) {
    return currentUrl;
  }
  return DISH_IMAGE_MAP[slug] || '/images/dishes/tandoori-paneer-pizza.webp';
}
