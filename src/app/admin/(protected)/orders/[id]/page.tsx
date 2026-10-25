import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  Receipt, 
  User, 
  UtensilsCrossed, 
  Phone, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { getOrderById } from '@/lib/services/order.service';

export const metadata = {
  title: 'Order Details | Admin | The Golden Oak',
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? 'unknown';
  
  const config: Record<string, { bg: string; text: string; border: string; shadow: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-warning',
      border: 'border-amber-500/25',
      shadow: 'shadow-amber-500/10',
      dot: 'bg-amber-400 animate-pulse',
    },
    confirmed: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/25',
      shadow: 'shadow-blue-500/10',
      dot: 'bg-blue-400',
    },
    preparing: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/25',
      shadow: 'shadow-orange-500/10',
      dot: 'bg-orange-400 animate-pulse',
    },
    ready: {
      bg: 'bg-platinum/5',
      text: 'text-platinum',
      border: 'border-cyan-500/25',
      shadow: 'shadow-cyan-500/10',
      dot: 'bg-cyan-400 animate-pulse',
    },
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-success',
      border: 'border-emerald-500/25',
      shadow: 'shadow-emerald-500/10',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
    },
    delivered: {
      bg: 'bg-emerald-500/10',
      text: 'text-success',
      border: 'border-emerald-500/25',
      shadow: 'shadow-emerald-500/10',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
    },
    cancelled: {
      bg: 'bg-rose-500/10',
      text: 'text-danger',
      border: 'border-rose-500/25',
      shadow: 'shadow-rose-500/10',
      dot: 'bg-rose-400',
    },
  };

  const current = config[normalized] || {
    bg: 'bg-elevated/80',
    text: 'text-text-secondary',
    border: 'border-border-strong/50',
    shadow: 'shadow-black/10',
    dot: 'bg-zinc-400',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest border rounded-full shadow-sm backdrop-blur-sm ${current.bg} ${current.text} ${current.border} ${current.shadow}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      {status}
    </span>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);
  
  if (!order) {
    notFound();
  }

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Background Ambient Glow */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle/60">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/orders"
            className="group p-2.5 text-text-secondary hover:text-text-primary bg-surface/80 hover:bg-elevated rounded-xl border border-border-subtle hover:border-border-strong transition-all duration-300 shadow-md hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-serif text-text-primary flex items-center gap-2">
                Order <span className="text-champagne font-mono text-xl">#{order.id?.slice(0, 8) ?? 'N/A'}</span>
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-text-secondary text-xs mt-1 flex items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items Manifest */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-7 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
              <div className="w-9 h-9 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif text-text-primary tracking-wide">Ordered Items</h2>
                <p className="text-xs text-text-secondary">Kitchen manifest and preparation notes</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-text-secondary border-b border-border-subtle bg-obsidian/40">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Item & Specs</th>
                    <th className="py-3 px-4 font-semibold text-center">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                  {order.order_items?.map((item) => (
                    <tr key={item.id} className="group hover:bg-elevated/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-100 group-hover:text-platinum transition-colors">{item.dish_name}</div>
                        {item.size_name && (
                          <div className="inline-block text-[11px] font-medium text-text-secondary bg-elevated/80 px-2 py-0.5 rounded border border-border-strong/40 mt-1">
                            Size: {item.size_name}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div className="text-xs text-warning/90 italic mt-1 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-elevated text-zinc-200 text-xs">
                          x{item.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-text-secondary">{formatMoney(item.dish_price_paise)}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-zinc-100">{formatMoney(item.line_total_paise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
              <div className="w-8 h-8 rounded-xl bg-platinum/5 border border-cyan-500/20 flex items-center justify-center text-platinum">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-serif text-text-primary tracking-wide">Customer Profile</h2>
                <p className="text-[11px] text-text-secondary">Patron identification</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary/70">Name</span>
                <span className="text-zinc-200 font-semibold">{order.customer_name || 'Guest'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary/70">Phone</span>
                <span className="text-zinc-200 font-mono">{order.customer_phone || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary/70">Email</span>
                <span className="text-zinc-200">{order.customer_email || '—'}</span>
              </div>
              <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                <span className="text-text-secondary/70">Order Channel</span>
                <span className="capitalize font-semibold text-xs px-2.5 py-1 bg-elevated/80 border border-border-strong/50 rounded-lg text-platinum">
                  {order.order_type || 'dine-in'}
                  {order.order_type === 'dine-in' && order.table_id && ` · Table ${order.table_id}`}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Reconciled Bill Card */}
          <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-success">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-serif text-text-primary tracking-wide">Financial Settlement</h2>
                <p className="text-[11px] text-text-secondary">Calculated bill & taxes</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">{formatMoney(order.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Applicable GST Tax</span>
                <span className="font-mono">{formatMoney(order.tax_paise)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Staff Gratuity (Tip)</span>
                <span className="font-mono">{formatMoney(order.tip_paise)}</span>
              </div>
              
              <div className="pt-3 border-t border-border-subtle flex justify-between items-center text-text-primary font-bold text-sm">
                <span>Gross Reconciled Total</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 font-mono text-base font-black">
                  {formatMoney(order.total_paise)}
                </span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border-subtle space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary/70">Method</span>
                  <span className="font-mono uppercase text-[10px] font-bold px-2 py-0.5 bg-elevated border border-border-strong/60 rounded text-text-secondary">
                    {order.payment_method || 'DIGITAL/CASH'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary/70">Payment Status</span>
                  <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-success">
                    {order.payment_status || 'settled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
