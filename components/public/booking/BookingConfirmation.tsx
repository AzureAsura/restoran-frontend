'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

function formatIcsDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function downloadIcsFile({
  code,
  name,
  date,
  time,
  table,
}: {
  code: string;
  name: string;
  date: string;
  time: string;
  table: string;
}) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, minute);
  const end = new Date(start.getTime() + 90 * 60000);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Megatha//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${code}@megatha`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Megatha Reservation - ${name}`,
    `DESCRIPTION:Booking code ${code}, Table ${table}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `megatha-booking-${code}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const BookingConfirmation = () => {
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const name = searchParams.get('name');
  const partySize = searchParams.get('party_size');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const table = searchParams.get('table');
  const area = searchParams.get('area');
  const notes = searchParams.get('notes');

  if (!code || !name || !date || !time || !table || !area || !partySize) {
    return (
      <main className="w-full bg-canvas min-h-[90vh] flex flex-col items-center justify-center section-pad pt-[8vw] pb-[8vw] text-center gap-[3vw]">
        <h1 className="text-[6vw] md:text-[2vw] font-bold uppercase text-black">
          No Reservation Found
        </h1>
        <p className="text-[3.5vw] md:text-[1vw] text-black/50 uppercase max-w-[80%] md:max-w-[35vw]">
          We could not find any reservation data. Please make a new booking first.
        </p>
        <Link
          href="/booking"
          className="mt-[2vw] bg-black text-white text-[3.8vw] md:text-[1vw] font-bold uppercase tracking-widest px-[6vw] py-[3vw] md:px-[2.5vw] md:py-[1vw] hover:bg-black/80 transition-colors"
        >
          Make a Reservation
        </Link>
      </main>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Booking code copied.');
  };

  const handleAddToCalendar = () => {
    downloadIcsFile({ code, name, date, time, table });
  };

  const dateTimeLabel = `${new Date(`${date}T${time}`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })} — ${time}`;

  return (
    <main className="w-full bg-canvas min-h-[90vh] flex flex-col items-center justify-center section-pad pt-[8vw] pb-[8vw]">

      <div className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[45vw] border border-black/10 bg-white shadow-xl shadow-black/[0.02] flex flex-col p-[6vw] md:p-[3.5vw] gap-[5vw] md:gap-[3vw] rounded-none relative overflow-hidden">

        <div className="flex flex-col items-center text-center gap-[2vw] md:gap-[1vw] border-b border-black/5 pb-[4vw]">
          <CheckCircle2 className="w-[10vw] h-[10vw] md:w-[3.5vw] md:h-[3.5vw] text-[#6E3A2F] stroke-[1.5]" />
          <span className="text-[3vw] md:text-[0.75vw] font-medium tracking-[0.2em] text-black/40 uppercase mt-[1vw]">
            Reservation Confirmed
          </span>
          <h1 className="text-[6.5vw] md:text-[2.2vw] font-bold tracking-tight uppercase text-black leading-[1.1] mt-[0.5vw]">
            See You Soon
          </h1>
        </div>

        <div className="w-full bg-black/[0.02] border border-black/5 flex justify-between items-center px-[4vw] py-[3vw] md:px-[2vw] md:py-[1.2vw]">
          <div className="flex flex-col gap-[0.2vw]">
            <span className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-widest">
              Booking Code
            </span>
            <span className="text-[4vw] md:text-[1.2vw] font-bold text-black tracking-tight uppercase">
              {code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-[1vw] text-[3vw] md:text-[0.75vw] font-bold text-black/60 hover:text-black uppercase tracking-wider transition-colors"
          >
            <Copy className="w-[3.5vw] h-[3.5vw] md:w-[1vw] md:h-[1vw]" />
            Copy
          </button>
        </div>

        <div className="flex flex-col gap-[4vw] md:gap-[1.8vw] w-full">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-[1vw] md:gap-0 border-b border-black/[0.03] pb-[2vw] md:pb-[0.8vw]">
            <span className="md:col-span-4 text-[2.8vw] md:text-[0.75vw] font-bold text-black/40 uppercase tracking-wider">
              Name
            </span>
            <span className="md:col-span-8 text-[3.8vw] md:text-[1vw] font-semibold text-black uppercase tracking-tight">
              {name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-[1vw] md:gap-0 border-b border-black/[0.03] pb-[2vw] md:pb-[0.8vw]">
            <span className="md:col-span-4 text-[2.8vw] md:text-[0.75vw] font-bold text-black/40 uppercase tracking-wider">
              Date & Time
            </span>
            <span className="md:col-span-8 text-[3.8vw] md:text-[1vw] font-semibold text-black uppercase tracking-tight">
              {dateTimeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-[1vw] md:gap-0 border-b border-black/[0.03] pb-[2vw] md:pb-[0.8vw]">
            <span className="md:col-span-4 text-[2.8vw] md:text-[0.75vw] font-bold text-black/40 uppercase tracking-wider">
              Total Guests
            </span>
            <span className="md:col-span-8 text-[3.8vw] md:text-[1vw] font-semibold text-black uppercase tracking-tight">
              {partySize} People
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-[1vw] md:gap-0 border-b border-black/[0.03] pb-[2vw] md:pb-[0.8vw]">
            <span className="md:col-span-4 text-[2.8vw] md:text-[0.75vw] font-bold text-black/40 uppercase tracking-wider">
              Table Assigned
            </span>
            <span className="md:col-span-8 text-[3.8vw] md:text-[1vw] font-bold text-[#6E3A2F] uppercase tracking-tight">
              {table} ({area})
            </span>
          </div>

          {notes && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-[1vw] md:gap-0">
              <span className="md:col-span-4 text-[2.8vw] md:text-[0.75vw] font-bold text-black/40 uppercase tracking-wider">
                Special Notes
              </span>
              <span className="md:col-span-8 text-[3.5vw] md:text-[0.9vw] font-medium text-black/70 uppercase leading-[1.3] tracking-tight">
                {notes}
              </span>
            </div>
          )}

        </div>

        <button
          onClick={handleAddToCalendar}
          className="w-full border border-black text-black text-[3.8vw] md:text-[1vw] font-bold uppercase tracking-widest py-[3.5vw] md:py-[1vw] flex items-center justify-center gap-[2vw] md:gap-[0.8vw] hover:bg-black hover:text-white transition-colors duration-300 rounded-none"
        >
          <Calendar className="w-[4vw] h-[4vw] md:w-[1.1vw] md:h-[1.1vw]" />
          Add to Calendar
        </button>

        <div className="w-full border-t border-dashed border-black/10 pt-[4vw] md:pt-[2vw] flex flex-col gap-[1vw]">
          <span className="text-[2.5vw] md:text-[0.65vw] font-bold text-red-600 uppercase tracking-widest">
            Important Notice
          </span>
          <p className="text-[3.2vw] md:text-[0.85vw] font-medium text-black/50 uppercase leading-[1.4] tracking-tight">
            PLEASE ARRIVE 15 MINUTES BEFORE YOUR BOOKING TIME. YOUR TABLE WILL BE HELD FOR 15 MINUTES.
          </p>
        </div>

      </div>
    </main>
  );
};

export default BookingConfirmation;
