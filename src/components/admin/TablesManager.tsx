'use client';

import { useState } from 'react';
import { type RestaurantTable, type TableStatus } from '@/lib/db/types';
import { updateTableStatus, createTable } from '@/app/admin/(protected)/tables/actions';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  Plus, 
  Copy, 
  ExternalLink, 
  Check, 
  X, 
  Layers, 
  Search,
  Utensils
} from 'lucide-react';

interface TablesManagerProps {
  initialTables: RestaurantTable[];
}

export function TablesManager({ initialTables }: TablesManagerProps) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [filter, setFilter] = useState<'all' | 'available' | 'booked' | 'unavailable' | '2-seats' | '4-seats' | '6+-seats'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);
  
  // QR & Share Modal state
  const [activeQrTable, setActiveQrTable] = useState<RestaurantTable | null>(null);
  const [copied, setCopied] = useState(false);

  // Add Table Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telemetry Metrics
  const totalTables = tables.length;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const bookedCount = tables.filter(t => t.status === 'booked').length;
  const totalSeats = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const occupancyRate = totalTables > 0 ? Math.round((bookedCount / totalTables) * 100) : 0;

  // Filtered Tables
  const filteredTables = tables.filter(t => {
    // Search query
    if (searchQuery.trim()) {
      const match = t.table_number.toString().includes(searchQuery.trim()) || `t${t.table_number}`.includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    
    // Status / Capacity filter
    if (filter === 'available') return t.status === 'available';
    if (filter === 'booked') return t.status === 'booked';
    if (filter === 'unavailable') return t.status === 'unavailable';
    if (filter === '2-seats') return t.capacity === 2;
    if (filter === '4-seats') return t.capacity === 4;
    if (filter === '6+-seats') return t.capacity >= 6;
    return true;
  });

  const handleStatusChange = async (tableId: string, nextStatus: TableStatus) => {
    setUpdatingTableId(tableId);
    
    // Optimistic Update
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: nextStatus } : t));

    try {
      const res = await updateTableStatus(tableId, nextStatus);
      if (res?.error) {
        // Revert on error
        setTables(initialTables);
        alert('Failed to update table status');
      }
    } catch (e) {
      console.error(e);
      setTables(initialTables);
    } finally {
      setUpdatingTableId(null);
    }
  };

  const handleCopyLink = (tableNum: number) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const tableUrl = `${origin}/menu?table=${tableNum}`;
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const num = parseInt(newTableNum);
      const cap = parseInt(newCapacity) || 4;
      
      const res = await createTable({
        table_number: num,
        capacity: cap,
        status: 'available'
      });

      if (res?.error) {
        alert(res.error);
      } else {
        // Optimistic addition
        const newEntry: RestaurantTable = {
          id: `temp-${Date.now()}`,
          restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
          table_number: num,
          capacity: cap,
          status: 'available',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTables(prev => [...prev, newEntry].sort((a, b) => a.table_number - b.table_number));
        setIsAddModalOpen(false);
        setNewTableNum('');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating table');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-emerald-500/10 text-success border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-3 h-3 text-success" />
              Live Dining Room Floor Plan
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-amber-200 drop-shadow-md">
              Tables Overview
            </h1>
            <p className="text-text-secondary text-sm tracking-wide">
              Real-time floor occupancy, seating capacity allocation, and digital QR menu dispatch.
            </p>
          </div>
        </div>

        {/* Action Button: Add Dining Table */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Dining Table</span>
          </button>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* 1. Total Tables */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle/80 p-5 rounded-2xl shadow-none hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Tables</span>
            <Layers className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalTables}</p>
        </div>

        {/* 2. Available Tables - Glowing Emerald Green */}
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-success/20 p-5 rounded-2xl shadow-none hover:border-emerald-400/60 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Ready & Available</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-baseline gap-2 mt-2 relative z-10">
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              {availableCount}
            </p>
            <span className="text-xs text-success/80 font-mono">
              ({totalTables > 0 ? Math.round((availableCount / totalTables) * 100) : 0}% Free)
            </span>
          </div>
        </div>

        {/* 3. Booked / Occupied */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-warning/20 p-5 rounded-2xl shadow-none hover:border-amber-400/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Occupied / Booked</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-black text-warning">{bookedCount}</p>
            <span className="text-xs text-warning/80 font-mono">({occupancyRate}% Occupied)</span>
          </div>
        </div>

        {/* 4. Total Guest Seating Capacity */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-platinum/20 p-5 rounded-2xl shadow-none hover:border-cyan-400/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Floor Capacity</span>
            <Users className="w-4 h-4 text-platinum" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-black text-platinum">{totalSeats}</p>
            <span className="text-xs text-platinum/80">Total Seats</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Tables (${totalTables})` },
            { id: 'available', label: `Available (${availableCount})` },
            { id: 'booked', label: `Booked (${bookedCount})` },
            { id: '2-seats', label: '2-Seats Cozy' },
            { id: '4-seats', label: '4-Seats Family' },
            { id: '6+-seats', label: '6+ Banquet' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-champagne to-platinum text-zinc-950 border-transparent shadow-lg shadow-[#c9a84c]/20'
                  : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter table #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-obsidian/80 border border-border-subtle rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50"
          />
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-16 text-center bg-surface/40 border border-dashed border-border-subtle rounded-2xl space-y-3">
          <Utensils className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-text-secondary font-medium text-sm">No tables found matching your filter</p>
          <button
            onClick={() => { setFilter('all'); setSearchQuery(''); }}
            className="text-xs text-champagne font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {filteredTables.map((table) => {
            const isUpdating = updatingTableId === table.id;
            const isAvail = table.status === 'available';
            const isBooked = table.status === 'booked';

            return (
              <div
                key={table.id}
                className={`group relative p-5 rounded-2xl flex flex-col justify-between min-h-[200px] transition-all duration-300 backdrop-blur-2xl shadow-xl shadow-black/40 border ${
                  isAvail
                    ? 'bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border-emerald-500/25 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                    : isBooked
                    ? 'bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border-amber-500/25 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                    : 'bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border-rose-500/25 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                }`}
              >
                {/* Header: Table ID & QR Action Button */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-serif font-black text-text-primary group-hover:text-platinum transition-colors">
                        T{table.table_number}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        isAvail ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : isBooked ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                      }`} />
                    </div>
                    <span className="text-[11px] font-mono text-text-secondary/70">
                      Table #{table.table_number < 10 ? `0${table.table_number}` : table.table_number}
                    </span>
                  </div>

                  {/* QR Code Trigger Button */}
                  <button
                    onClick={() => setActiveQrTable(table)}
                    title="View QR Code & Table Link"
                    className="p-2 text-text-secondary hover:text-text-primary bg-elevated/80 hover:bg-zinc-700 rounded-xl border border-border-strong/60 transition-all duration-200 hover:scale-105 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5 text-champagne" />
                  </button>
                </div>

                {/* Capacity Visualizer */}
                <div className="my-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Users className="w-3.5 h-3.5 text-platinum" />
                    <span className="font-semibold">{table.capacity} Guest Seats</span>
                  </div>
                  
                  {/* Seat Dots */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(table.capacity, 10) }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAvail ? 'bg-emerald-400/60' : isBooked ? 'bg-amber-400/60' : 'bg-zinc-600'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Luxury Status Switcher Dropdown */}
                <div className="pt-3 border-t border-border-subtle/80">
                  <TableStatusCustomDropdown
                    status={table.status}
                    disabled={isUpdating}
                    onChange={(nextStatus) => handleStatusChange(table.id, nextStatus)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* QR Code & Link Modal */}
      {activeQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-border-subtle rounded-2xl p-7 shadow-2xl shadow-black space-y-6">
            <button
              onClick={() => setActiveQrTable(null)}
              className="absolute top-5 right-5 p-2 text-text-secondary hover:text-text-primary bg-elevated/60 hover:bg-elevated rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-champagne/10 text-platinum border border-champagne/20">
                Table QR Dispatch
              </span>
              <h3 className="text-2xl font-serif text-text-primary">
                Dining Table T{activeQrTable.table_number}
              </h3>
              <p className="text-xs text-text-secondary">
                {activeQrTable.capacity} Seats · Status: <span className="capitalize text-success">{activeQrTable.status}</span>
              </p>
            </div>

            {/* Simulated High-Res QR Card */}
            <div className="bg-obsidian border border-border-subtle rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="w-40 h-40 bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-lg relative">
                {/* QR Visual */}
                <div className="w-full h-full flex flex-col items-center justify-center border-4 border-zinc-950 p-2">
                  <QrCode className="w-24 h-24 text-zinc-950" />
                  <span className="text-[10px] font-black tracking-widest text-zinc-950 uppercase mt-1">TABLE #{activeQrTable.table_number}</span>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary/70 font-mono">Scan with customer smartphone to order directly</p>
            </div>

            {/* Direct URL Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Table Order Link</label>
              <div className="flex items-center gap-2 bg-obsidian border border-border-subtle rounded-xl p-2 font-mono text-xs text-text-secondary">
                <span className="flex-1 truncate px-1">
                  {typeof window !== 'undefined' ? `${window.location.origin}/menu?table=${activeQrTable.table_number}` : `/menu?table=${activeQrTable.table_number}`}
                </span>
                <button
                  onClick={() => handleCopyLink(activeQrTable.table_number)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-text-primary' 
                      : 'bg-champagne hover:bg-[#d8b85b] text-zinc-950'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Open in Customer View */}
            <div className="pt-2">
              <a
                href={`/menu?table=${activeQrTable.table_number}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-elevated hover:bg-zinc-700 text-text-primary rounded-xl text-xs font-semibold transition-all"
              >
                <span>Launch Table Dining Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-border-subtle rounded-2xl p-7 shadow-2xl shadow-black space-y-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-text-secondary hover:text-text-primary bg-elevated/60 hover:bg-elevated rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-serif text-text-primary">Add Dining Table</h3>
              <p className="text-xs text-text-secondary">Configure new table on restaurant floor matrix</p>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Table Number</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="e.g. 16"
                  className="w-full px-4 py-2.5 bg-obsidian border border-border-subtle rounded-xl text-sm text-text-primary placeholder-zinc-500 focus:outline-none focus:border-champagne/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Seating Capacity (Guests)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { cap: '2', label: '2 Seats' },
                    { cap: '4', label: '4 Seats' },
                    { cap: '6', label: '6 Seats' },
                    { cap: '8', label: '8 Seats' },
                    { cap: '10', label: '10 Seats' },
                    { cap: '12', label: '12 Seats' },
                  ].map((item) => (
                    <button
                      key={item.cap}
                      type="button"
                      onClick={() => setNewCapacity(item.cap)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        newCapacity === item.cap
                          ? 'bg-champagne text-zinc-950 border-champagne font-bold shadow-md shadow-[#c9a84c]/20'
                          : 'bg-obsidian text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Luxury Table Status Dropdown Popover (Replaces ugly browser native select!)
function TableStatusCustomDropdown({ 
  status, 
  disabled, 
  onChange 
}: { 
  status: TableStatus; 
  disabled?: boolean; 
  onChange: (nextStatus: TableStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions: { value: TableStatus; label: string; dotColor: string; textColor: string; bgBadge: string; borderBadge: string }[] = [
    {
      value: 'available',
      label: 'AVAILABLE',
      dotColor: 'bg-emerald-400',
      textColor: 'text-success',
      bgBadge: 'bg-emerald-500/10 hover:bg-success/10',
      borderBadge: 'border-success/20'
    },
    {
      value: 'booked',
      label: 'BOOKED',
      dotColor: 'bg-amber-400',
      textColor: 'text-warning',
      bgBadge: 'bg-amber-500/10 hover:bg-warning/10',
      borderBadge: 'border-warning/20'
    },
    {
      value: 'unavailable',
      label: 'BLOCKED',
      dotColor: 'bg-rose-400',
      textColor: 'text-danger',
      bgBadge: 'bg-rose-500/10 hover:bg-danger/10',
      borderBadge: 'border-danger/20'
    }
  ];

  const currentOption = statusOptions.find(o => o.value === status) || statusOptions[0];

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 shadow-sm ${currentOption.bgBadge} ${currentOption.borderBadge} ${currentOption.textColor} disabled:opacity-50`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${currentOption.dotColor} ${status === 'booked' ? 'animate-pulse' : ''}`} />
          <span>{currentOption.label}</span>
        </div>
        
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : 'opacity-60'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          {/* Backdrop click dismiss */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-obsidian/95 border border-border-subtle rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.9)] backdrop-blur-2xl py-1.5 p-1 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {statusOptions.map((opt) => {
              const isSelected = opt.value === status;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-elevated text-text-primary shadow-inner'
                      : 'text-text-secondary hover:bg-surface hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                    <span className={opt.textColor}>{opt.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-champagne" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

