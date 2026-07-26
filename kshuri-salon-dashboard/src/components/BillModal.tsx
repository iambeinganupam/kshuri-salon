// ─────────────────────────────────────────────────────────────────────────────
// BillModal — Customer-facing printable invoice
// ─────────────────────────────────────────────────────────────────────────────
// Renders the structured bill returned by GET /finance/transactions/:id/bill.
// Same shape regardless of customer source (walk-in, subscriber, Estylr).
//
// Two delivery modes:
//   1. Print          — hides app chrome via @media print, calls window.print().
//   2. Future channels — `Email` / `WhatsApp` buttons render only when the
//                        customer is registered (has email / phone). Both are
//                        wired with toast placeholders today; they POST to
//                        /finance/transactions/:id/bill/send when those
//                        channels ship in the SMS / Email service work.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBill } from '@kshuri/api-client/hooks';
import { Printer, Mail, MessageCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillModalProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmtINR(n: number) {
  return `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function BillModal({ transactionId, open, onOpenChange }: BillModalProps) {
  const { data: bill, isLoading, error } = useBill(transactionId ?? '');
  const printRef = useRef<HTMLDivElement>(null);

  // Inject a one-time @media print stylesheet so Ctrl+P / Print button hides
  // app chrome and renders the receipt as a clean A4/letter page. Idempotent.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('bill-print-style')) return;
    const style = document.createElement('style');
    style.id = 'bill-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #bill-print-area, #bill-print-area * { visibility: visible !important; }
        #bill-print-area {
          position: absolute !important;
          left: 0; top: 0; width: 100%;
          background: white !important; color: black !important;
          padding: 24px !important;
        }
        #bill-print-area .no-print { display: none !important; }
        #bill-print-area * {
          color: black !important;
          background: white !important;
          border-color: #d0d0d0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handlePrint = () => window.print();

  const handleEmail = () => {
    toast.info('Email delivery is coming soon. Print or hand the bill for now.');
  };

  const handleWhatsApp = () => {
    if (!bill?.customer.phone) return;
    // Placeholder: until the SMS/WhatsApp channel ships, open WhatsApp Web
    // with a pre-filled bill summary. Easy to swap for a server send-bill call.
    const msg = encodeURIComponent(
      `Hi ${bill.customer.name}, your bill ${bill.bill_number} from ${bill.business.name ?? 'us'} is ${fmtINR(bill.total)}. Thank you!`,
    );
    const phone = bill.customer.phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 max-h-[92vh] overflow-y-auto">
        <VisuallyHidden.Root>
          <DialogTitle>Invoice {bill?.bill_number ?? ''}</DialogTitle>
          <DialogDescription>
            Bill for {bill?.customer.name ?? 'customer'} from {bill?.business.name ?? 'salon'}.
          </DialogDescription>
        </VisuallyHidden.Root>
        {/* Action bar — hidden in print */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-border/30 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide">Invoice</h2>
            {bill && <span className="text-[11px] text-muted-foreground tabular-nums">{bill.bill_number}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {bill?.customer.is_registered && bill.customer.email && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-xs" onClick={handleEmail}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            )}
            {bill?.customer.phone && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-xs" onClick={handleWhatsApp}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </Button>
            )}
            <Button size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={handlePrint} disabled={!bill}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => onOpenChange(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div id="bill-print-area" ref={printRef} className="px-6 py-5">
          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading bill…
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center text-sm text-destructive">
              Could not load this bill. Please close and try again.
            </div>
          )}

          {bill && (
            <>
              {/* Business header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  {bill.business.logo_url && (
                    <img
                      src={bill.business.logo_url}
                      alt={bill.business.name ?? 'logo'}
                      className="h-12 w-12 rounded-lg object-cover border border-border/40"
                    />
                  )}
                  <div>
                    <p className="font-serif text-lg font-bold leading-tight">
                      {bill.business.name ?? 'Salon'}
                    </p>
                    {bill.business.legal_name && bill.business.legal_name !== bill.business.name && (
                      <p className="text-[11px] text-muted-foreground leading-tight">{bill.business.legal_name}</p>
                    )}
                    {bill.business.address && (
                      <p className="text-[11px] text-muted-foreground leading-tight max-w-xs">{bill.business.address}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
                      {bill.business.phone && <span>📞 {bill.business.phone}</span>}
                      {bill.business.email && <span>✉ {bill.business.email}</span>}
                      {bill.business.gstin && <span>GSTIN: {bill.business.gstin}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Invoice</p>
                  <p className="font-mono text-sm font-semibold">{bill.bill_number}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDateTime(bill.issued_at)}</p>
                </div>
              </div>

              {/* Customer + appointment block */}
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Billed to</p>
                  <p className="text-sm font-semibold">{bill.customer.name}</p>
                  {bill.customer.phone && <p className="text-[11px] text-muted-foreground">{bill.customer.phone}</p>}
                  {bill.customer.email && <p className="text-[11px] text-muted-foreground">{bill.customer.email}</p>}
                  <p className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground capitalize">
                    {bill.customer.customer_type === 'walkin' ? 'Walk-in' : 'Registered customer'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Service date</p>
                  <p className="text-sm font-semibold">{fmtDateTime(bill.start_time)}</p>
                  {bill.booking_type && (
                    <p className="text-[10px] text-muted-foreground capitalize mt-0.5">via {bill.booking_type}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Line items */}
              <div className="py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left font-medium pb-2">Service</th>
                      <th className="text-right font-medium pb-2 w-20">Duration</th>
                      <th className="text-right font-medium pb-2 w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {bill.line_items.map((li) => (
                      <tr key={li.service_id} className="text-[13px]">
                        <td className="py-2.5">{li.service_name}</td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                          {li.duration_minutes} min
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{fmtINR(li.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bill.appointment_notes && (
                  <p className="mt-3 text-[11px] text-muted-foreground italic">
                    Note: {bill.appointment_notes}
                  </p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="py-4 ml-auto max-w-[260px] space-y-1.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmtINR(bill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST @ {bill.tax_rate}%</span>
                  <span className="tabular-nums">{fmtINR(bill.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span className="tabular-nums font-serif">{fmtINR(bill.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Paid via</span>
                  <span className="capitalize">{bill.payment_method}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border/40 pt-3 mt-2 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Thank you for visiting{bill.business.name ? ` ${bill.business.name}` : ''}. We hope to see you again soon.
                </p>
                <p className="text-[9px] text-muted-foreground/70 mt-1">
                  This is a computer-generated invoice and does not require a signature.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
