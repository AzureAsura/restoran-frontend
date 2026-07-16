import { Suspense } from 'react';
import BookingConfirmation from '@/components/public/booking/BookingConfirmation';

const page = () => {
  return (
    <Suspense fallback={null}>
      <BookingConfirmation />
    </Suspense>
  );
};

export default page;
