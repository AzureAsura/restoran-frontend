'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  TableProperties,
  Clock,
  MoreVertical,
  UserCheck,
  UserMinus,
  XSquare,
  CheckCircle2,
  Users,
  MapPin,
  MessageSquareText,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-client';
import { bookingsQueryOptions, updateBookingStatus } from '@/lib/queries/bookings';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Area, Booking, BookingStatus } from '@/types/api';

interface BookingsBoardProps {
  initialDate: string;
}

// Backend cuma punya area indoor/outdoor (table.area) — VIP di mock lama
// dihapus sesuai prinsip "backend adalah kiblat".
const TIMELINE_AREAS: Area[] = ['indoor', 'outdoor'];
const TIMELINE_START_HOUR  = 8;
const TIMELINE_END_HOUR    = 22;
const TIMELINE_TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export const BookingsBoard = ({ initialDate }: BookingsBoardProps) => {
  const [viewMode, setViewMode]         = useState<'LIST' | 'TIMELINE'>('LIST');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [searchInput, setSearchInput]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [areaFilter, setAreaFilter]     = useState<'ALL' | Area>('ALL');
  const [noteBooking, setNoteBooking]   = useState<Booking | null>(null);

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const queryClient = useQueryClient();

  const filters = {
    date: selectedDate,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    area: areaFilter === 'ALL' ? undefined : areaFilter,
    search: debouncedSearch.trim() || undefined,
  };

  const { data: bookings } = useSuspenseQuery({
    ...bookingsQueryOptions(filters),
    refetchInterval: 12000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal mengubah status booking, coba lagi.'));
    },
  });

  const updateStatus = (id: string, status: BookingStatus) => {
    statusMutation.mutate({ id, status });
  };

  const timelineHours = Array.from(
    { length: TIMELINE_TOTAL_HOURS + 1 },
    (_, i) => `${(TIMELINE_START_HOUR + i).toString().padStart(2, '0')}:00`
  );

  const timeToPercent = (waktu: string): number => {
    const [h, m] = waktu.split(':').map(Number);
    return ((h - TIMELINE_START_HOUR) + m / 60) / TIMELINE_TOTAL_HOURS * 100;
  };

  const renderStatusBadge = (status: BookingStatus) => {
    const base = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border inline-block whitespace-nowrap rounded-none';
    switch (status) {
      case 'confirmed': return <span className={`${base} bg-blue-50  border-blue-200  text-blue-600`}>Confirmed</span>;
      case 'seated':    return <span className={`${base} bg-green-50 border-green-200 text-green-600`}>Seated</span>;
      case 'completed': return <span className={`${base} bg-gray-50  border-gray-200  text-gray-500`}>Completed</span>;
      case 'no_show':   return <span className={`${base} bg-red-50   border-red-200   text-red-600`}>No-Show</span>;
      case 'cancelled': return <span className={`${base} bg-gray-100 border-gray-200  text-gray-400 line-through`}>Cancelled</span>;
    }
  };

  // special_requests + histori customer (total_visits/no_show_count) — dipakai
  // di List view (table + card). Badge Note sekarang jadi button yang membuka
  // dialog berisi isi special_requests (sebelumnya cuma title/tooltip).
  const renderCustomerMeta = (booking: Booking) => {
    const hasHistory = booking.customer && (booking.customer.total_visits > 0 || booking.customer.no_show_count > 0);
    if (!booking.special_requests && !hasHistory) return null;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {booking.special_requests && (
          <button
            type="button"
            onClick={() => setNoteBooking(booking)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <MessageSquareText className="w-3 h-3" /> Note
          </button>
        )}
        {booking.customer && booking.customer.total_visits > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-blue-100 text-blue-500 bg-blue-50">
            <Repeat className="w-3 h-3" /> {booking.customer.total_visits}x visit
          </span>
        )}
        {booking.customer && booking.customer.no_show_count > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-red-100 text-red-500 bg-red-50">
            <AlertTriangle className="w-3 h-3" /> {booking.customer.no_show_count} no-show
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 md:gap-[2vw] overflow-hidden">

      <div className="w-full bg-white border border-black/5 p-4 md:p-[1.5vw] flex flex-col gap-3 md:gap-[1.2vw]">

        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 border border-black/10 px-3 py-2 bg-canvas flex-1 md:flex-none">
            <Calendar className="w-4 h-4 text-black/40 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-black focus:outline-none w-full md:w-auto"
            />
          </div>

          <div className="flex border border-black/10 p-0.5 bg-black/[0.02] shrink-0">
            {(['LIST', 'TIMELINE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === mode ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}
              >
                {mode === 'LIST'
                  ? <><TableProperties className="w-3.5 h-3.5" /><span className="hidden sm:inline">List</span></>
                  : <><Clock           className="w-3.5 h-3.5" /><span className="hidden sm:inline">Timeline</span></>
                }
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-[2vw] w-full">
          <div className="relative flex items-center flex-1 w-full">
            <Search className="w-4 h-4 text-black/30 absolute left-0" />
            <input
              type="text"
              placeholder="CARI NAMA / HP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent border-b border-black/10 focus:border-black pl-6 pb-2 text-sm font-medium uppercase tracking-wide placeholder:text-black/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-[1.5vw] shrink-0 md:min-w-[25vw]">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ALL' | BookingStatus)}>
              <SelectTrigger className="w-full md:w-[12vw] border-0 border-b border-black/10 rounded-none shadow-none px-0 pb-2 text-xs font-bold uppercase focus:ring-0 focus:border-black bg-transparent h-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-black/30 md:hidden" />
                  <SelectValue placeholder="STATUS" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-none font-bold uppercase">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="seated">Seated</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No-Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={(val) => setAreaFilter(val as 'ALL' | Area)}>
              <SelectTrigger className="w-full md:w-[10vw] border-0 border-b border-black/10 rounded-none shadow-none px-0 pb-2 text-xs font-bold uppercase focus:ring-0 focus:border-black bg-transparent h-auto">
                <SelectValue placeholder="AREAS" />
              </SelectTrigger>
              <SelectContent className="rounded-none font-bold uppercase">
                <SelectItem value="ALL">All Areas</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {viewMode === 'LIST' ? (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {bookings.length === 0 && (
              <div className="bg-white border border-black/5 p-6 text-center text-sm text-black/30 font-medium uppercase tracking-wider">
                Tidak ada data
              </div>
            )}
            {bookings.map((b) => (
              <div key={b.id} className="bg-white border border-black/5 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-black leading-none">{b.booking_time}</span>
                    <span className="text-sm font-bold text-[#6E3A2F]">{b.table?.name ?? '—'}</span>
                  </div>
                  {renderStatusBadge(b.status)}
                </div>

                <div>
                  <p className="text-base font-bold text-black uppercase tracking-tight leading-none">{b.customer_name}</p>
                  <p className="text-xs text-black/40 font-medium mt-0.5">{b.customer_phone}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-black/50">
                    <Users className="w-3.5 h-3.5" />
                    <span>{b.party_size} PAX</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-black/50">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{b.table?.area ?? '—'}</span>
                  </div>
                </div>

                {renderCustomerMeta(b)}

                <div className="flex gap-1.5 pt-1 border-t border-black/5">
                  <button
                    onClick={() => updateStatus(b.id, 'seated')}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider text-green-600 border border-green-100 hover:bg-green-50 transition-colors"
                  >
                    <UserCheck className="w-3 h-3" /> Seated
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, 'no_show')}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <UserMinus className="w-3 h-3" /> No-show
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider text-black/50 border border-black/10 hover:bg-black/[0.02] transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, 'cancelled')}
                    className="flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <XSquare className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block w-full bg-white border border-black/5 overflow-x-auto shadow-sm">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.01]">
                  {['Waktu', 'Nama', 'HP', 'Jumlah', 'Meja', 'Area', 'Status', 'Aksi'].map((th) => (
                    <th key={th} className="px-[1.5vw] py-[1vw] text-[0.8vw] font-bold uppercase tracking-wider text-black/50">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-[1.5vw] py-[2vw] text-center text-[0.9vw] text-black/30 font-medium uppercase tracking-wider">
                      Tidak ada data
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                    <td className="px-[1.5vw] py-[1.2vw] text-[0.9vw] font-bold text-black">{b.booking_time}</td>
                    <td className="px-[1.5vw] py-[1.2vw]">
                      <span className="text-[0.9vw] font-bold text-black uppercase tracking-tight block">{b.customer_name}</span>
                      {renderCustomerMeta(b)}
                    </td>
                    <td className="px-[1.5vw] py-[1.2vw] text-[0.9vw] font-medium text-black/60">{b.customer_phone}</td>
                    <td className="px-[1.5vw] py-[1.2vw] text-[0.9vw] font-medium text-black">{b.party_size} PAX</td>
                    <td className="px-[1.5vw] py-[1.2vw] text-[0.9vw] font-bold text-[#6E3A2F]">{b.table?.name ?? '—'}</td>
                    <td className="px-[1.5vw] py-[1.2vw] text-[0.85vw] font-bold text-black/70 uppercase tracking-wider">{b.table?.area ?? '—'}</td>
                    <td className="px-[1.5vw] py-[1.2vw]">{renderStatusBadge(b.status)}</td>
                    <td className="px-[1.5vw] py-[1.2vw]">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-[0.3vw] text-black/40 hover:text-black transition-colors cursor-pointer flex items-center justify-center outline-none select-none">
                          <MoreVertical className="w-[1.1vw] h-[1.1vw]" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-[12vw] min-w-[160px] bg-white border border-black/10 shadow-xl rounded-sm p-0 flex flex-col overflow-hidden z-50">
                          <DropdownMenuItem
                            onClick={() => updateStatus(b.id, 'seated')}
                            className="w-full text-left px-[1vw] py-[0.6vw] text-[0.8vw] font-bold uppercase text-green-600 hover:bg-green-50 focus:bg-green-50 focus:text-green-600 flex items-center gap-[0.5vw] border-b border-black/5 cursor-pointer outline-none rounded-none"
                          >
                            <UserCheck className="w-[0.9vw] h-[0.9vw]" /> Mark Seated
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(b.id, 'completed')}
                            className="w-full text-left px-[1vw] py-[0.6vw] text-[0.8vw] font-bold uppercase text-black/60 hover:bg-black/[0.02] focus:bg-black/[0.02] focus:text-black/60 flex items-center gap-[0.5vw] border-b border-black/5 cursor-pointer outline-none rounded-none"
                          >
                            <CheckCircle2 className="w-[0.9vw] h-[0.9vw]" /> Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(b.id, 'no_show')}
                            className="w-full text-left px-[1vw] py-[0.6vw] text-[0.8vw] font-bold uppercase text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 flex items-center gap-[0.5vw] border-b border-black/5 cursor-pointer outline-none rounded-none"
                          >
                            <UserMinus className="w-[0.9vw] h-[0.9vw]" /> Mark No-Show
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(b.id, 'cancelled')}
                            className="w-full text-left px-[1vw] py-[0.6vw] text-[0.8vw] font-bold uppercase text-gray-400 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-400 flex items-center gap-[0.5vw] cursor-pointer outline-none rounded-none"
                          >
                            <XSquare className="w-[0.9vw] h-[0.9vw]" /> Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="w-full">

          <div className="flex flex-col gap-6 md:hidden px-1">
            {TIMELINE_AREAS.map((area) => {
              const areaBookings = bookings
                .filter(b => b.table?.area === area)
                .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

              if (areaFilter !== 'ALL' && areaFilter !== area) return null;

              return (
                <div key={area} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-black/50">{area} ZONE</h3>
                    <span className="text-[10px] font-bold bg-black/[0.03] px-2 py-0.5 border border-black/5 text-black/60">
                      {areaBookings.length} RESERVATION
                    </span>
                  </div>

                  {areaBookings.length === 0 ? (
                    <p className="text-[11px] font-bold uppercase text-black/20 py-2 pl-2">No active bookings for this zone</p>
                  ) : (
                    <div className="relative pl-6 flex flex-col gap-3">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-black/[0.06]" />

                      {areaBookings.map((b) => (
                        <div key={b.id} className="relative flex flex-col bg-white border border-black/5 p-3 gap-1.5">
                          <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-none bg-black border border-white" />

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-black">{b.booking_time}</span>
                              <span className="text-xs font-bold text-[#6E3A2F] bg-[#6E3A2F]/5 px-1.5 py-0.5">{b.table?.name ?? '—'}</span>
                            </div>
                            {renderStatusBadge(b.status)}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-black uppercase tracking-tight">{b.customer_name}</span>
                            <span className="text-[11px] text-black/40 font-medium">{b.customer_phone}</span>
                          </div>

                          <div className="text-[11px] text-black/60 font-bold uppercase tracking-wider">
                            Capacity: {b.party_size} PAX
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block w-full bg-white border border-black/5 p-[2vw] overflow-x-auto">
            <div className="min-w-[1100px] flex flex-col pr-24 relative">

              <div className="flex w-full">
                <div style={{ width: '70px', flexShrink: 0 }} />
                <div
                  className="flex-1"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${timelineHours.length}, 1fr)` }}
                >
                  {timelineHours.map((hour) => (
                    <div
                      key={hour}
                      className="text-[10px] font-bold text-black/40 uppercase tracking-tighter text-center pb-2 border-b border-black/10"
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              </div>

              {TIMELINE_AREAS.map((area) => {
                const areaBookings = bookings.filter(b => b.table?.area === area);
                if (areaFilter !== 'ALL' && areaFilter !== area) return null;

                return (
                  <div key={area} className="flex border-b border-black/5 last:border-b-0 w-full">

                    <div style={{ width: '70px', flexShrink: 0 }} className="flex items-center pr-2 py-4">
                      <span className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap">
                        {area}
                      </span>
                    </div>

                    <div className="flex-1 relative min-h-[95px]">

                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ display: 'grid', gridTemplateColumns: `repeat(${timelineHours.length}, 1fr)` }}
                        aria-hidden="true"
                      >
                        {timelineHours.map((hour) => (
                          <div key={hour} className="border-r border-black/[0.04] h-full last:border-none" />
                        ))}
                      </div>

                      {areaBookings.map((b) => {
                        const pct = timeToPercent(b.booking_time);
                        if (pct < 0 || pct > 100) return null;

                        return (
                          <div
                            key={b.id}
                            style={{
                              left: `${pct}%`,
                              top: '12px',
                              width: '150px'
                            }}
                            className="absolute bg-white border border-black/10 p-2.5 flex flex-col gap-1 hover:border-black hover:z-20 transition-all cursor-default shadow-sm rounded-none"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-xs font-bold text-black">{b.booking_time}</span>
                              <span className="text-[10px] font-bold text-[#6E3A2F] bg-[#6E3A2F]/5 px-1 py-0.5">{b.table?.name ?? '—'}</span>
                            </div>
                            <span className="text-[11px] font-bold text-black uppercase truncate tracking-tight">
                              {b.customer_name}
                            </span>
                            <div className="flex justify-between items-center mt-0.5 w-full">
                              <span className="text-[10px] text-black/40 font-medium">{b.party_size} PAX</span>
                              {renderStatusBadge(b.status)}
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      )}

      <Dialog open={!!noteBooking} onOpenChange={(open) => !open && setNoteBooking(null)}>
        <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[420px] p-6 md:p-[2vw] bg-white flex flex-col gap-4 md:gap-[1.2vw]">
          <DialogHeader className="border-b border-black/5 pb-3 md:pb-[1vw]">
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-none">
              {noteBooking?.booking_time} · {noteBooking?.table?.name ?? '—'}
            </span>
            <DialogTitle className="text-lg md:text-[1.2vw] font-bold text-black uppercase mt-1 leading-none">
              Catatan — {noteBooking?.customer_name}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm md:text-[0.9vw] font-medium text-black/80 leading-relaxed whitespace-pre-wrap">
            {noteBooking?.special_requests}
          </p>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BookingsBoard;