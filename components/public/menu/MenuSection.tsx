'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import MenuCategory, { ALL_CATEGORY_ID } from './MenuCategory';
import { menuQueryOptions } from '@/lib/queries/menu';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatUsd } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { MenuItem } from '@/types/api';

interface MenuSectionProps {
  initialCategory?: string;
}

export const MenuSection = ({ initialCategory }: MenuSectionProps) => {
  const { data } = useSuspenseQuery(menuQueryOptions());
  const router = useRouter();

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    if (!initialCategory) return ALL_CATEGORY_ID;
    const match = data.find(
      (group) => group.category.name.toLowerCase() === initialCategory.toLowerCase()
    );
    return match?.category.id ?? ALL_CATEGORY_ID;
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const categories = useMemo(() => data.map((group) => group.category), [data]);

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);

    if (categoryId === ALL_CATEGORY_ID) {
      router.replace('/menu', { scroll: false });
      return;
    }

    const categoryName = data.find((group) => group.category.id === categoryId)?.category.name;
    router.replace(`/menu?category=${encodeURIComponent(categoryName ?? '')}`, { scroll: false });
  };

  const visibleItems = useMemo(() => {
    const source =
      activeCategoryId === ALL_CATEGORY_ID
        ? data.flatMap((group) => group.items)
        : data.find((group) => group.category.id === activeCategoryId)?.items ?? [];

    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return source;
    return source.filter((item) => item.name.toLowerCase().includes(query));
  }, [data, activeCategoryId, debouncedSearch]);

  return (
    <main className="w-full bg-canvas flex flex-col section-pad pt-[20vw] md:pt-[10vw] pb-[8vw]">

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[4vw] md:gap-[2vw] items-end pb-[6vw] md:pb-[4vw] border-b border-black/5">
        <div className="md:col-span-3">
          <h1 className="text-[10vw] md:text-[4vw] font-bold tracking-tight text-black uppercase leading-[0.9]">
            Recipes
          </h1>
        </div>

        <div className="md:col-span-9 w-full flex justify-end">
          <div className="relative w-full md:w-[28vw] flex items-center border-b border-black/30 pb-[0.8vw] group focus-within:border-black transition-colors duration-300">
            <Search className="w-[4vw] h-[4vw] md:w-[1.1vw] md:h-[1.1vw] text-black/40 absolute left-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Recipe & More...."
              className="w-full bg-transparent pl-[6vw] md:pl-[2vw] text-[3.8vw] md:text-[1vw] font-medium text-black placeholder:text-black/30 focus:outline-none uppercase tracking-wide"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[6vw] md:gap-[2vw] pt-[6vw] md:pt-[4vw] items-start w-full">

        <MenuCategory
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={handleSelectCategory}
        />

        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[4vw] md:gap-[2vw]">
          {visibleItems.length === 0 ? (
            <p className="col-span-full text-center text-black/30 uppercase tracking-wide font-medium py-[6vw]">
              No dishes found.
            </p>
          ) : (
            visibleItems.map((item) => (
              <div key={item.id} className="w-full flex flex-col gap-[1.5vw]">

                <div
                  onClick={() => setSelectedItem(item)}
                  className="w-full aspect-[4/4] bg-black/5 overflow-hidden rounded-none border border-black/5 group cursor-pointer relative"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex justify-between items-start gap-[1vw]">
                    <h3
                      onClick={() => setSelectedItem(item)}
                      className="text-[4.2vw] md:text-[1.15vw] font-bold uppercase text-black tracking-tight leading-[1.2] max-w-[80%] truncate cursor-pointer hover:text-[#6E3A2F] transition-colors"
                    >
                      {item.name}
                    </h3>
                    <span className="text-[3.8vw] md:text-[1.05vw] font-semibold text-[#6E3A2F] shrink-0">
                      {formatUsd(item.price)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[3.2vw] md:text-[0.85vw] text-black/50 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[520px] p-0 bg-white gap-0 overflow-hidden">
          <div className="w-full aspect-[4/3] bg-black/5 overflow-hidden border-b border-black/5">
            {selectedItem?.image_url ? (
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black/10" />
            )}
          </div>

          <div className="flex flex-col gap-[3vw] md:gap-[1vw] p-[6vw] md:p-[2vw]">
            <DialogHeader className="flex flex-row justify-between items-start gap-[2vw]">
              <DialogTitle className="text-[5vw] md:text-[1.4vw] font-bold uppercase text-black tracking-tight leading-[1.15]">
                {selectedItem?.name}
              </DialogTitle>
              <span className="text-[4vw] md:text-[1.15vw] font-semibold text-[#6E3A2F] shrink-0 mt-[0.3vw]">
                {formatUsd(selectedItem?.price ?? 0)}
              </span>
            </DialogHeader>

            {selectedItem?.description && (
              <p className="text-[3.5vw] md:text-[0.9vw] text-black/60 leading-relaxed">
                {selectedItem.description}
              </p>
            )}

            {selectedItem && selectedItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-black/5 px-2 py-1 text-[2.6vw] md:text-[0.7vw] font-bold text-black/60 tracking-wide uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default MenuSection;