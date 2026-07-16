'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, Play, Send, AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { signOut } from '@/lib/auth-client';
import { useSession } from '@/hooks/use-session';
import { ApiError } from '@/lib/api-client';
import { kitchenQueueQueryOptions, updateOrderItemStatus } from '@/lib/queries/kitchen';
import type { KitchenQueueItem, OrderItemStatus } from '@/types/api';

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

interface Ticket {
  orderId: string;
  tableName: string;
  createdAt: string;
  items: KitchenQueueItem[];
}

function groupByOrder(items: KitchenQueueItem[]): Ticket[] {
  const map = new Map<string, Ticket>();
  for (const item of items) {
    const key = item.order.id;
    if (!map.has(key)) {
      map.set(key, {
        orderId: key,
        tableName: item.order.table.name,
        createdAt: item.order.created_at,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const diffMs = Math.abs(new Date().getTime() - new Date(createdAt).getTime());
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      const paddedSecs = diffSecs < 10 ? `0${diffSecs}` : diffSecs;
      const paddedMins = diffMins < 10 ? `0${diffMins}` : diffMins;

      setElapsed(`${paddedMins}:${paddedSecs}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className="font-mono text-sm font-black tracking-wider bg-black text-white px-2 py-0.5">
      {elapsed}
    </span>
  );
}

function itemStatusConfig(status: KitchenQueueItem['status']) {
  switch (status) {
    case 'pending':
      return { badge: 'bg-zinc-100 text-zinc-600 border-zinc-200', border: 'border-zinc-300' };
    case 'cooking':
      return { badge: 'bg-orange-50 text-orange-600 border-orange-200', border: 'border-orange-300' };
    default:
      return { badge: 'bg-zinc-100 text-zinc-400 border-zinc-200', border: 'border-zinc-200' };
  }
}

export const KitchenBoard = () => {
  const { data: items } = useSuspenseQuery({ ...kitchenQueueQueryOptions(), refetchInterval: 4000 });
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const tickets = useMemo(() => groupByOrder(items), [items]);

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      router.push('/admin/login');
    },
  });

  // Optimistic: item 'pending'/'cooking' diupdate langsung di cache, item
  // 'served' langsung dibuang dari cache (persis gimana backend GET
  // /admin/kitchen-queue memandangnya — cuma balikin status pending/cooking).
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderItemStatus }) => updateOrderItemStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kitchen-queue'] });
      const previous = queryClient.getQueryData<KitchenQueueItem[]>(['kitchen-queue']);

      queryClient.setQueryData<KitchenQueueItem[]>(['kitchen-queue'], (old) => {
        if (!old) return old;
        if (status === 'served') return old.filter((item) => item.id !== id);
        return old.map((item) => (item.id === id ? { ...item, status } : item));
      });

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['kitchen-queue'], context.previous);
      toast.error(apiErrorMessage(error, 'Gagal memperbarui status, coba lagi.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
      // Serve item terakhir di order bisa nge-trigger order auto-completed +
      // meja balik available di backend — invalidate biar Tables/POS lain
      // ke-reflect tanpa aksi manual.
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  return (
    <div className="w-full h-screen max-h-screen bg-[#F9F9F9] text-black font-sans flex flex-col overflow-hidden rounded-none select-none p-4 gap-4">

      <header className="w-full bg-white border border-black/10 p-4 flex justify-between items-center shrink-0 rounded-none">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none">KITCHEN DISPLAY SYSTEM</h1>
            <p className="text-[10px] text-black/40 font-bold uppercase mt-1">MONITOR ANTREAN DAPUR • FIFO</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.user.role === 'owner' && (
            <Link
              href="/admin/tables"
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black/60 border border-black/10 hover:bg-black/[0.02] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOutMutation.mutate()}
            disabled={signOutMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" /> {signOutMutation.isPending ? '...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-2 items-start h-full">
        {tickets.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center border border-dashed border-black/10 bg-white rounded-none p-8">
            <ChefHat className="w-12 h-12 text-black/10 mb-2 stroke-[1]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-black/40">DAPUR BERSIH!</h3>
            <p className="text-[10px] text-black/30 font-bold uppercase max-w-xs mt-1">Tidak ada order pending/cooking saat ini.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.orderId}
              className="w-[340px] shrink-0 h-full max-h-[calc(100vh-8.5rem)] flex flex-col bg-white border border-black/10 rounded-none shadow-sm transition-all"
            >
              <div className="p-3.5 border-b border-black/10 flex items-center justify-between shrink-0 bg-white">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-wider">TABLE</span>
                  <span className="text-base font-black tracking-tight text-black uppercase">{ticket.tableName}</span>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-wider">ELAPSED TIME</span>
                  <ElapsedTimer createdAt={ticket.createdAt} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white">
                {ticket.items.map((item) => {
                  const config = itemStatusConfig(item.status);
                  return (
                    <div key={item.id} className={`flex flex-col gap-2 pb-3 border-b border-l-4 pl-2 ${config.border} border-b-black/[0.04] last:border-b-0`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-black shrink-0 px-1.5 py-0.5 border border-black/20 bg-black/[0.02] min-w-[24px] text-center">
                            {item.qty}x
                          </span>
                          <span className="text-xs font-black uppercase tracking-tight text-black leading-tight">
                            {item.menu_item.name}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase border px-1.5 py-0.5 shrink-0 ${config.badge}`}>
                          {item.status}
                        </span>
                      </div>

                      {item.notes && (
                        <div className="ml-8 bg-red-50 border border-red-200/60 p-2 flex items-start gap-1.5 text-[10px] font-bold text-red-700 uppercase tracking-wide rounded-none">
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                          <span>NOTE: {item.notes}</span>
                        </div>
                      )}

                      <div className="ml-8">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cooking' })}
                            disabled={updateStatusMutation.isPending}
                            className="w-full py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 bg-zinc-500 hover:bg-zinc-600 text-white transition-all disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Cooking
                          </button>
                        )}
                        {item.status === 'cooking' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'served' })}
                            disabled={updateStatusMutation.isPending}
                            className="w-full py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" /> Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

    </div>
  );
};

export default KitchenBoard;
