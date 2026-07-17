'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Layers,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  Upload,
  Slash,
} from 'lucide-react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/hooks/use-session';
import { formatUsd } from '@/lib/utils';
import {
  adminMenuQueryOptions,
  menuCategoriesQueryOptions,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
  type MenuItemFormInput,
  type UpdateCategoryInput,
} from '@/lib/queries/menu';
import type { MenuCategory, MenuItem, MenuItemStatus } from '@/types/api';

const EMPTY_MENU_FORM = {
  name: '',
  category_id: '',
  price: '',
  description: '',
  tags: '',
  status: 'available' as MenuItemStatus,
};

const EMPTY_CATEGORY_FORM = { name: '', is_active: true };

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function categoryLabel(category: MenuCategory) {
  return category.is_active ? category.name : `${category.name} (INACTIVE)`;
}

function readImageFile(file: File, onLoad: (dataUrl: string) => void): boolean {
  if (!file.type.startsWith('image/')) {
    toast.error('File must be an image.');
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size must not exceed 5MB.');
    return false;
  }
  const reader = new FileReader();
  reader.onloadend = () => onLoad(reader.result as string);
  reader.readAsDataURL(file);
  return true;
}

export default function MenuCrudBoard() {
  const { data: menuItems } = useSuspenseQuery(adminMenuQueryOptions());
  const { data: categories } = useSuspenseQuery(menuCategoriesQueryOptions());
  const { data: session } = useSession();
  const isOwner = session?.user.role === 'owner';
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'ALL' || item.category_id === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [menuItems, searchQuery, selectedCategoryFilter]);

  const categoryItemCount = (categoryId: string) =>
    menuItems.filter((item) => item.category_id === categoryId).length;

  // ── MUTATIONS ──
  const createItemMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item added.');
      closeMenuModal();
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to add menu item.')),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MenuItemFormInput }) => updateMenuItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item updated.');
      closeMenuModal();
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to update menu item.')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item deleted.');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to delete menu item.')),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Category added.');
      closeCategoryModal();
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to add category.')),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) => updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Category updated.');
      closeCategoryModal();
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to update category.')),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Category deleted.');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to delete category.')),
  });

  // ── MENU ITEM HANDLERS ──
  const handleToggleStatus = (item: MenuItem) => {
    if (!isOwner) return;
    const nextStatus: MenuItemStatus = item.status === 'available' ? 'out_of_stock' : 'available';
    updateItemMutation.mutate({
      id: item.id,
      input: {
        category_id: item.category_id,
        name: item.name,
        price: item.price,
        description: item.description ?? undefined,
        tags: item.tags.join(', '),
        status: nextStatus,
      },
    });
  };

  const handleDeleteItem = (item: MenuItem) => {
    if (!isOwner) return;
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    deleteItemMutation.mutate(item.id);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!readImageFile(file, setImagePreview)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setImageFile(file);
  };

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!readImageFile(file, setCategoryImagePreview)) {
      if (categoryFileInputRef.current) categoryFileInputRef.current.value = '';
      return;
    }
    setCategoryImageFile(file);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();

    const priceInCents = Math.round(parseFloat(menuForm.price) * 100);
    if (Number.isNaN(priceInCents) || priceInCents < 0) {
      toast.error('Enter a valid price.');
      return;
    }

    const input: MenuItemFormInput = {
      category_id: menuForm.category_id,
      name: menuForm.name,
      price: priceInCents,
      description: menuForm.description.trim() || undefined,
      tags: menuForm.tags,
      status: menuForm.status,
      image: imageFile,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, input });
    } else {
      createItemMutation.mutate(input);
    }
  };

  const openAddMenuModal = () => {
    setEditingItem(null);
    const defaultCategory = categories.find((c) => c.is_active)?.id ?? categories[0]?.id ?? '';
    setMenuForm({ ...EMPTY_MENU_FORM, category_id: defaultCategory });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      category_id: item.category_id,
      price: (item.price / 100).toFixed(2),
      description: item.description ?? '',
      tags: item.tags.join(', '),
      status: item.status,
    });
    setImageFile(null);
    setImagePreview(item.image_url);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setIsMenuModalOpen(false);
    setEditingItem(null);
  };

  // ── CATEGORY HANDLERS ──
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        input: { name: categoryForm.name, is_active: categoryForm.is_active, image: categoryImageFile },
      });
    } else {
      // POST /admin/menu-categories cuma terima `name` (+ sort_order yang kita
      // skip) — kategori baru selalu dibuat aktif oleh backend, gak ada field
      // is_active buat di-set saat create.
      createCategoryMutation.mutate({ name: categoryForm.name, image: categoryImageFile });
    }
  };

  const handleDeleteCategory = (category: MenuCategory) => {
    if (!isOwner) return;
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    deleteCategoryMutation.mutate(category.id);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    if (categoryFileInputRef.current) categoryFileInputRef.current.value = '';
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, is_active: category.is_active });
    setCategoryImageFile(null);
    setCategoryImagePreview(category.image_url);
    if (categoryFileInputRef.current) categoryFileInputRef.current.value = '';
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="w-full flex flex-col gap-[5vw] md:gap-[2.5vw] bg-[#F9F9F9] text-black font-sans select-none pb-[6vw] md:pb-[2vw]">

      <div className="w-full flex flex-col gap-[3vw] md:gap-[1.2vw]">

        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/5 pb-[2vw] md:pb-[1vw]">
          <div className="flex flex-col">
            <span className="text-[2.4vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-widest">Products</span>
            <h1 className="text-[5.5vw] md:text-[1.5vw] font-black uppercase tracking-tight text-black leading-none mt-1">
              Menu Catalogue
            </h1>
          </div>

          {isOwner && (
            <Dialog open={isMenuModalOpen} onOpenChange={(open) => (open ? openAddMenuModal() : closeMenuModal())}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="bg-black text-white text-[3.2vw] md:text-[0.8vw] font-bold uppercase tracking-widest px-[4vw] py-[2.5vw] md:px-[1.2vw] md:py-[0.6vw] flex items-center gap-[1.5vw] md:gap-[0.4vw] hover:bg-black/80 transition-colors rounded-none cursor-pointer"
                  />
                }
              >
                <Plus className="w-[3.5vw] md:w-[1vw] h-[3.5vw] md:h-[1vw]" /> Add Menu
              </DialogTrigger>

              <DialogContent className="rounded-none border-black/10 w-[95%] sm:w-full sm:max-w-[600px] p-0 bg-white gap-0 overflow-hidden flex flex-col max-h-[90vh]">

                <DialogHeader className="border-b border-black/5 p-5 md:p-6 shrink-0">
                  <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-black leading-none">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSaveMenu} className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-5">

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/[0.01] border border-black/5 p-4 shrink-0">
                    <div className="w-20 h-16 bg-black/5 flex items-center justify-center overflow-hidden shrink-0 border border-black/5">
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 text-black/20" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider leading-none">Thumbnail Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="text-xs font-medium text-black/60 file:mr-2 file:py-1 file:px-2 file:border file:border-black/10 file:bg-white file:text-[10px] file:font-bold file:uppercase file:cursor-pointer hover:file:bg-black/5 mt-1 w-full"
                      />
                      <span className="text-[10px] font-bold text-black/30 leading-none">MAX SIZE: 5MB</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Menu Name</label>
                      <input
                        type="text"
                        required
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        className="border border-black/10 px-3 py-2.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:outline-none rounded-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Category</label>
                      <Select
                        value={menuForm.category_id}
                        onValueChange={(val) => setMenuForm({ ...menuForm, category_id: val ?? '' })}
                      >
                        <SelectTrigger className="border border-black/10 px-3 py-5.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:ring-0 focus:ring-offset-0 rounded-none w-full h-auto text-left flex justify-between items-center">
                          <SelectValue placeholder="SELECT CATEGORY" >
                            {(value) => {
                              const cat = categories.find((c) => c.id === value);
                              return cat ? categoryLabel(cat) : 'SELECT CATEGORY';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="border border-black/10 rounded-none bg-white p-0 shadow-xl z-50">
                          {categories.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="text-sm font-bold uppercase tracking-wider py-2.5 px-3 focus:bg-black/[0.04] focus:text-black rounded-none cursor-pointer transition-colors outline-none"
                            >
                              {categoryLabel(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Price (USD)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                        className="border border-black/10 px-3 py-2.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:outline-none rounded-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="E.G. POPULAR, BEST SELLER"
                        value={menuForm.tags}
                        onChange={(e) => setMenuForm({ ...menuForm, tags: e.target.value })}
                        className="border border-black/10 px-3 py-2.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:outline-none rounded-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Description</label>
                      <textarea
                        rows={3}
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                        className="border border-black/10 px-3 py-2.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:outline-none rounded-none w-full resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Status Availability</label>
                      <Select
                        value={menuForm.status}
                        onValueChange={(val) => setMenuForm({ ...menuForm, status: (val ?? 'available') as MenuItemStatus })}
                      >
                        <SelectTrigger className="border border-black/10 px-3 py-5.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:ring-0 focus:ring-offset-0 rounded-none w-full h-auto text-left flex justify-between items-center">
                          <SelectValue placeholder="SELECT STATUS" />
                        </SelectTrigger>
                        <SelectContent className="border border-black/10 rounded-none bg-white p-0 shadow-xl z-50">
                          <SelectItem value="available" className="text-sm font-bold uppercase tracking-wider py-2.5 px-3 focus:bg-black/[0.04] focus:text-black rounded-none cursor-pointer transition-colors">
                            AVAILABLE
                          </SelectItem>
                          <SelectItem value="out_of_stock" className="text-sm font-bold uppercase tracking-wider py-2.5 px-3 focus:bg-black/[0.04] focus:text-black rounded-none cursor-pointer transition-colors">
                            OUT OF STOCK
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Footer Action Button (Ikut di dalam scroll container agar tidak menumpuk kaku) */}
                  <button
                    type="submit"
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    className="w-full bg-black text-white text-sm font-black uppercase tracking-widest py-3.5 hover:bg-black/90 transition-colors rounded-none mt-3 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {createItemMutation.isPending || updateItemMutation.isPending ? 'Saving...' : 'Save Item Changes'}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters & Search Toolbar */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-[2vw] md:gap-[0.6vw] items-center">
          <div className="md:col-span-8 relative flex items-center w-full">
            <Search className="w-[4vw] md:w-[1vw] h-[4vw] md:h-[1vw] text-black/30 absolute left-[3vw] md:left-[1vw]" />
            <input
              type="text"
              placeholder="SEARCH BY MENU NAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/10 focus:border-black pl-[10vw] pr-[4vw] md:pl-[2.8vw] md:pr-[1vw] py-[2.5vw] md:py-[0.6vw] text-[3.2vw] md:text-[0.8vw] font-bold uppercase tracking-wider placeholder:text-black/30 focus:outline-none transition-all rounded-none"
            />
          </div>

          <div className="md:col-span-4 w-full bg-white border border-black/10 relative rounded-none">
            <Select
              value={selectedCategoryFilter}
              onValueChange={(val) => setSelectedCategoryFilter(val ?? 'ALL')}
            >
              <SelectTrigger className="w-full bg-transparent px-3 py-4.5 font-bold uppercase tracking-wider focus:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none rounded-none text-sm md:text-base border-none h-auto text-left flex justify-between items-center">
                <SelectValue placeholder="ALL CATEGORIES" />
              </SelectTrigger>

              <SelectContent className="border border-black/10 rounded-none bg-white p-0 shadow-xl z-50">
                <SelectItem
                  value="ALL"
                  className="text-sm font-bold uppercase tracking-wider py-2.5 px-3 focus:bg-black/[0.04] focus:text-black rounded-none cursor-pointer transition-colors outline-none"
                >
                  ALL CATEGORIES
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="text-sm font-bold uppercase tracking-wider py-2.5 px-3 focus:bg-black/[0.04] focus:text-black rounded-none cursor-pointer transition-colors outline-none"
                  >
                    {categoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="w-full bg-white border border-black/5 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.01]">
                {['Thumb', 'Menu Name', 'Category', 'Price', 'Tags', 'Status Badge', 'Actions'].map((h) => (
                  <th key={h} className="px-[1.5vw] py-[1vw] text-[2.5vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-[1.5vw] py-[4vw] text-center text-[2.8vw] md:text-[0.8vw] font-bold text-black/30 uppercase tracking-wider">
                    No items found.
                  </td>
                </tr>
              )}
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-black/5 hover:bg-black/[0.005] transition-colors">
                  <td className="px-[1.5vw] py-[0.8vw]">
                    <div className="w-[8vw] h-[6vw] md:w-[3.5vw] md:h-[2.6vw] bg-black/5 border border-black/5 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Slash className="w-4 h-4 text-black/20" />
                      )}
                    </div>
                  </td>
                  <td className="px-[1.5vw] py-[0.8vw] text-[3vw] md:text-[0.85vw] font-bold text-black uppercase tracking-tight">{item.name}</td>
                  <td className="px-[1.5vw] py-[0.8vw] text-[2.8vw] md:text-[0.78vw] font-medium text-black/50 uppercase">{item.category?.name ?? '—'}</td>
                  <td className="px-[1.5vw] py-[0.8vw] text-[3vw] md:text-[0.85vw] font-black text-[#6E3A2F]">{formatUsd(item.price)}</td>
                  <td className="px-[1.5vw] py-[0.8vw]">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {item.tags.map((t, idx) => (
                        <span key={idx} className="bg-black/5 px-1 py-0.5 text-[8px] font-bold text-black/60 tracking-wide uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-[1.5vw] py-[0.8vw]">
                    <button
                      disabled={!isOwner || updateItemMutation.isPending}
                      onClick={() => handleToggleStatus(item)}
                      className={`px-[1.5vw] py-[0.4vw] md:px-[0.6vw] md:py-[0.2vw] text-[2.2vw] md:text-[0.65vw] font-black uppercase tracking-wider border rounded-none transition-all ${item.status === 'available'
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : 'border-red-200 bg-red-50 text-red-500'
                        } ${isOwner ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                    >
                      {item.status === 'available' ? 'Available' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="px-[1.5vw] py-[0.8vw]">
                    {isOwner ? (
                      <div className="flex items-center gap-[1vw] md:gap-[0.4vw]">
                        <button onClick={() => openEditMenuModal(item)} className="p-1 border border-black/5 hover:border-black/30 bg-white text-black transition-all cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(item)} className="p-1 border border-red-100 hover:border-red-300 bg-white text-red-600 transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/20 uppercase tracking-widest flex items-center gap-1">
                        <Eye className="w-3 h-3" /> READ ONLY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 2: CATEGORY MANAGEMENT SECTION ── */}
      <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[3vw] md:gap-[1vw] rounded-none">

        <div className="w-full flex justify-between items-end border-b border-black/5 pb-[2vw] md:pb-[0.8vw]">
          <div className="flex flex-col">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <Layers className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Architecture
            </span>
            <h3 className="text-[3.8vw] md:text-[1.05vw] font-black uppercase tracking-tight text-black mt-[0.1vw]">
              Manage Menu Categories
            </h3>
          </div>

          {isOwner && (
            <Dialog open={isCategoryModalOpen} onOpenChange={(open) => (open ? openAddCategoryModal() : closeCategoryModal())}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="border border-black text-black text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase px-[3vw] py-[1.5vw] md:px-[1vw] md:py-[0.4vw] hover:bg-black hover:text-white transition-all rounded-none cursor-pointer"
                  />
                }
              >
                + Add Category
              </DialogTrigger>

              <DialogContent className="rounded-none border-black/10 max-w-[500px] p-6 md:p-8 bg-white gap-6">
                <form onSubmit={handleSaveCategory} className="flex flex-col gap-5">
                  <DialogHeader className="border-b border-black/5 pb-4">
                    <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-black leading-none">
                      {editingCategory ? 'Edit Category' : 'Create Category'}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/[0.01] border border-black/5 p-4 shrink-0">
                    <div className="w-20 h-16 bg-black/5 flex items-center justify-center overflow-hidden shrink-0 border border-black/5">
                      {categoryImagePreview ? (
                        <img src={categoryImagePreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 text-black/20" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs font-bold text-black/40 uppercase tracking-wider leading-none">Thumbnail Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        ref={categoryFileInputRef}
                        onChange={handleCategoryImageChange}
                        className="text-xs font-medium text-black/60 file:mr-2 file:py-1 file:px-2 file:border file:border-black/10 file:bg-white file:text-[10px] file:font-bold file:uppercase file:cursor-pointer hover:file:bg-black/5 mt-1 w-full"
                      />
                      <span className="text-[10px] font-bold text-black/30 leading-none">MAX SIZE: 5MB</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-black/50 uppercase tracking-wide leading-none">Category Name</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="border border-black/10 px-3 py-2.5 text-sm md:text-base font-bold uppercase tracking-wider bg-black/[0.01] focus:bg-white focus:border-black focus:outline-none rounded-none w-full"
                    />
                  </div>

                  {/* POST /admin/menu-categories gak punya field is_active — kategori
                      baru selalu aktif. Toggle cuma relevan pas edit kategori yang
                      udah ada. */}
                  {editingCategory && (
                    <>
                      <div className="flex items-center gap-2.5 py-1">
                        <input
                          type="checkbox"
                          id="cat-status"
                          checked={categoryForm.is_active}
                          onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                          className="w-4 h-4 accent-black cursor-pointer rounded-none"
                        />
                        <label htmlFor="cat-status" className="text-sm font-bold uppercase tracking-wide cursor-pointer select-none text-black">
                          Active
                        </label>
                      </div>

                      {!categoryForm.is_active && (
                        <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 rounded-none">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-tight leading-normal">
                            Warning: deactivating this category will hide {categoryItemCount(editingCategory.id)} menu item
                            {categoryItemCount(editingCategory.id) !== 1 ? 's' : ''} from the public menu. Items remain visible here in admin.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="w-full bg-black text-white text-sm font-black uppercase tracking-widest py-3.5 hover:bg-black/90 transition-colors rounded-none mt-2 cursor-pointer disabled:opacity-50"
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {categories.length === 0 ? (
          <p className="text-center text-black/30 uppercase tracking-wide font-medium py-[4vw] text-[2.8vw] md:text-[0.8vw]">
            No categories found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[2vw] md:gap-[0.6vw]">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-black/5 bg-[#FBFBFB] p-[3vw] md:p-[1vw] flex flex-col justify-between h-[28vw] md:h-[7.5vw] rounded-none">
                <div className="flex justify-between items-start w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-[8vw] h-[6vw] md:w-[2.4vw] md:h-[1.8vw] bg-black/5 border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Slash className="w-3.5 h-3.5 text-black/20" />
                      )}
                    </div>
                    <span className="text-[3.4vw] md:text-[0.9vw] font-bold text-black uppercase tracking-tight truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className={`px-1 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-none shrink-0 ${cat.is_active ? 'border-green-100 bg-green-50 text-green-600' : 'border-black/10 bg-black/5 text-black/40'
                    }`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex justify-end items-center gap-[1.5vw] md:gap-[0.4vw] border-t border-black/5 pt-[1.5vw] md:pt-[0.5vw]">
                  {isOwner ? (
                    <>
                      <button onClick={() => openEditCategoryModal(cat)} className="text-[2.4vw] md:text-[0.65vw] font-bold uppercase tracking-wider text-black/40 hover:text-black underline cursor-pointer">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)} className="text-[2.4vw] md:text-[0.65vw] font-bold uppercase tracking-wider text-red-500/60 hover:text-red-600 underline cursor-pointer">
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-[2vw] md:text-[0.6vw] font-bold text-black/20 uppercase tracking-widest">Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
