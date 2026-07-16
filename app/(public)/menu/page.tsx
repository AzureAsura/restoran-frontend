import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { menuQueryOptions } from "@/lib/queries/menu";
import MenuSection from "@/components/public/menu/MenuSection";
import MenuSkeleton from "@/components/public/menu/MenuSkeleton";
import Footer from "@/components/shared/Footer";

interface MenuPageProps {
    searchParams: Promise<{ category?: string }>;
}

export const MenuPage = async ({ searchParams }: MenuPageProps) => {
    const { category } = await searchParams;
    const queryClient = getQueryClient();
    // Not awaited on purpose: lets Next.js stream the Suspense fallback
    // immediately instead of blocking the response on this fetch.
    void queryClient.prefetchQuery(menuQueryOptions());

    return (
        <>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<MenuSkeleton />}>
                    <MenuSection initialCategory={category} />
                </Suspense>
            </HydrationBoundary>
            <Footer/>
        </>
    );
};

export default MenuPage;