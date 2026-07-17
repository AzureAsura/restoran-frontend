'use client';

import { useState } from 'react';
import {
  CalendarDays,
  DollarSign,
  Receipt as ReceiptIcon,
  TrendingUp,
  TrendingDown,
  Percent,
  UserX,
  PieChart,
  Clock,
  ChefHat,
  Link2,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ReceiptDialog } from '@/components/admin/pos/Receipt';
import {
  menuFinancialsQueryOptions,
  reservationAnalyticsQueryOptions,
  revenueReportQueryOptions,
} from '@/lib/queries/analytics';
import {
  groupOrdersByPaymentGroup,
  orderBillQueryOptions,
  paidOrderRangeFromPeriod,
  paidOrdersQueryOptions,
} from '@/lib/queries/orders';
import { formatUsd } from '@/lib/utils';
import type { OrderBill, RevenuePeriod } from '@/types/api';

interface FinanceBoardProps {
  initialPeriod: RevenuePeriod;
  initialDate: string;
}

function NoData() {
  return (
    <div className="w-full h-full min-h-[20vw] md:min-h-[8vw] flex items-center justify-center text-[2.8vw] md:text-[0.8vw] font-bold text-black/30 uppercase tracking-wider">
      No data for this period
    </div>
  );
}

const PAGE_LIMIT = 20;

export default function FinanceBoard({ initialPeriod, initialDate }: FinanceBoardProps) {
  const [period, setPeriod] = useState<RevenuePeriod>(initialPeriod);
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [receiptPage, setReceiptPage] = useState(1);
  const [menuSort, setMenuSort] = useState<'best' | 'worst'>('best');
  const [receiptBills, setReceiptBills] = useState<OrderBill[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const queryClient = useQueryClient();

  const handlePeriodChange = (next: RevenuePeriod) => {
    setPeriod(next);
    setReceiptPage(1);
  };

  const handleAnchorChange = (next: string) => {
    setAnchorDate(next);
    setReceiptPage(1);
  };

  const { data: revenue } = useSuspenseQuery(revenueReportQueryOptions(period, anchorDate));
  const { data: reservations } = useSuspenseQuery(reservationAnalyticsQueryOptions(period, anchorDate));
  const { data: menuFinancials } = useSuspenseQuery(menuFinancialsQueryOptions(period, anchorDate));

  const { paid_from, paid_to } = paidOrderRangeFromPeriod(revenue.range);
  const { data: paidOrdersResult } = useSuspenseQuery(
    paidOrdersQueryOptions({ paid_from, paid_to, page: receiptPage, limit: PAGE_LIMIT })
  );
  const orderGroups = groupOrdersByPaymentGroup(paidOrdersResult.data);

  const reprintMutation = useMutation({
    mutationFn: (orderIds: string[]) =>
      Promise.all(orderIds.map((id) => queryClient.fetchQuery(orderBillQueryOptions(id)))),
    onSuccess: (bills) => {
      setReceiptBills(bills);
      setReceiptOpen(true);
    },
    onError: () => {
      toast.error('Gagal memuat struk, coba lagi.');
    },
  });

  const hasRevenueSeries = revenue.series.some((entry) => entry.revenue > 0);
  const hasHourlyRevenue = revenue.by_hour.some((entry) => entry.revenue > 0);
  const growthPercent = revenue.previous_period.growth_percent;
  const sortedMenuItems =
    menuSort === 'best' ? menuFinancials.items : [...menuFinancials.items].reverse();

  return (
    <div className="w-full flex flex-col gap-[4vw] md:gap-[2vw] bg-[#F9F9F9] select-none text-black font-sans pb-[6vw] md:pb-[2vw]">

      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-black/5 pb-[2vw] md:pb-[1vw]">
        <div className="flex flex-col">
          <span className="text-[2.5vw] md:text-[0.68vw] font-bold text-black/40 uppercase tracking-widest leading-none">Financials</span>
          <h1 className="text-[5.5vw] md:text-[1.45vw] font-black uppercase tracking-tight text-black leading-none mt-[0.2vw]">
            Revenue Statement
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex border border-black/10 p-0.5 bg-black/[0.01] w-full sm:w-auto">
            {(['week', 'month', 'year'] as RevenuePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`flex-1 sm:flex-none px-[4vw] md:px-[1.2vw] py-[2vw] md:py-1.5 text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                  period === p ? 'bg-black text-white' : 'text-black/40 hover:text-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-black/10 p-[2vw] md:p-[0.5vw] w-full sm:w-auto shrink-0">
            <CalendarDays className="w-[4vw] md:w-[1vw] h-[4vw] md:h-[1vw] text-black/40" />
            <input
              type="date"
              value={anchorDate}
              onChange={(e) => handleAnchorChange(e.target.value)}
              className="text-[3.2vw] md:text-[0.85vw] font-bold uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-[3vw] md:gap-[1vw]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[2vw] md:gap-[0.8vw]">
          <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[26vw] md:h-[8.2vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw] leading-none">
              <DollarSign className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Total Revenue
            </span>
            <span className="text-[6.2vw] md:text-[1.85vw] font-black text-[#6E3A2F] leading-none tracking-tight">
              {revenue.summary.total_revenue_formatted}
            </span>
            <span
              className={`text-[2.2vw] md:text-[0.65vw] font-black uppercase tracking-wide flex items-center gap-1 ${
                growthPercent === null ? 'text-black/30' : growthPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {growthPercent === null ? (
                'N/A vs Periode Sebelumnya'
              ) : (
                <>
                  {growthPercent >= 0 ? (
                    <TrendingUp className="w-[2vw] md:w-[0.65vw] h-[2vw] md:h-[0.65vw]" />
                  ) : (
                    <TrendingDown className="w-[2vw] md:w-[0.65vw] h-[2vw] md:h-[0.65vw]" />
                  )}
                  {Math.abs(growthPercent)}% vs Periode Sebelumnya
                </>
              )}
            </span>
          </div>

          <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[26vw] md:h-[8.2vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw] leading-none">
              <ReceiptIcon className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Jumlah Transaksi
            </span>
            <span className="text-[6.2vw] md:text-[1.85vw] font-black text-black leading-none tracking-tight">
              {revenue.summary.order_count} TXS
            </span>
          </div>

          <div className="border border-black/5 bg-white p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[26vw] md:h-[8.2vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw] leading-none">
              <TrendingUp className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Rata-Rata Per Transaksi
            </span>
            <span className="text-[6.2vw] md:text-[1.85vw] font-black text-black leading-none tracking-tight">
              {revenue.summary.avg_order_value_formatted}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[3vw] md:gap-[1vw]">
          <div className="lg:col-span-8 border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[2vw] md:gap-[1vw] rounded-none">
            <div className="flex flex-col">
              <h3 className="text-[3.8vw] md:text-[1.05vw] font-black uppercase tracking-tight text-black leading-none">
                Revenue Per Period Performance
              </h3>
              <span className="text-[2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wider mt-1">
                {period === 'year' ? 'Monthly Gross Aggregation' : 'Daily Gross Aggregation'}
              </span>
            </div>

            <div className="w-full h-[60vw] md:h-[18vw] text-[2.5vw] md:text-[0.7vw] font-bold">
              {hasRevenueSeries ? (
                <ResponsiveContainer width="100%" height="100%">
                  {period === 'year' ? (
                    <LineChart data={revenue.series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                      <XAxis dataKey="label" stroke="#A3A3A3" tickLine={false} axisLine={false} />
                      <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}
                        itemStyle={{ color: '#6E3A2F', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#6E3A2F" strokeWidth={2.5} dot={{ r: 3, fill: '#000' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={revenue.series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                      <XAxis dataKey="label" stroke="#A3A3A3" tickLine={false} axisLine={false} />
                      <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}
                        itemStyle={{ color: '#000', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="revenue" fill="#000000" radius={0} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </div>
          </div>

          <div className="lg:col-span-4 border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[2vw] md:gap-[1vw] rounded-none">
            <div className="flex flex-col">
              <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
                <PieChart className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Breakdown
              </span>
              <h3 className="text-[3.8vw] md:text-[1vw] font-black uppercase tracking-tight text-black">
                Revenue Per Category
              </h3>
            </div>

            {revenue.by_category.length === 0 ? (
              <NoData />
            ) : (
              <div className="flex flex-col border border-black/5">
                {revenue.by_category.map((category) => (
                  <div key={category.category_id} className="flex justify-between items-center p-[3vw] md:p-[0.8vw] border-b border-black/5 last:border-none bg-black/[0.01] hover:bg-black/[0.03] transition-colors">
                    <span className="text-[3.2vw] md:text-[0.85vw] font-bold text-black truncate uppercase tracking-tight">{category.category}</span>
                    <span className="text-[3.2vw] md:text-[0.85vw] font-black text-[#6E3A2F] shrink-0">{category.revenue_formatted}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[2vw] md:gap-[1vw] rounded-none">
          <div className="flex flex-col">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <Clock className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Operating Hours
            </span>
            <h3 className="text-[3.8vw] md:text-[1.05vw] font-black uppercase tracking-tight text-black leading-none">
              Revenue Per Hour (08:00 - 21:00)
            </h3>
          </div>

          <div className="w-full h-[45vw] md:h-[12vw] text-[2.5vw] md:text-[0.7vw] font-bold">
            {hasHourlyRevenue ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue.by_hour} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="hour" stroke="#A3A3A3" tickLine={false} axisLine={false} />
                  <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}
                    itemStyle={{ color: '#000', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="revenue" fill="#6E3A2F" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </div>

      <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[3vw] md:gap-[1vw] rounded-none">
        <div className="flex flex-col border-b border-black/5 pb-[2vw] md:pb-[0.8vw]">
          <h3 className="text-[3.8vw] md:text-[1.05vw] font-black uppercase tracking-tight text-black leading-none">
            Receipt Transaction History
          </h3>
          <span className="text-[2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wider mt-1">
            List order lunas dalam periode terpilih
          </span>
        </div>

        {orderGroups.length === 0 ? (
          <NoData />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.01]">
                  {['Waktu Bayar', 'Meja / Area', 'Status', 'Total Gross', 'Actions'].map((th) => (
                    <th key={th} className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderGroups.map((group) => {
                  const primary = group[0];
                  const groupTotal = group.reduce((sum, order) => sum + order.total, 0);
                  const groupIds = group.map((order) => order.id);
                  return (
                    <tr key={groupIds.join('-')} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                      <td className="px-[1.5vw] py-[1vw] text-[2.8vw] md:text-[0.82vw] font-medium text-black/60">
                        {primary.paid_at
                          ? new Date(primary.paid_at).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-bold text-black uppercase">
                        {primary.table.name} · {primary.table.area}
                      </td>
                      <td className="px-[1.5vw] py-[1vw]">
                        <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-green-200 bg-green-50 text-green-600 rounded-none">
                          Lunas
                        </span>
                      </td>
                      <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-black text-[#6E3A2F]">{formatUsd(groupTotal)}</td>
                      <td className="px-[1.5vw] py-[1vw]">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => reprintMutation.mutate(groupIds)}
                            disabled={reprintMutation.isPending}
                            className="p-1 border border-black/5 hover:border-black/30 bg-white text-black transition-all cursor-pointer disabled:opacity-40"
                            title="Lihat / Cetak Struk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reprintMutation.mutate(groupIds)}
                            disabled={reprintMutation.isPending}
                            className="p-1 border border-black/5 hover:border-black/30 bg-white text-black transition-all cursor-pointer disabled:opacity-40"
                            title="Cetak Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="w-full flex justify-between items-center border-t border-black/5 pt-4 mt-2">
          <span className="text-[2.4vw] md:text-[0.75vw] font-bold text-black/30 uppercase tracking-wider">
            Halaman {paidOrdersResult.pagination.page} dari {paidOrdersResult.pagination.total_pages} · {paidOrdersResult.pagination.total} Order Lunas
          </span>

          <div className="flex items-center border border-black/10 bg-black/[0.01] p-0.5">
            <button
              disabled={receiptPage === 1}
              onClick={() => setReceiptPage((prev) => Math.max(prev - 1, 1))}
              className="p-1.5 text-black/40 hover:text-black disabled:opacity-20 transition-colors cursor-pointer rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-black border-x border-black/5 min-w-[28px] text-center">
              {receiptPage}
            </span>
            <button
              disabled={receiptPage >= paidOrdersResult.pagination.total_pages}
              onClick={() => setReceiptPage((prev) => Math.min(prev + 1, paidOrdersResult.pagination.total_pages))}
              className="p-1.5 text-black/40 hover:text-black disabled:opacity-20 transition-colors cursor-pointer rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[3vw] md:gap-[1vw] rounded-none">
        <div className="flex flex-col border-b border-black/5 pb-[2vw] md:pb-[0.8vw]">
          <h3 className="text-[3.8vw] md:text-[1.05vw] font-black uppercase tracking-tight text-black leading-none">
            Reservation Insights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[2vw] md:gap-[0.8vw]">
          <div className="border border-black/5 bg-black/[0.01] p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.6vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw] leading-none">
              <Percent className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Avg Occupancy Rate
            </span>
            <span className="text-[6.2vw] md:text-[1.85vw] font-black text-black leading-none tracking-tight">
              {reservations.occupancy.avg_rate_percent}%
            </span>
          </div>

          <div className="border border-black/5 bg-black/[0.01] p-[4vw] md:p-[1.2vw] flex flex-col justify-between h-[24vw] md:h-[7.6vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw] leading-none">
              <UserX className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> No-Show Rate
            </span>
            <span className="text-[6.2vw] md:text-[1.85vw] font-black text-red-600 leading-none tracking-tight">
              {reservations.no_show.rate_percent}%
            </span>
            <span className="text-[2.2vw] md:text-[0.65vw] font-black uppercase tracking-wide text-black/40">
              {reservations.no_show.count} No-Show · Est. Loss {reservations.no_show.estimated_lost_revenue_formatted}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[3vw] md:gap-[1vw]">
          <div className="border border-black/5 p-[3vw] md:p-[1vw] flex flex-col gap-[1vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <Clock className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Popular Day of Week
            </span>
            <div className="w-full h-[40vw] md:h-[10vw] text-[2.5vw] md:text-[0.7vw] font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reservations.popular_times.by_day_of_week} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="day" stroke="#A3A3A3" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(0, 3).toUpperCase()} />
                  <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }} />
                  <Bar dataKey="booking_count" fill="#000000" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-black/5 p-[3vw] md:p-[1vw] flex flex-col gap-[1vw] rounded-none">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <Clock className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Popular Hour
            </span>
            <div className="w-full h-[40vw] md:h-[10vw] text-[2.5vw] md:text-[0.7vw] font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reservations.popular_times.by_hour} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="hour" stroke="#A3A3A3" tickLine={false} axisLine={false} />
                  <YAxis stroke="#A3A3A3" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }} />
                  <Bar dataKey="booking_count" fill="#6E3A2F" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border border-black/5 bg-white p-[4vw] md:p-[1.5vw] flex flex-col gap-[3vw] md:gap-[1vw] rounded-none">
        <div className="w-full flex justify-between items-end border-b border-black/5 pb-[2vw] md:pb-[0.8vw]">
          <div className="flex flex-col">
            <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
              <ChefHat className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Catalogue
            </span>
            <h3 className="text-[3.8vw] md:text-[1vw] font-black uppercase tracking-tight text-black">
              Menu Financial Performance
            </h3>
          </div>

          <div className="flex border border-black/10 p-[0.3vw] md:p-0.5 bg-black/[0.01]">
            <button
              onClick={() => setMenuSort('best')}
              className={`px-[3vw] md:px-[1.2vw] py-[1.5vw] md:py-1.5 text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                menuSort === 'best' ? 'bg-black text-white' : 'text-black/40 hover:text-black'
              }`}
            >
              Terlaris
            </button>
            <button
              onClick={() => setMenuSort('worst')}
              className={`px-[3vw] md:px-[1.2vw] py-[1.5vw] md:py-1.5 text-[2.6vw] md:text-[0.75vw] font-black tracking-widest uppercase transition-colors rounded-none cursor-pointer ${
                menuSort === 'worst' ? 'bg-black text-white' : 'text-black/40 hover:text-black'
              }`}
            >
              Jarang Dipesan
            </button>
          </div>
        </div>

        {sortedMenuItems.length === 0 ? (
          <NoData />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.01]">
                  <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40">Item Name</th>
                  <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40 text-right">Qty Sold</th>
                  <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedMenuItems.map((item) => (
                  <tr key={item.menu_item_id} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                    <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-bold text-black uppercase tracking-tight">{item.name}</td>
                    <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-black text-black text-right">{item.qty_sold}×</td>
                    <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-black text-[#6E3A2F] text-right">{item.revenue_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-[2vw] md:pt-[1vw] border-t border-black/5">
          <span className="text-[2.2vw] md:text-[0.65vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.4vw]">
            <Link2 className="w-[2.5vw] md:w-[0.7vw] h-[2.5vw] md:h-[0.7vw]" /> Cross-Sell — Top 10 Pasangan Item
          </span>

          {menuFinancials.cross_sell.length === 0 ? (
            <NoData />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.01]">
                    <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40">Pasangan Item</th>
                    <th className="px-[1.5vw] py-[1vw] text-[2.4vw] md:text-[0.75vw] font-black uppercase tracking-wider text-black/40 text-right">Frekuensi</th>
                  </tr>
                </thead>
                <tbody>
                  {menuFinancials.cross_sell.map((pair, i) => (
                    <tr key={i} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                      <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-bold text-black uppercase tracking-tight">
                        {pair.menu_item_a.name} + {pair.menu_item_b.name}
                      </td>
                      <td className="px-[1.5vw] py-[1vw] text-[3vw] md:text-[0.85vw] font-black text-black text-right">{pair.pair_count}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReceiptDialog bills={receiptBills} open={receiptOpen} onOpenChange={setReceiptOpen} />

    </div>
  );
}
