import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { analyticsOverviewQueryOptions, analyticsTimelineQueryOptions, menuPerformanceQueryOptions } from '@/lib/queries/analytics';
import { ApiError } from '@/lib/api-client';
import { ROLE_LANDING_PAGE } from '@/lib/role-landing';
import type { Session } from '@/types/api';
import DashboardBoard from '@/components/admin/dashboard/DashboardBoard';
import DashboardSkeleton from '@/components/admin/dashboard/DashboardSkeleton';

// Sama persis dengan todayInJakarta() di backend (booking.schema.ts) — default
// filter "date" harus konsisten Asia/Jakarta, bukan timezone lokal server.
function getTodayDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

const DashboardPage = async () => {
  const queryClient = getQueryClient();
  const cookieHeader = (await cookies()).toString();
  const today = getTodayDateString();

  // fetchQuery (not prefetchQuery) — endpoint ber-auth (owner-only), lihat
  // catatan sama di app/(admin)/admin/tables/page.tsx.
  try {
    await Promise.all([
      queryClient.fetchQuery(analyticsOverviewQueryOptions(today, cookieHeader)),
      queryClient.fetchQuery(analyticsTimelineQueryOptions(today, cookieHeader)),
      queryClient.fetchQuery(menuPerformanceQueryOptions('today', cookieHeader)),
    ]);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load dashboard data.';
    const session = queryClient.getQueryData<Session | null>(['session']);
    const landingPage = session ? ROLE_LANDING_PAGE[session.user.role] : '/admin/login';

    return (
      <div className="w-full flex flex-col items-center justify-center gap-[2vw] py-[10vw] md:py-[4vw] text-center">
        <h2 className="text-[5vw] md:text-[1.4vw] font-bold uppercase tracking-tight text-black">Access Denied</h2>
        <p className="text-[3.2vw] md:text-[0.85vw] text-black/50 uppercase max-w-[80%] md:max-w-[30vw]">{message}</p>
        <Link
          href={landingPage}
          className="mt-[1vw] bg-black text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase tracking-widest px-[5vw] py-[2.5vw] md:px-[2vw] md:py-[0.8vw] hover:bg-black/80 transition-colors"
        >
          Back to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBoard initialDate={today} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default DashboardPage;
