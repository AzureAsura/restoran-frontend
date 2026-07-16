import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { tablesQueryOptions } from '@/lib/queries/tables';
import { ApiError } from '@/lib/api-client';
import { ROLE_LANDING_PAGE } from '@/lib/role-landing';
import type { Session } from '@/types/api';
import TablesBoard from '@/components/admin/tables/TablesBoard';
import TablesSkeleton from '@/components/admin/tables/TablesSkeleton';

const TablesPage = async () => {
  const queryClient = getQueryClient();
  const cookieHeader = (await cookies()).toString();

  // fetchQuery (not prefetchQuery): prefetchQuery deliberately swallows
  // errors (`.catch(noop)`, TanStack Query core) so a failed prefetch never
  // throws — but that also means dehydrate() (which only serializes
  // "success" queries) silently drops it, leaving TablesBoard's client
  // useSuspenseQuery to re-fetch during SSR without the cookie and surface a
  // misleading 401 instead of the real 403 role rejection. fetchQuery
  // rejects normally so the real error can be caught and handled here.
  try {
    await queryClient.fetchQuery(tablesQueryOptions(cookieHeader));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load tables.';
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
      <Suspense fallback={<TablesSkeleton />}>
        <TablesBoard />
      </Suspense>
    </HydrationBoundary>
  );
};

export default TablesPage;
