'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Users,
  DollarSign,
  Percent,
  UserX,
  BarChart3,
  Award,
  ChefHat,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
  analyticsOverviewQueryOptions,
  analyticsTimelineQueryOptions,
  menuPerformanceQueryOptions,
  type MenuPerformanceRange,
} from '@/lib/queries/analytics';
import { formatUsd } from '@/lib/utils';

interface DashboardBoardProps {
  initialDate: string;
}

function NoData() {
  return (
    <div className="w-full h-full min-h-[20vw] md:min-h-[8vw] flex items-center justify-center text-[2.8vw] md:text-[0.8vw] font-bold text-black/30 uppercase tracking-wider">
      No data for this date
    </div>
  );
}

export default function DashboardBoard({ initialDate }: DashboardBoardProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [menuRange, setMenuRange] = useState<MenuPerformanceRange>('today');

  const { data: overview } = useSuspenseQuery(analyticsOverviewQueryOptions(selectedDate));
  const { data: timeline } = useSuspenseQuery(analyticsTimelineQueryOptions(selectedDate));
  const { data: menuPerformance } = useSuspenseQuery(menuPerformanceQueryOptions(menuRange));

  const hasTimelineData = timeline.some((entry) => entry.booking_count > 0);

  return (
    <div className="w-full flex flex-col gap-[4vw] md:gap-[2vw] bg-[#F9F9F9] select-none text-black font-sans pb-[6vw] md:pb-[2vw]">

      {/* ── HEADER & DATE PICKER CONTROL ── */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/5 pb-[2vw] md:pb-[1vw]">
        <div className="flex flex-col">
          <span className="text-[2.4vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-widest">Overview</span>
          <h1 className="text-[5.5vw] md:text-[1.5vw] font-black uppercase tracking-tight text-black leading-none mt-1">
            Executive Dashboard
          </h1>
        </div>

        {/* Kontrol Date Picker Utama */}
        <div className="flex items-center gap-2 bg-white border border-black/10 p-[1.5vw] md:p-[0.5vw] w-full sm:w-auto">
          <CalendarDays className="w-[4vw] md:w-[1vw] h-[4vw] md:h-[1vw] text-black/40" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[3.2vw] md:text-[0.85vw] font-bold uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer w-full sm:w-auto"
          />
        </div>
      </div>

      {/* ── STAT CARDS ROW (5 KARTU) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[2vw] md:gap-[0.8vw]">
        {/* Card 1: Total Bookings */}
        <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.5vw] rounded-none">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <CalendarDays className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Total Bookings
          </span>
          <span className="text-[6vw] md:text-[1.8vw] font-black text-black leading-none tracking-tight">
            {overview.total_bookings}
          </span>
        </div>

        {/* Card 2: Total Walk-ins */}
        <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.5vw] rounded-none">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <Users className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Total Walk-Ins
          </span>
          <span className="text-[6vw] md:text-[1.8vw] font-black text-black leading-none tracking-tight">
            {overview.total_walk_ins}
          </span>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.5vw] rounded-none">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <DollarSign className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Total Revenue
          </span>
          <span className="text-[6vw] md:text-[1.8vw] font-black text-[#6E3A2F] leading-none tracking-tight">
            {formatUsd(overview.total_revenue)}
          </span>
        </div>

        {/* Card 4: Occupancy Rate */}
        <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.5vw] rounded-none">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <Percent className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Occupancy Rate
          </span>
          <span className="text-[6vw] md:text-[1.8vw] font-black text-black leading-none tracking-tight">
            {overview.occupancy_rate}%
          </span>
        </div>

        {/* Card 5: No-Show Count */}
        <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.5vw] col-span-2 md:col-span-1 rounded-none">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <UserX className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> No-Show Count
          </span>
          <span className="text-[6vw] md:text-[1.8vw] font-black text-red-600 leading-none tracking-tight">
            {overview.no_show_count}
          </span>
        </div>
      </div>

      {/* ── VISUAL TIMELINE & TOP 5 ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[3vw] md:gap-[1vw]">

        {/* SECTION KIRI: Booking Timeline Bar Chart (8/12) */}
        <div className="lg:col-span-8 border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[2vw] md:gap-[1vw] rounded-none">
          <div className="flex flex-col">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <BarChart3 className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Analytics
            </span>
            <h3 className="text-[3.8vw] md:text-[1vw] font-black uppercase tracking-tight text-black">
              Booking Timeline (08:00 - 21:00)
            </h3>
          </div>

          <div className="w-full h-[60vw] md:h-[20vw] text-[2.5vw] md:text-[0.7vw] font-bold">
            {hasTimelineData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="hour" stroke="#A3A3A3" tickLine={false} axisLine={false} />
                  <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}
                    itemStyle={{ color: '#000', fontWeight: 'bold', textTransform: 'uppercase' }}
                    labelStyle={{ color: '#A3A3A3', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="booking_count" fill="#000000" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* SECTION KANAN: Top 5 Menu List (4/12) */}
        <div className="lg:col-span-4 border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col justify-between rounded-none">
          <div className="flex flex-col gap-[2vw] md:gap-[1vw]">
            <div className="flex flex-col">
              <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
                <Award className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Popularity
              </span>
              <h3 className="text-[3.8vw] md:text-[1vw] font-black uppercase tracking-tight text-black">
                Top 5 Menu Items
              </h3>
            </div>

            {overview.menu_top.length === 0 ? (
              <NoData />
            ) : (
              <div className="flex flex-col border border-black/5 split-y">
                {overview.menu_top.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-[3vw] md:p-[0.8vw] border-b border-black/5 last:border-none bg-black/[0.01] hover:bg-black/[0.03] transition-colors">
                    <div className="flex items-center gap-[2vw] md:gap-[0.6vw] min-w-0">
                      <span className="text-[3vw] md:text-[0.8vw] font-black text-black/30 w-[4vw] md:w-[1vw]">0{index + 1}</span>
                      <span className="text-[3.2vw] md:text-[0.85vw] font-bold text-black truncate uppercase tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-[3.2vw] md:text-[0.85vw] font-black text-[#6E3A2F] shrink-0">{item.order_count}× ordered</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MENU PERFORMANCE SECTION (FILTER TERPISAH) ── */}
      <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[3vw] md:gap-[1vw] rounded-none">
        <div className="w-full flex justify-between items-end border-b border-black/5 pb-[2vw] md:pb-[0.8vw]">
          <div className="flex flex-col">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <ChefHat className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Catalogue
            </span>
            <h3 className="text-[3.8vw] md:text-[1vw] font-black uppercase tracking-tight text-black">
              Complete Menu Performance
            </h3>
          </div>

          {/* Independent Toggle: Today / Week */}
          <div className="flex border border-black/10 p-[0.3vw] md:p-0.5 bg-black/[0.01]">
            <button
              onClick={() => setMenuRange('today')}
              className={`px-[3vw] md:px-[1.2vw] py-[1.5vw] md:py-1.5 text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                menuRange === 'today' ? 'bg-black text-white' : 'text-black/40 hover:text-black'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setMenuRange('week')}
              className={`px-[3vw] md:px-[1.2vw] py-[1.5vw] md:py-1.5 text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                menuRange === 'week' ? 'bg-black text-white' : 'text-black/40 hover:text-black'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* List Data Performa Menu Keseluruhan */}
        {menuPerformance.length === 0 ? (
          <NoData />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.01]">
                  <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40">Item Name</th>
                  <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {menuPerformance.map((item) => (
                  <tr key={item.menu_item_id} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                    <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-bold text-black uppercase tracking-tight">{item.name}</td>
                    <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-black text-black text-right">{item.order_count}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
