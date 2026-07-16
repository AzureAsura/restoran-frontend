import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { getForwardedSession } from '@/lib/server-session';
import { AdminShell } from '@/components/shared/AdminShell';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  // proxy.ts middleware already fetched the session to gate this route —
  // reuse it instead of calling get-session again (was a redundant DB hit).
  queryClient.setQueryData(['session'], await getForwardedSession());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminShell>{children}</AdminShell>
    </HydrationBoundary>
  );
};

export default Layout;