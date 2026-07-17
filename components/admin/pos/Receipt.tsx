'use client';

import { useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatUsd } from '@/lib/utils';
import type { OrderBill } from '@/types/api';

interface ReceiptDialogProps {
  bills: OrderBill[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // true for the "Tandai Lunas & Cetak" flow — print fires automatically
  // once the dialog opens, instead of waiting for the manual button.
  autoPrint?: boolean;
}

// Renders 1+ OrderBill as a single combined struk (split-bill: cashier picks
// which orders on a table to merge into one receipt). Reused for both the
// POS checkout dialog and Riwayat Struk re-prints in /admin/finance.
export function ReceiptDialog({ bills, open, onOpenChange, autoPrint = false }: ReceiptDialogProps) {
  const hasAutoPrintedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasAutoPrintedRef.current = false;
      return;
    }
    if (autoPrint && !hasAutoPrintedRef.current && bills.length > 0) {
      hasAutoPrintedRef.current = true;
      window.print();
    }
  }, [open, autoPrint, bills]);

  if (bills.length === 0) return null;

  const { restaurant, table } = bills[0];
  const timestamp = bills[0].paid_at ?? bills[0].created_at;
  const isPaid = bills.every((bill) => bill.payment_status === 'paid');
  const items = bills.flatMap((bill) => bill.items);
  const subtotal = bills.reduce((sum, bill) => sum + bill.subtotal, 0);
  const tax = bills.reduce((sum, bill) => sum + bill.tax, 0);
  const serviceCharge = bills.reduce((sum, bill) => sum + bill.service_charge, 0);
  const total = bills.reduce((sum, bill) => sum + bill.total, 0);
  // Re-derived from the summed amounts (same principle as the backend bill
  // DTO) rather than reused from a single bill — stays correct even if
  // merged bills somehow carried different rates.
  const taxRatePercent = subtotal === 0 ? 0 : Math.round((tax / subtotal) * 100);
  const serviceChargeRatePercent = subtotal === 0 ? 0 : Math.round((serviceCharge / subtotal) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-black/10 w-[90%] sm:w-full sm:max-w-[400px] p-0 bg-white gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="border-b border-black/5 p-4 shrink-0">
          <DialogTitle className="text-sm font-black text-black uppercase tracking-widest">Struk</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          <div data-receipt-print className="p-5 flex flex-col gap-4 text-black font-sans">
            <div className="flex flex-col items-center text-center gap-0.5 pb-3 border-b border-dashed border-black/20">
              <span className="text-sm font-black uppercase tracking-wide">{restaurant.name}</span>
              {restaurant.address && <span className="text-[10px] text-black/60">{restaurant.address}</span>}
              {restaurant.phone && <span className="text-[10px] text-black/60">{restaurant.phone}</span>}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-black/60">
              <span>{table.name} · {table.area}</span>
              <span>
                {new Date(timestamp).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 py-3 border-y border-dashed border-black/20">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold uppercase text-black">
                      {item.qty}x {item.name}
                    </span>
                    {item.notes && <span className="text-[10px] text-black/40 italic">{item.notes}</span>}
                  </div>
                  <span className="font-bold text-black shrink-0">{item.line_total_formatted}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-black/60">
                <span className="uppercase">Subtotal</span>
                <span>{formatUsd(subtotal)}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span className="uppercase">Tax ({taxRatePercent}%)</span>
                <span>{formatUsd(tax)}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span className="uppercase">Service ({serviceChargeRatePercent}%)</span>
                <span>{formatUsd(serviceCharge)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-black border-t border-black/10 pt-2 mt-1">
                <span className="uppercase tracking-wide">Total</span>
                <span className="text-base text-[#6E3A2F]">{formatUsd(total)}</span>
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border ${
                  isPaid ? 'border-green-200 bg-green-50 text-green-600' : 'border-amber-200 bg-amber-50 text-amber-600'
                }`}
              >
                {isPaid ? 'Lunas' : 'Belum Dibayar'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 p-4 shrink-0">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-black/80 transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3" /> Cetak Struk
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReceiptDialog;
