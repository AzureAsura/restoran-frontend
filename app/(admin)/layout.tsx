import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { sessionQueryOptions } from '@/lib/queries/session';
import { AdminShell } from '@/components/shared/AdminShell';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  const cookieHeader = (await cookies()).toString();

  await queryClient.prefetchQuery(sessionQueryOptions(cookieHeader));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminShell>{children}</AdminShell>
    </HydrationBoundary>
  );
};

export default Layout;