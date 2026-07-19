import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Hero } from '@/components/public/landing-page/Hero'
import InfoCards from '@/components/public/landing-page/InfoCards';
import RestaurantEvents from '@/components/public/landing-page/RestaurantEvents';
import { StoryGallery } from '@/components/public/landing-page/StoryGallery';
import Testimonials from '@/components/public/landing-page/Testimonials';
import FlowingMenuSection from '@/components/public/landing-page/FlowingMenuSection';
import FlowingMenuSkeleton from '@/components/public/landing-page/FlowingMenuSkeleton';
import Footer from '@/components/shared/Footer';
import Navbar from '@/components/shared/Navbar';
import { getQueryClient } from '@/lib/query-client';
import { menuQueryOptions } from '@/lib/queries/menu';
import ChatWidget from '@/components/shared/ChatWidget';

const page = () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(menuQueryOptions());

  return (
    <div className='w-full min-h-screen bg-canvas flex flex-col items-center'>
      {/* <Navbar/> */}
      <Hero />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<FlowingMenuSkeleton />}>
          <FlowingMenuSection />
        </Suspense>
      </HydrationBoundary>
      <StoryGallery/>
      <Testimonials/>
      <RestaurantEvents/>
      <InfoCards/>
      {/* <ChatWidget/> */}
      {/* <Footer/> */}
    </div>
  )
}

export default page