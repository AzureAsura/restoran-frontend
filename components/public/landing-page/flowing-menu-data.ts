import type { MenuCategoryGroup } from '@/types/api';

const FALLBACK_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop';

export function toFlowingMenuItems(groups: MenuCategoryGroup[]) {
  return groups.map(({ category, items }) => ({
    text: category.name,
    count: `(${String(items.length).padStart(2, '0')})`,
    image: category.image_url ?? FALLBACK_CATEGORY_IMAGE,
    link: `/menu?category=${encodeURIComponent(category.name)}`,
  }));
}
