'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Utensils,
  Layers,
  Trash2,
  ChefHat,
  Search,
  Grid,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Unlock,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-client';
import { closeTable, tablesQueryOptions } from '@/lib/queries/tables';
import { menuQueryOptions } from '@/lib/queries/menu';
import {
  activeOrdersQueryOptions,
  createOrder,
  orderBillQueryOptions,
  updateOrderPaymentStatus,
} from '@/lib/queries/orders';
import { formatUsd } from '@/lib/utils';
import type { MenuItem, PaymentStatus, Table } from '@/types/api';

const ALL_CATEGORY_ID = 'all';
const ESTIMATED_TAX_RATE = 0.10;
const ESTIMATED_SERVICE_CHARGE_RATE = 0.05;

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  notes: string;
}

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function tableStatusBadge(status: Table['status']) {
  switch (status) {
    case 'available':   return { label: 'Available',   dot: 'bg-green-500', text: 'text-black/70' };
    case 'reserved':     return { label: 'Reserved',     dot: 'bg-amber-500', text: 'text-amber-600' };
    case 'occupied':     return { label: 'Occupied',     dot: 'bg-red-500',   text: 'text-red-600' };
    case 'maintenance':  return { label: 'Maintenance',  dot: 'bg-gray-400',  text: 'text-black/30' };
  }
}

export const POSBoard = () => {
  const { data: tables } = useSuspenseQuery({ ...tablesQueryOptions(), refetchInterval: 12000 });
  const { data: menuGroups } = useSuspenseQuery(menuQueryOptions());
  const queryClient = useQueryClient();

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_CATEGORY_ID);
  const [searchMenu, setSearchMenu] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [mobileActivePanel, setMobileActivePanel] = useState<'TABLES' | 'MENU' | 'SUMMARY'>('MENU');
  const [checkoutTableId, setCheckoutTableId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => menuGroups.map((group) => group.category), [menuGroups]);

  const menuItems = useMemo(() => {
    const source =
      activeCategoryId === ALL_CATEGORY_ID
        ? menuGroups.flatMap((group) => group.items)
        : menuGroups.find((group) => group.category.id === activeCategoryId)?.items ?? [];

    const query = searchMenu.trim().toLowerCase();
    if (!query) return source;
    return source.filter((item) => item.name.toLowerCase().includes(query));
  }, [menuGroups, activeCategoryId, searchMenu]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const estimatedTax = Math.round(subtotal * ESTIMATED_TAX_RATE);
  const estimatedServiceCharge = Math.round(subtotal * ESTIMATED_SERVICE_CHARGE_RATE);
  const estimatedTotal = subtotal + estimatedTax + estimatedServiceCharge;

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order berhasil dikirim ke ${order.table.name}.`);
      setCart([]);
      setSelectedTable(null);
      setCustomerPhone('');
      setCustomerName('');
      setLastAddedId(null);
      setMobileActivePanel('MENU');
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal mengirim order, coba lagi.'));
    },
  });

  const activeOrdersQuery = useQuery({
    ...activeOrdersQueryOptions(checkoutTableId ?? ''),
    enabled: !!checkoutTableId,
  });

  const billQuery = useQuery({
    ...orderBillQueryOptions(expandedOrderId ?? ''),
    enabled: !!expandedOrderId,
  });

  // Multi-order checkout: 1 meja bisa punya beberapa Order aktif (tamu nambah
  // pesanan). Batch-pay cuma UI convenience (loop PATCH per order) — Kitchen
  // tetap track tiap order independen, gak ada merge di database.
  const unpaidOrderCount = activeOrdersQuery.data?.filter((order) => order.payment_status === 'unpaid').length ?? 0;
  const showBatchPayUI = unpaidOrderCount >= 2;
  const allOrdersPaid =
    // 0 order aktif juga valid buat di-close (mis. meja "nyangkut" occupied
    // tanpa order tersisa) — [].every(...) vacuously true, backend juga
    // ngizinin close tanpa order aktif sama sekali.
    !!activeOrdersQuery.data &&
    activeOrdersQuery.data.every((order) => order.payment_status === 'paid');
  const selectedOrdersTotal = (activeOrdersQuery.data ?? [])
    .filter((order) => selectedOrderIds.has(order.id))
    .reduce((sum, order) => sum + order.total, 0);

  const markPaidMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) => updateOrderPaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Status pembayaran diperbarui.');
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal memperbarui status pembayaran, coba lagi.'));
    },
  });

  const batchMarkPaidMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => updateOrderPaymentStatus(id, 'paid'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Semua order terpilih berhasil ditandai lunas.');
      setSelectedOrderIds(new Set());
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal memperbarui status pembayaran, coba lagi.'));
    },
  });

  const markTableAvailableMutation = useMutation({
    mutationFn: (tableId: string) => closeTable(tableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Meja ditandai tersedia kembali.');
      closeCheckout();
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal mengubah status meja, coba lagi.'));
    },
  });

  const handleSelectTable = (table: Table) => {
    if (table.status === 'maintenance') return;
    setSelectedTable(table);
    if (window.innerWidth < 768) setMobileActivePanel('MENU');
  };

  const handleAddToBag = (item: MenuItem) => {
    if (item.status === 'out_of_stock') return;
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1, notes: '' }];
    });
    setLastAddedId(item.id);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId === id) {
        const nextQty = item.qty + delta;
        return nextQty > 0 ? { ...item, qty: nextQty } : item;
      }
      return item;
    }));
    setLastAddedId(id);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item =>
      item.menuItemId === id ? { ...item, notes: notes.toUpperCase() } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== id));
    if (lastAddedId === id) setLastAddedId(null);
  };

  const handleSubmitToKitchen = () => {
    if (!selectedTable) {
      toast.error('Pilih meja terlebih dahulu.');
      setMobileActivePanel('TABLES');
      return;
    }
    if (cart.length === 0) {
      toast.error('Keranjang belanja masih kosong.');
      setMobileActivePanel('MENU');
      return;
    }

    createOrderMutation.mutate({
      table_id: selectedTable.id,
      ...(customerPhone.trim() ? { customer_phone: customerPhone.trim() } : {}),
      ...(customerName.trim() ? { customer_name: customerName.trim() } : {}),
      items: cart.map((item) => ({
        menu_item_id: item.menuItemId,
        qty: item.qty,
        ...(item.notes.trim() ? { notes: item.notes.trim() } : {}),
      })),
    });
  };

  const openCheckout = (tableId: string) => {
    setCheckoutTableId(tableId);
    setSelectedOrderIds(new Set());
  };

  const closeCheckout = () => {
    setCheckoutTableId(null);
    setExpandedOrderId(null);
    setSelectedOrderIds(new Set());
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '1' && e.key <= '9' && lastAddedId) {
        const targetQty = parseInt(e.key, 10);
        setCart(prev => prev.map(item =>
          item.menuItemId === lastAddedId ? { ...item, qty: targetQty } : item
        ));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitToKitchen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastAddedId, cart, selectedTable]);

  return (
    <div className="w-full h-full flex-1 grid grid-cols-12 bg-white border-t border-black/10 text-black font-sans select-none overflow-hidden rounded-none relative">

      <div className={`${
        mobileActivePanel === 'TABLES' ? 'flex col-span-12' : 'hidden'
      } md:flex md:col-span-3 border-r border-black/10 flex-col h-full bg-black/[0.01] overflow-hidden`}>
        <div className="p-4 border-b border-black/10 flex flex-col gap-1 bg-white shrink-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> FLOOR PLAN
          </h2>
          <p className="text-[10px] text-black/40 font-bold uppercase">KLIK UNTUK PILIH MEJA</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 md:grid-cols-1 gap-2 content-start pb-20 md:pb-4">
          {tables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            const isMaintenance = table.status === 'maintenance';
            const badge = tableStatusBadge(table.status);

            return (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-3 text-left flex flex-col justify-between border transition-all h-[5.8rem] relative rounded-none ${
                  isMaintenance
                    ? 'border-black/5 bg-black/[0.02] text-black/20 cursor-not-allowed'
                    : isSelected
                      ? 'border-black bg-black text-white shadow-md z-10 cursor-pointer'
                      : table.status === 'occupied'
                        ? 'border-red-200 bg-red-50/50 hover:bg-red-50 text-black cursor-pointer'
                        : 'border-black/10 bg-white hover:border-black/40 text-black cursor-pointer'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-sm font-black tracking-tight leading-none">{table.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-none ${badge.dot}`} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${isSelected ? 'text-white/60' : 'text-black/40'}`}>
                    {table.capacity} PAX · {table.area}
                  </span>
                  <span className={`text-[10px] font-black uppercase mt-0.5 leading-none ${
                    isSelected ? 'text-white/80' : badge.text
                  }`}>
                    {badge.label}
                  </span>
                </div>

                {table.status === 'occupied' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openCheckout(table.id); }}
                    className={`absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border rounded-none ${
                      isSelected ? 'border-white/30 text-white hover:bg-white/10' : 'border-black/10 bg-white text-black/60 hover:border-black/40'
                    }`}
                  >
                    <Receipt className="w-2.5 h-2.5" /> Bill
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-white border-t border-black/10 flex items-center justify-between shrink-0 hidden md:flex">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-black/40 uppercase">ACTIVE TABLE</span>
            <span className="text-sm font-black uppercase">{selectedTable ? selectedTable.name : 'NONE'}</span>
          </div>
          {selectedTable && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase ${
              selectedTable.status === 'occupied' ? 'border-red-200 bg-red-50 text-red-600' : 'border-black/10 bg-black/[0.02]'
            }`}>
              {selectedTable.status}
            </span>
          )}
        </div>
      </div>

      <div className={`${
        mobileActivePanel === 'MENU' ? 'flex col-span-12' : 'hidden'
      } md:flex md:col-span-6 border-r border-black/10 flex-col h-full bg-white overflow-hidden`}>

        <div className="p-4 border-b border-black/10 flex flex-col gap-3 shrink-0 bg-white z-10">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-black/30 absolute left-3" />
            <input
              type="text"
              placeholder="CARI ITEM MENU..."
              value={searchMenu}
              onChange={(e) => setSearchMenu(e.target.value)}
              className="w-full bg-black/[0.02] border border-black/10 focus:border-black focus:bg-white pl-9 pr-4 py-2 text-xs font-bold uppercase tracking-wider placeholder:text-black/30 focus:outline-none transition-all rounded-none"
            />
          </div>

          <div className="flex border border-black/10 p-0.5 bg-black/[0.01] w-full overflow-x-auto scrollbar-none">
            {[{ id: ALL_CATEGORY_ID, name: 'All' }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex-1 min-w-[80px] text-center py-2 text-[10px] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                  activeCategoryId === cat.id ? 'bg-black text-white' : 'text-black/40 hover:text-black hover:bg-black/[0.02]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-black/[0.01] content-start pb-20 md:pb-4">
          {menuItems.map((item) => {
            const isLastTouched = lastAddedId === item.id;
            const isOutOfStock = item.status === 'out_of_stock';
            return (
              <div
                key={item.id}
                onClick={() => handleAddToBag(item)}
                className={`bg-white border p-2 flex flex-col justify-between transition-all relative group rounded-none h-full ${
                  isOutOfStock
                    ? 'border-black/5 opacity-40 cursor-not-allowed'
                    : isLastTouched
                      ? 'border-black ring-1 ring-black cursor-pointer hover:shadow-md'
                      : 'border-black/10 hover:border-black/40 cursor-pointer hover:shadow-md'
                }`}
              >
                <div className="w-full aspect-[4/3] bg-black/5 overflow-hidden relative border border-black/5 shrink-0">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <span className="absolute top-1 right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide rounded-none">
                    {isOutOfStock ? 'Out of Stock' : item.category?.name}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 justify-between flex-1">
                  <h3 className="text-xs font-black uppercase text-black line-clamp-2 tracking-tight group-hover:text-[#6E3A2F] transition-colors leading-tight min-h-[2.2rem]">
                    {item.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1 border-t border-black/5 pt-1.5 w-full">
                    <span className="text-[11px] font-black text-black">
                      {formatUsd(item.price)}
                    </span>
                    {!isOutOfStock && (
                      <span className="text-[9px] font-bold text-black/40 uppercase md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        + ADD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${
        mobileActivePanel === 'SUMMARY' ? 'flex col-span-12' : 'hidden'
      } md:flex md:col-span-3 flex-col h-full bg-white overflow-hidden`}>

        <div className="p-4 border-b border-black/10 flex items-center justify-between bg-black/[0.01] shrink-0">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-black/60" />
            <h2 className="text-xs font-black uppercase tracking-widest">ORDER {selectedTable && `(${selectedTable.name})`}</h2>
          </div>
          <span className="text-[10px] font-black bg-black px-2 py-0.5 text-white rounded-none">
            {cart.reduce((sum, i) => sum + i.qty, 0)} ITEMS
          </span>
        </div>

        {/* List Belanjaan - flex-1 dan overflow-y-auto agar scrollable secara mandiri */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-black/10 my-auto rounded-none">
              <ChefHat className="w-8 h-8 text-black/20 mb-2 stroke-[1.5]" />
              <p className="text-xs font-black uppercase tracking-wider text-black/40">Belum Ada Pesanan</p>
            </div>
          ) : (
            cart.map((item) => {
              const isActiveShortcut = lastAddedId === item.menuItemId;
              return (
                <div key={item.menuItemId} className={`p-3 border flex flex-col gap-2 relative rounded-none ${isActiveShortcut ? 'border-black bg-black/[0.01]' : 'border-black/5 bg-white'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-black uppercase tracking-tight leading-tight text-black">{item.name}</span>
                      <span className="text-[10px] font-bold text-black/40 mt-0.5">@ {formatUsd(item.price)}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(item.menuItemId)} className="text-black/30 hover:text-red-600 p-0.5 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1 pt-1.5 border-t border-black/[0.04]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-black/10 p-0.5 bg-white">
                        <button onClick={() => handleUpdateQty(item.menuItemId, -1)} className="px-2.5 py-1 text-xs font-bold text-black/50 rounded-none">-</button>
                        <span className="px-3 text-xs font-black text-black min-w-[24px] text-center">{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.menuItemId, 1)} className="px-2.5 py-1 text-xs font-bold text-black/50 rounded-none">+</button>
                      </div>
                      <span className="text-xs font-black text-black">{formatUsd(item.price * item.qty)}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="CATATAN..."
                      value={item.notes}
                      onChange={(e) => handleUpdateNotes(item.menuItemId, e.target.value)}
                      className="w-full bg-black/[0.02] border border-black/5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none focus:bg-white focus:border-black rounded-none"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-black/10 bg-white flex flex-col gap-2 shrink-0 mb-16 md:mb-0">
          <input
            type="text"
            placeholder="NAMA PELANGGAN (OPSIONAL)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-black/[0.02] border border-black/5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none focus:bg-white focus:border-black rounded-none"
          />
          <input
            type="tel"
            placeholder="NO. HP PELANGGAN (OPSIONAL)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-black/[0.02] border border-black/5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none focus:bg-white focus:border-black rounded-none mb-1"
          />
          <div className="flex justify-between items-center text-xs font-medium text-black/60">
            <span className="uppercase">Subtotal</span>
            <span>{formatUsd(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-black/60">
            <span className="uppercase">Pajak (10%)</span>
            <span>{formatUsd(estimatedTax)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-black/60">
            <span className="uppercase">Service (5%)</span>
            <span>{formatUsd(estimatedServiceCharge)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-black text-black border-t border-black/10 pt-2 mt-1">
            <span className="uppercase tracking-wide">Grand Total</span>
            <span className="text-base font-black text-[#6E3A2F]">{formatUsd(estimatedTotal)}</span>
          </div>

          <button
            onClick={handleSubmitToKitchen}
            disabled={cart.length === 0 || createOrderMutation.isPending}
            className={`w-full py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all mt-2 rounded-none border ${
              cart.length > 0 && !createOrderMutation.isPending ? 'bg-black text-white border-black hover:bg-black/90 cursor-pointer' : 'bg-black/5 text-black/20 border-black/5 cursor-not-allowed'
            }`}
          >
            <ChefHat className="w-4 h-4" /> {createOrderMutation.isPending ? 'MENGIRIM...' : 'KIRIM KE KITCHEN'}
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black/10 grid grid-cols-3 z-50 shadow-lg">
        <button
          onClick={() => setMobileActivePanel('TABLES')}
          className={`flex flex-col items-center justify-center gap-1 border-r border-black/5 cursor-pointer ${
            mobileActivePanel === 'TABLES' ? 'text-black bg-black/[0.02] font-black' : 'text-black/40 font-bold'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Meja ({selectedTable ? selectedTable.name : 'None'})</span>
        </button>

        <button
          onClick={() => setMobileActivePanel('MENU')}
          className={`flex flex-col items-center justify-center gap-1 border-r border-black/5 cursor-pointer ${
            mobileActivePanel === 'MENU' ? 'text-black bg-black/[0.02] font-black' : 'text-black/40 font-bold'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Menu</span>
        </button>

        <button
          onClick={() => setMobileActivePanel('SUMMARY')}
          className={`flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
            mobileActivePanel === 'SUMMARY' ? 'text-black bg-black/[0.02] font-black' : 'text-black/40 font-bold'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-black text-white text-[8px] font-black w-4 h-4 flex items-center justify-center border border-white">
                {cart.reduce((sum, i) => sum + i.qty, 0)}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Order</span>
        </button>
      </div>

      <Dialog open={!!checkoutTableId} onOpenChange={(open) => !open && closeCheckout()}>
        <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[480px] p-[6vw] md:p-[2vw] bg-white gap-[4vw] md:gap-[1.2vw]">
          <DialogHeader className="border-b border-black/5 pb-[3vw] md:pb-[1vw]">
            <DialogTitle className="text-[4.5vw] md:text-[1.1vw] font-bold text-black uppercase">Checkout</DialogTitle>
          </DialogHeader>

          {activeOrdersQuery.isLoading ? (
            <p className="text-center text-sm text-black/30 font-medium uppercase py-6">Memuat order...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeOrdersQuery.data && activeOrdersQuery.data.length === 0 && (
                <p className="text-center text-sm text-black/30 font-medium uppercase py-4">Tidak ada order aktif di meja ini.</p>
              )}
              {activeOrdersQuery.data?.map((order) => (
                <div key={order.id} className="border border-black/10 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {showBatchPayUI && order.payment_status === 'unpaid' && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-3.5 h-3.5 accent-black cursor-pointer rounded-none"
                        />
                      )}
                      <span className="text-xs font-bold uppercase text-black/50">
                        {order.customer_name ? `${order.customer_name} · ` : ''}
                        {order.items.length} item(s) — {new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                      order.payment_status === 'paid' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="text-xs font-bold uppercase text-black/50 underline hover:text-black"
                    >
                      {expandedOrderId === order.id ? 'Tutup Rincian' : 'Lihat Rincian'}
                    </button>
                    <span className="text-sm font-black text-black">{formatUsd(order.total)}</span>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="border-t border-black/5 pt-2 flex flex-col gap-1">
                      {billQuery.isLoading ? (
                        <p className="text-xs text-black/30 uppercase">Memuat rincian...</p>
                      ) : (
                        billQuery.data?.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-black/60">
                            <span>{item.qty}x {item.name}</span>
                            <span>{item.line_total_formatted}</span>
                          </div>
                        ))
                      )}
                      {billQuery.data && (
                        <>
                          <div className="flex justify-between text-xs text-black/60 pt-1 border-t border-black/5 mt-1">
                            <span>Tax ({billQuery.data.tax_rate_percent}%)</span>
                            <span>{billQuery.data.tax_formatted}</span>
                          </div>
                          <div className="flex justify-between text-xs text-black/60">
                            <span>Service ({billQuery.data.service_charge_rate_percent}%)</span>
                            <span>{billQuery.data.service_charge_formatted}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {order.payment_status === 'unpaid' && (
                    <button
                      onClick={() => markPaidMutation.mutate({ id: order.id, status: 'paid' })}
                      disabled={markPaidMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-black/80 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Tandai Lunas
                    </button>
                  )}
                </div>
              ))}

              {showBatchPayUI && selectedOrderIds.size > 0 && (
                <div className="border border-black bg-black/[0.02] p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase text-black/60">
                    <span>{selectedOrderIds.size} Order Terpilih</span>
                    <span className="text-black">{formatUsd(selectedOrdersTotal)}</span>
                  </div>
                  <button
                    onClick={() => batchMarkPaidMutation.mutate([...selectedOrderIds])}
                    disabled={batchMarkPaidMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-black/80 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Bayar Semua yang Dipilih
                  </button>
                </div>
              )}

              <button
                onClick={() => checkoutTableId && markTableAvailableMutation.mutate(checkoutTableId)}
                disabled={!allOrdersPaid || markTableAvailableMutation.isPending}
                title={!allOrdersPaid ? 'Semua order harus lunas dulu sebelum meja bisa ditandai tersedia.' : undefined}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer disabled:cursor-not-allowed border-black/10 bg-white text-black/70 hover:enabled:bg-black hover:enabled:text-white disabled:opacity-40"
              >
                <Unlock className="w-3 h-3" /> Mark Table Available
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default POSBoard;