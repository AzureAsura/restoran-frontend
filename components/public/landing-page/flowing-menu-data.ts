import type { MenuCategoryGroup } from '@/types/api';

// MenuCategory di backend tidak punya field foto (cuma id/name/sort_order/is_active),
// jadi placeholder ini di-hardcode per nama kategori, khusus untuk tampilan FlowingMenu.
const CATEGORY_IMAGE_BY_NAME: Record<string, string> = {
  Food: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=600&auto=format&fit=crop',
  Beverages: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=600&auto=format&fit=crop',
  Dessert: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop',
};

const FALLBACK_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop';

export function toFlowingMenuItems(groups: MenuCategoryGroup[]) {
  return groups.map(({ category, items }) => ({
    text: category.name,
    count: `(${String(items.length).padStart(2, '0')})`,
    image: CATEGORY_IMAGE_BY_NAME[category.name] ?? FALLBACK_CATEGORY_IMAGE,
    link: `/menu?category=${encodeURIComponent(category.name)}`,
  }));
}
