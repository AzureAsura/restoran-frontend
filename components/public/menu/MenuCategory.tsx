'use client'

import type { MenuCategory as MenuCategoryType } from '@/types/api'

export const ALL_CATEGORY_ID = 'all' as const;

interface MenuCategoryProps {
  categories: MenuCategoryType[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
}

const MenuCategory = ({ categories, activeCategoryId, onSelect }: MenuCategoryProps) => {
  const tabs = [{ id: ALL_CATEGORY_ID, name: 'All' }, ...categories];

  return (
    <div className="md:col-span-3 md:sticky md:top-[8vw] flex flex-row md:flex-col gap-[4vw] md:gap-[2.5vw] overflow-x-auto md:overflow-visible no-scrollbar pb-[4vw] md:pb-0 border-b border-black/5 md:border-b-0">
      {tabs.map((tab) => {
        const isActive = activeCategoryId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="flex flex-col items-start gap-[1vw] md:gap-[0.5vw] shrink-0 group"
          >
            <span className={`text-[5vw] md:text-[1.8vw] font-bold uppercase tracking-tight transition-colors duration-300 ${isActive ? 'text-black' : 'text-black/30 hover:text-black/60'}`}>
              {tab.name}
            </span>
            <div className={`h-[2px] bg-[#6E3A2F] transition-all duration-500 ${isActive ? 'w-[4vw] md:w-[2.5vw]' : 'w-0 group-hover:w-[1.5vw]'}`} />
          </button>
        );
      })}
    </div>
  )
}

export default MenuCategory
