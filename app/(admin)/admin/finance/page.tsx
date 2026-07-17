import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  menuFinancialsQueryOptions,
  reservationAnalyticsQueryOptions,
  revenueReportQueryOptions,
} from '@/lib/queries/analytics';
import { paidOrderRangeFromPeriod, paidOrdersQueryOptions } from '@/lib/queries/orders';
import { ApiError } from '@/lib/api-client';
import { ROLE_LANDING_PAGE } from '@/lib/role-landing';
import type { RevenuePeriod, Session } from '@/types/api';
import FinanceBoard from '@/components/admin/finance/FinanceBoard';
import FinanceSkeleton from '@/components/admin/finance/FinanceSkeleton';

function getTodayDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

const DEFAULT_PERIOD: RevenuePeriod = 'month';

const FinancePage = async () => {
  const queryClient = getQueryClient();
  const cookieHeader = (await cookies()).toString();
  const today = getTodayDateString();

  try {
    const revenue = await queryClient.fetchQuery(revenueReportQueryOptions(DEFAULT_PERIOD, today, cookieHeader));
    const { paid_from, paid_to } = paidOrderRangeFromPeriod(revenue.range);
    await Promise.all([
      queryClient.fetchQuery(reservationAnalyticsQueryOptions(DEFAULT_PERIOD, today, cookieHeader)),
      queryClient.fetchQuery(menuFinancialsQueryOptions(DEFAULT_PERIOD, today, cookieHeader)),
      queryClient.fetchQuery(paidOrdersQueryOptions({ paid_from, paid_to, page: 1, limit: 20 }, cookieHeader)),
    ]);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load finance data.';
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
      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceBoard initialPeriod={DEFAULT_PERIOD} initialDate={today} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default FinancePage;
