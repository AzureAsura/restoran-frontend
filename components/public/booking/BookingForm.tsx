'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createBooking } from '@/lib/queries/bookings';
import { ApiError } from '@/lib/api-client';

const TIME_SLOTS = [
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
] as const;

// Sama persis dengan todayInJakarta() di backend (booking.schema.ts) — booking_date
// divalidasi terhadap "hari ini" versi Asia/Jakarta, bukan timezone lokal browser user,
// supaya validasi FE & BE selalu sinkron di timezone manapun user berada.
function getTodayDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

const bookingFormSchema = z.object({
  customer_name: z.string().trim().min(1, 'Full name is required.'),
  customer_phone: z
    .string()
    .regex(/^08\d{8,11}$/, 'Invalid Indonesian phone number format (e.g. 08123456789).'),
  party_size: z.coerce
    .number('Party size is required.')
    .int('Party size must be a whole number.')
    .min(1, 'Party size must be between 1 and 20 people.')
    .max(20, 'Party size must be between 1 and 20 people.'),
  booking_date: z
    .string()
    .min(1, 'Reservation date is required.')
    .refine((value) => value >= getTodayDateString(), 'Reservation date cannot be in the past.'),
  booking_time: z.enum(TIME_SLOTS, { error: 'Please select an available time slot.' }),
  area_preference: z.enum(['indoor', 'outdoor', 'no_preference'], {
    error: 'Please select a table area preference.',
  }),
  // Backend: .trim().min(1).optional() — field boleh absen, tapi kalau ADA harus
  // non-kosong. Textarea kosong secara native kasih string "", bukan undefined,
  // jadi di sini di-transform ke undefined biar field-nya di-skip total dari
  // payload (JSON.stringify menghilangkan key bernilai undefined) alih-alih
  // terkirim sebagai "" yang bakal ditolak backend.
  special_requests: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

type BookingFormInput = z.input<typeof bookingFormSchema>;
type BookingFormOutput = z.output<typeof bookingFormSchema>;

export const BookingForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormOutput>({
    resolver: zodResolver(bookingFormSchema),
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (result, variables) => {
      const params = new URLSearchParams({
        code: result.booking_code,
        name: result.customer_name,
        party_size: String(result.party_size),
        date: result.booking_date,
        time: result.booking_time,
        table: result.table.name,
        area: result.table.area,
      });
      if (variables.special_requests) {
        params.set('notes', variables.special_requests);
      }
      router.push(`/booking/konfirmasi?${params.toString()}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Failed to create reservation, please try again.'
      );
    },
  });

  const onSubmit = (values: BookingFormOutput) => {
    bookingMutation.mutate(values);
  };

  return (
    <main className="w-full bg-canvas flex flex-col section-pad pt-[20vw] md:pt-[10vw] pb-[8vw]">

      <div className="w-full border-b border-black/5 pb-[4vw] mb-[6vw] md:mb-[4vw]">
        <h1 className="text-[10vw] md:text-[4vw] font-bold tracking-tight text-black uppercase leading-[0.9]">
          Reservations
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[8vw] md:gap-[4vw] items-start w-full">

        <div className="md:col-span-5 flex flex-col gap-[4vw] md:sticky md:top-[4vw]">
          <div className="flex flex-col gap-[1vw]">
            <span className="text-[3vw] md:text-[0.85vw] font-medium tracking-[0.1em] text-black/40 uppercase">
              Secure your table
            </span>
            <h2 className="text-[6vw] md:text-[2.2vw] font-bold tracking-tight uppercase text-black leading-[1.1]">
              Dining Experience
            </h2>
          </div>

          <p className="text-[3.8vw] md:text-[1.05vw] font-medium text-black/60 uppercase tracking-tight leading-[1.4] max-w-[90%]">
            We accept online reservations up to 30 days in advance. For parties larger than 20 people, please contact our events team directly via email.
          </p>

          <div className="flex flex-col gap-[0.5vw] border-t border-black/5 pt-[4vw]">
            <span className="text-[2.8vw] md:text-[0.75vw] font-medium tracking-wider text-black/40 uppercase">
              Cancellation Policy
            </span>
            <p className="text-[3.5vw] md:text-[0.9vw] font-semibold text-black uppercase">
              Please notify us at least 24 hours prior to your reservation time.
            </p>
          </div>
        </div>

        <div className="md:col-span-7 w-full flex flex-col gap-[4vw]">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-[4vw]">

            <div className="flex flex-col gap-[1vw] md:gap-[0.5vw] w-full">
              <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                Full Name
              </label>
              <input
                type="text"
                placeholder="YOUR NAME"
                {...register('customer_name')}
                className={`w-full bg-transparent border-b ${errors.customer_name ? 'border-red-500' : 'border-black/20 focus:border-black'} pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide transition-colors`}
              />
              {errors.customer_name && (
                <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                  {errors.customer_name.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[4vw] md:gap-[2vw] w-full">

              <div className="flex flex-col gap-[1vw] md:gap-[0.5vw]">
                <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="E.G. 08123456789"
                  {...register('customer_phone')}
                  className={`w-full bg-transparent border-b ${errors.customer_phone ? 'border-red-500' : 'border-black/20 focus:border-black'} pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide transition-colors`}
                />
                {errors.customer_phone && (
                  <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                    {errors.customer_phone.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-[1vw] md:gap-[0.5vw]">
                <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                  Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="1 - 20 PEOPLE"
                  {...register('party_size')}
                  className={`w-full bg-transparent border-b ${errors.party_size ? 'border-red-500' : 'border-black/20 focus:border-black'} pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none uppercase tracking-wide transition-colors`}
                />
                {errors.party_size && (
                  <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                    {errors.party_size.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[4vw] md:gap-[2vw] w-full">

              <div className="flex flex-col gap-[1vw] md:gap-[0.5vw]">
                <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                  Reservation Date
                </label>
                <input
                  type="date"
                  min={getTodayDateString()}
                  {...register('booking_date')}
                  className={`w-full bg-transparent border-b ${errors.booking_date ? 'border-red-500' : 'border-black/20 focus:border-black'} pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black focus:outline-none uppercase tracking-wide transition-colors`}
                />
                {errors.booking_date && (
                  <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                    {errors.booking_date.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-[1vw] md:gap-[0.5vw]">
                <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                  Visit Time
                </label>
                <select
                  defaultValue=""
                  {...register('booking_time')}
                  className={`w-full bg-transparent border-b ${errors.booking_time ? 'border-red-500' : 'border-black/20 focus:border-black'} pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black focus:outline-none uppercase tracking-wide transition-colors appearance-none`}
                >
                  <option value="" disabled className="text-black bg-canvas">SELECT VISIT TIME</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot} className="text-black bg-canvas">{slot}</option>
                  ))}
                </select>
                {errors.booking_time && (
                  <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                    {errors.booking_time.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[2vw] md:gap-[1vw] w-full pt-[1vw]">
              <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                Area Preference
              </label>
              <div className="flex flex-wrap gap-[4vw] md:gap-[2vw]">
                {(['indoor', 'outdoor', 'no_preference'] as const).map((area) => (
                  <label key={area} className="flex items-center gap-[1.5vw] md:gap-[0.6vw] cursor-pointer group select-none">
                    <input
                      type="radio"
                      value={area}
                      {...register('area_preference')}
                      className="sr-only"
                    />

                    <div className="w-[4vw] h-[4vw] md:w-[1.1vw] md:h-[1.1vw] border border-black rounded-full flex items-center justify-center p-[2px]">
                      <div className="w-full h-full bg-[#6E3A2F] rounded-full scale-0 group-has-[:checked]:scale-100 transition-transform duration-300" />
                    </div>
                    <span className="text-[3.8vw] md:text-[1vw] font-semibold uppercase text-black">
                      {area.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
              {errors.area_preference && (
                <span className="text-red-500 text-[2.8vw] md:text-[0.8vw] font-medium uppercase tracking-wide mt-[0.2vw]">
                  {errors.area_preference.message}
                </span>
              )}
            </div>


            <div className="flex flex-col gap-[1vw] md:gap-[0.5vw] w-full pt-[1vw]">
              <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black">
                Special Requests
              </label>
              <textarea
                rows={3}
                placeholder="FOOD ALLERGIES, BIRTHDAY CELEBRATIONS, OR OTHER SPECIAL REQUESTS..."
                {...register('special_requests')}
                className="w-full bg-transparent border-b border-black/20 focus:border-black pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide resize-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={bookingMutation.isPending}
              className="w-full bg-black text-white text-[4vw] md:text-[1.1vw] font-bold uppercase tracking-widest py-[4vw] md:py-[1.2vw] mt-[2vw] hover:bg-black/80 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingMutation.isPending ? 'Processing...' : 'Confirm Reservation'}
            </button>

          </form>
        </div>

      </div>
    </main>
  );
};

export default BookingForm;
