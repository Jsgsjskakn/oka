'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Clock,
  RotateCcw
} from 'lucide-react';

export default function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get('range') || '30d';
  const customFrom = searchParams.get('from');
  const customTo = searchParams.get('to');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Interactive Calendar State
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<string>(customFrom || '');
  const [selectedEndDate, setSelectedEndDate] = useState<string>(customTo || '');

  const presets = [
    { value: 'today', label: 'Today (Live 24h)' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last Quarter (90d)' },
  ];

  const handleSelectPreset = (range: string) => {
    const params = new URLSearchParams();
    params.set('range', range);
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!selectedStartDate || !selectedEndDate) {
      alert('Please pick both start and end dates');
      return;
    }
    const params = new URLSearchParams();
    params.set('from', selectedStartDate);
    params.set('to', selectedEndDate);
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  // Calendar Math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handleDayClick = (dayNum: number) => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = dayNum.toString().padStart(2, '0');
    const clickedDateStr = `${year}-${monthStr}-${dayStr}`;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(clickedDateStr);
      setSelectedEndDate('');
    } else {
      if (new Date(clickedDateStr) < new Date(selectedStartDate)) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(clickedDateStr);
      } else {
        setSelectedEndDate(clickedDateStr);
      }
    }
  };

  // Display label on trigger button
  const displayLabel = useMemo(() => {
    if (customFrom && customTo) {
      const f = new Date(customFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const t = new Date(customTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${f} – ${t}`;
    }
    const match = presets.find(p => p.value === currentRange);
    return match ? match.label : 'Last 30 Days';
  }, [currentRange, customFrom, customTo]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-zinc-900/90 to-zinc-950/90 hover:from-zinc-800 hover:to-zinc-900 border border-border-strong/80 hover:border-champagne/60 rounded-xl text-xs font-semibold text-zinc-100 outline-none transition-all shadow-lg shadow-black/40 hover:-translate-y-0.5"
      >
        <CalendarIcon className="w-4 h-4 text-champagne drop-shadow-[0_0_8px_rgba(201,168,76,0.4)]" />
        <span className="tracking-wide">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary/70 transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : ''}`} />
      </button>

      {/* Luxury Interactive Calendar Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-full mt-2 z-50 w-[330px] sm:w-[360px] bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-border-strong/90 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-bold text-text-primary tracking-wide">
                  Select Timeline
                </span>
              </div>

              <div className="flex items-center gap-1 bg-obsidian p-1 rounded-xl border border-border-subtle text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'presets' 
                      ? 'bg-elevated text-text-primary shadow-inner font-bold' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Quick Presets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'custom' 
                      ? 'bg-champagne text-zinc-950 font-bold shadow-md shadow-[#c9a84c]/20' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Custom Calendar
                </button>
              </div>
            </div>

            {/* View 1: Quick Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                {presets.map((preset) => {
                  const isSelected = !customFrom && currentRange === preset.value;

                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSelectPreset(preset.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-champagne/20 to-transparent text-platinum border border-border-subtle shadow-inner'
                          : 'text-text-secondary hover:bg-elevated/60 hover:text-text-primary border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                        <span>{preset.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-champagne" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View 2: Interactive Luxury Calendar */}
            {activeTab === 'custom' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Month Stepper Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-zinc-200 font-serif">
                    {monthNames[month]} {year}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month - 1, 1))}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month + 1, 1))}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-text-secondary/70">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const monthStr = (month + 1).toString().padStart(2, '0');
                    const dayStr = dayNum.toString().padStart(2, '0');
                    const thisDateStr = `${year}-${monthStr}-${dayStr}`;

                    const isStart = selectedStartDate === thisDateStr;
                    const isEnd = selectedEndDate === thisDateStr;
                    const isInRange = 
                      selectedStartDate && 
                      selectedEndDate && 
                      new Date(thisDateStr) > new Date(selectedStartDate) && 
                      new Date(thisDateStr) < new Date(selectedEndDate);

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => handleDayClick(dayNum)}
                        className={`h-8 rounded-xl text-xs font-semibold transition-all flex items-center justify-center ${
                          isStart || isEnd
                            ? 'bg-gradient-to-r from-champagne to-platinum text-zinc-950 font-bold shadow-md shadow-[#c9a84c]/30 scale-105'
                            : isInRange
                            ? 'bg-champagne/20 text-platinum rounded-none'
                            : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                {/* Range Feedback Bar */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex-1 truncate bg-obsidian p-2 rounded-xl border border-border-subtle text-text-secondary">
                    {selectedStartDate ? selectedStartDate : 'Start Date'}
                    <span className="text-champagne mx-1">→</span>
                    {selectedEndDate ? selectedEndDate : 'End Date'}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setSelectedStartDate(''); setSelectedEndDate(''); }}
                    title="Reset selection"
                    className="p-2 text-text-secondary hover:text-text-primary bg-obsidian border border-border-subtle rounded-xl hover:bg-elevated transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  disabled={!selectedStartDate || !selectedEndDate}
                  onClick={handleApplyCustomRange}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#c9a84c]/20 disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Date Range</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}



