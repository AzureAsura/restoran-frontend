import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { kitchenQueueQueryOptions } from '@/lib/queries/kitchen';
import { getForwardedSession } from '@/lib/server-session';
import { ApiError } from '@/lib/api-client';
import KitchenBoard from '@/components/admin/kitchen/KitchenBoard';
import KitchenSkeleton from '@/components/admin/kitchen/KitchenSkeleton';

const KitchenPage = async () => {
  const queryClient = getQueryClient();
  const cookieHeader = (await cookies()).toString();

  // Session di-seed juga di sini (beda dari (admin)/layout.tsx yang cuma
  // jalan buat grup (admin)) — grup (admin-standalone) gak lewat layout itu,
  // jadi tanpa ini header Admin/Logout bakal nunggu client-side fetch dulu
  // buat tau role (persis temuan follow-up FASE 3 dulu). Diambil dari header
  // yang di-forward proxy.ts (middleware udah fetch session buat gate route
  // ini), bukan fetch ulang.
  queryClient.setQueryData(['session'], await getForwardedSession());

  // fetchQuery (bukan prefetchQuery) — endpoint ber-auth, lihat catatan sama
  // di app/(admin)/admin/tables/page.tsx.
  try {
    await queryClient.fetchQuery(kitchenQueueQueryOptions(cookieHeader));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load kitchen queue.';

    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-[#F9F9F9] text-center p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-black">Access Denied</h2>
        <p className="text-xs text-black/50 uppercase max-w-xs">{message}</p>
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<KitchenSkeleton />}>
        <KitchenBoard />
      </Suspense>
    </HydrationBoundary>
  );
};

export default KitchenPage;
