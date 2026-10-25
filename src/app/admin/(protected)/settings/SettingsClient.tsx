'use client';

import { useState } from 'react';
import { 
  Sliders, 
  Receipt, 
  CalendarCheck, 
  Store, 
  Save, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Coins,
  Phone,
  Mail,
  UtensilsCrossed
} from 'lucide-react';
import { updateSettingAction } from './actions';

interface Props {
  initialSettings: Record<string, unknown>;
  restaurantId: string;
}

export default function AdminSettingsClient({ initialSettings, restaurantId }: Props) {
  const [settings, setSettings] = useState<Record<string, unknown>>(initialSettings);
  const [activeTab, setActiveTab] = useState<'operations' | 'finance' | 'reservations' | 'identity'>('operations');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successKeys, setSuccessKeys] = useState<Record<string, boolean>>({});

  const handleChange = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      const result = await updateSettingAction(key, settings[key]);
      if (result.error) throw new Error(result.error);
      
      setSuccessKeys(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSuccessKeys(prev => ({ ...prev, [key]: false }));
      }, 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save setting');
    } finally {
      setSavingKey(null);
    }
  };

  const tabs = [
    { id: 'operations', label: 'Operations & Kitchen', icon: Sliders, color: 'text-platinum', border: 'border-border-subtle' },
    { id: 'finance', label: 'Financial & GST Taxes', icon: Receipt, color: 'text-success', border: 'border-border-subtle' },
    { id: 'reservations', label: 'VIP Table Policy', icon: CalendarCheck, color: 'text-warning', border: 'border-border-subtle' },
    { id: 'identity', label: 'Brand & Concierge', icon: Store, color: 'text-platinum', border: 'border-border-subtle' },
  ];

  return (
    <div className="space-y-8">
      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                isActive
                  ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 text-text-primary border-zinc-600 shadow-lg shadow-black/40'
                  : 'bg-obsidian/60 text-text-secondary border-border-subtle hover:text-zinc-200 hover:border-border-strong'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-text-secondary/70'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Operations & Kitchen */}
      {activeTab === 'operations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Allow Customer Cancellation */}
          <div className="bg-obsidian/60 border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-platinum" />
                  <h3 className="text-sm font-semibold text-zinc-100">Customer Order Cancellation</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Allow patrons to cancel freshly submitted orders within the grace window.
                </p>
              </div>

              {/* Custom Futuristic Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.customer_cancellation_enabled)}
                  onChange={(e) => handleChange('customer_cancellation_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner" />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('customer_cancellation_enabled')}
                disabled={savingKey === 'customer_cancellation_enabled'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-text-primary rounded-xl text-xs font-semibold border border-border-strong/60 transition-all shadow-sm"
              >
                {successKeys['customer_cancellation_enabled'] ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-platinum" />
                )}
                <span>{savingKey === 'customer_cancellation_enabled' ? 'Saving...' : successKeys['customer_cancellation_enabled'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Cancellation Window */}
          <div className="bg-obsidian/60 border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-platinum" />
                  <h3 className="text-sm font-semibold text-zinc-100">Cancellation Window Buffer</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Maximum elapsed minutes after placement during which cancellation is accepted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Number(settings.cancellation_window_minutes ?? 10)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('cancellation_window_minutes', !isNaN(val) ? val : 10);
                  }}
                  className="w-24 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-text-primary focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-text-secondary font-mono">minutes</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('cancellation_window_minutes')}
                disabled={savingKey === 'cancellation_window_minutes'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-text-primary rounded-xl text-xs font-semibold border border-border-strong/60 transition-all shadow-sm"
              >
                {successKeys['cancellation_window_minutes'] ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-platinum" />
                )}
                <span>{savingKey === 'cancellation_window_minutes' ? 'Saving...' : successKeys['cancellation_window_minutes'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Auto-Confirm Orders */}
          <div className="bg-obsidian/60 border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-platinum" />
                  <h3 className="text-sm font-semibold text-zinc-100">Auto-Confirm Digital Tickets</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Instantly forward digital table orders to kitchen queue without requiring manual admin approval.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.auto_confirm_orders ?? true)}
                  onChange={(e) => handleChange('auto_confirm_orders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner" />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('auto_confirm_orders')}
                disabled={savingKey === 'auto_confirm_orders'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-text-primary rounded-xl text-xs font-semibold border border-border-strong/60 transition-all shadow-sm"
              >
                {successKeys['auto_confirm_orders'] ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-platinum" />
                )}
                <span>{savingKey === 'auto_confirm_orders' ? 'Saving...' : successKeys['auto_confirm_orders'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial & GST Taxes */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Tax Rate (GST) */}
          <div className="bg-obsidian/60 border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-semibold text-zinc-100">Applicable GST Tax Rate</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Statutory tax percentage automatically calculated on all food order subtotals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={Number(settings.tax_rate_percent ?? 5)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleChange('tax_rate_percent', !isNaN(val) ? val : 5);
                  }}
                  className="w-24 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-success focus:outline-none focus:border-emerald-400"
                />
                <span className="text-xs text-success font-mono font-bold">% GST</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('tax_rate_percent')}
                disabled={savingKey === 'tax_rate_percent'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {successKeys['tax_rate_percent'] ? (
                  <Check className="w-3.5 h-3.5 text-text-primary" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-text-primary" />
                )}
                <span>{savingKey === 'tax_rate_percent' ? 'Saving...' : successKeys['tax_rate_percent'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Advance Booking Fee */}
          <div className="bg-obsidian/60 border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-semibold text-zinc-100">Advance Table Deposit (₹)</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Required advance payment in rupees to confirm VIP table seating reservations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-success font-mono font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={Number(settings.advance_booking_amount_paise ?? 50000) / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleChange('advance_booking_amount_paise', !isNaN(val) ? val * 100 : 50000);
                  }}
                  className="w-28 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-text-primary focus:outline-none focus:border-emerald-400"
                />
                <span className="text-xs text-text-secondary font-mono">INR</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('advance_booking_amount_paise')}
                disabled={savingKey === 'advance_booking_amount_paise'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {successKeys['advance_booking_amount_paise'] ? (
                  <Check className="w-3.5 h-3.5 text-text-primary" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-text-primary" />
                )}
                <span>{savingKey === 'advance_booking_amount_paise' ? 'Saving...' : successKeys['advance_booking_amount_paise'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Tip Presets */}
          <div className="bg-obsidian/60 border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-semibold text-zinc-100">Checkout Tip Presets</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Quick-select gratuity percentage buttons presented to guests during digital checkout.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={String(settings.tip_presets_percent ?? '10,15,20')}
                  onChange={(e) => handleChange('tip_presets_percent', e.target.value)}
                  placeholder="10,15,20"
                  className="w-36 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-text-primary focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('tip_presets_percent')}
                disabled={savingKey === 'tip_presets_percent'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {successKeys['tip_presets_percent'] ? (
                  <Check className="w-3.5 h-3.5 text-text-primary" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-text-primary" />
                )}
                <span>{savingKey === 'tip_presets_percent' ? 'Saving...' : successKeys['tip_presets_percent'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: VIP Table Policy */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Table Hold Window */}
          <div className="bg-obsidian/60 border border-amber-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <h3 className="text-sm font-semibold text-zinc-100">Table Reservation Hold Duration</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Minutes a booked table is held after scheduled reservation time before auto-releasing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={Number(settings.table_hold_time_mins ?? 20)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('table_hold_time_mins', !isNaN(val) ? val : 20);
                  }}
                  className="w-24 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-warning focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-warning/80 font-mono">mins</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('table_hold_time_mins')}
                disabled={savingKey === 'table_hold_time_mins'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {successKeys['table_hold_time_mins'] ? (
                  <Check className="w-3.5 h-3.5 text-text-primary" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-text-primary" />
                )}
                <span>{savingKey === 'table_hold_time_mins' ? 'Saving...' : successKeys['table_hold_time_mins'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Maximum Booking Party Size */}
          <div className="bg-obsidian/60 border border-amber-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-warning" />
                  <h3 className="text-sm font-semibold text-zinc-100">Max Online Party Headcount</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Maximum guest seats allowed per single direct booking before requiring manager phone approval.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={Number(settings.max_booking_party_size ?? 12)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('max_booking_party_size', !isNaN(val) ? val : 12);
                  }}
                  className="w-24 px-3 py-1.5 bg-surface border border-border-strong rounded-xl text-sm font-mono text-center text-warning focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-warning/80 font-mono">Guests</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('max_booking_party_size')}
                disabled={savingKey === 'max_booking_party_size'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                {successKeys['max_booking_party_size'] ? (
                  <Check className="w-3.5 h-3.5 text-text-primary" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-text-primary" />
                )}
                <span>{savingKey === 'max_booking_party_size' ? 'Saving...' : successKeys['max_booking_party_size'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Brand & Concierge */}
      {activeTab === 'identity' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Restaurant Tagline */}
          <div className="bg-obsidian/60 border border-champagne/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-champagne" />
                <h3 className="text-sm font-semibold text-zinc-100">Restaurant Signature Tagline</h3>
              </div>
              <p className="text-xs text-text-secondary">
                Headline slogan displayed on guest receipts, digital tickets, and header meta.
              </p>
            </div>

            <input
              type="text"
              value={String(settings.restaurant_tagline ?? 'Modern Indian Fine Dining & Craft Culinary Experience')}
              onChange={(e) => handleChange('restaurant_tagline', e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-champagne"
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('restaurant_tagline')}
                disabled={savingKey === 'restaurant_tagline'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {successKeys['restaurant_tagline'] ? (
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-zinc-950" />
                )}
                <span>{savingKey === 'restaurant_tagline' ? 'Saving...' : successKeys['restaurant_tagline'] ? 'Updated' : 'Apply'}</span>
              </button>
            </div>
          </div>

          {/* Support Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-obsidian/60 border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-champagne" />
                  <h3 className="text-sm font-semibold text-zinc-100">Concierge Desk Phone</h3>
                </div>
                <p className="text-xs text-text-secondary">Direct patron inquiry line</p>
              </div>

              <input
                type="text"
                value={String(settings.support_phone ?? '+91 99907 74565')}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border-strong rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-champagne"
              />

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleSave('support_phone')}
                  disabled={savingKey === 'support_phone'}
                  className="px-4 py-1.5 bg-elevated hover:bg-zinc-700 text-text-primary rounded-xl text-xs font-semibold transition-all"
                >
                  Save Phone
                </button>
              </div>
            </div>

            <div className="bg-obsidian/60 border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-champagne" />
                  <h3 className="text-sm font-semibold text-zinc-100">Guest Support Email</h3>
                </div>
                <p className="text-xs text-text-secondary">Reservation & feedback desk</p>
              </div>

              <input
                type="email"
                value={String(settings.support_email ?? 'contact@thegoldenoak.in')}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border-strong rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-champagne"
              />

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleSave('support_email')}
                  disabled={savingKey === 'support_email'}
                  className="px-4 py-1.5 bg-elevated hover:bg-zinc-700 text-text-primary rounded-xl text-xs font-semibold transition-all"
                >
                  Save Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

