'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sb } from '@/lib/supabase/typed';
import { 
  Box, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  Layers, 
  Send, 
  Camera, 
  Cuboid, 
  Wrench,
  Check,
  Search
} from 'lucide-react';

export default function AssetRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async (signal?: AbortSignal) => {
    const { data } = await supabase.from('asset_requests').select('*').order('created_at', { ascending: false });
    if (signal?.aborted) return;
    if (data) setRequests(data);
  };

  const fetchDishes = async () => {
    const { data } = await supabase.from('dishes').select('id, name').order('name');
    if (data) setDishes(data);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRequests(controller.signal);
    fetchDishes();
    return () => controller.abort();
  }, []);

  // Telemetry Counts
  const totalCount = requests.length;
  const openCount = requests.filter(r => r.status === 'open').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const resolvedCount = requests.filter(r => r.status === 'resolved').length;

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-platinum/5 text-platinum border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Cuboid className="w-3.5 h-3.5 text-platinum" />
              3D & AR Asset Pipeline
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Asset Requests
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Request new 3D models, photorealistic culinary assets, AR configurations, or report broken visual items.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
        >
          {showForm ? <X className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          <span>{showForm ? 'Close Form' : 'New Asset Request'}</span>
        </button>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {/* Total Pipeline */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-champagne">Total Pipeline</span>
            <Layers className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{totalCount}</p>
        </div>

        {/* Open Requests */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-champagne">Open Requests</span>
            <AlertCircle className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{openCount}</p>
        </div>

        {/* In Dev */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-champagne">In Development</span>
            <Wrench className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{inProgressCount}</p>
        </div>

        {/* Resolved */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-champagne">Resolved Assets</span>
            <CheckCircle2 className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">
            {resolvedCount}
          </p>
        </div>
      </div>

      {/* Compact Centered New Request Form */}
      {showForm && (
        <div className="relative max-w-lg mx-auto bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-champagne/50 rounded-2xl p-6 lg:p-7 shadow-[0_30px_60px_rgba(201,168,76,0.2)] animate-in slide-in-from-top-4 duration-400">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-serif text-text-primary">Create Asset Request</h2>
                <p className="text-[11px] text-text-secondary">Direct dispatch to 3D & visual engineering</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(false)}
              className="p-1.5 text-text-secondary hover:text-text-primary bg-elevated/60 hover:bg-elevated rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const { error } = await sb(supabase).from('asset_requests').insert({
                request_type: formData.get('type') as any,
                dish_id: (formData.get('dish_id') as string) || null,
                title: formData.get('title') as string,
                description: (formData.get('description') as string) || null,
                status: 'open',
                restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001'
              });
              setIsSubmitting(false);
              if (error) {
                alert('Failed to submit request');
              } else {
                setShowForm(false);
                fetchRequests();
              }
            }}
            className="space-y-4 text-xs"
          >
            {/* Type & Dish Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Type</label>
                <select 
                  name="type" 
                  className="w-full bg-obsidian border border-border-strong/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 cursor-pointer" 
                  required
                >
                  <option value="3d_model">3D Model (.glb)</option>
                  <option value="dish_image">Dish Image</option>
                  <option value="ar_config">AR Configuration</option>
                  <option value="hotspots">Interactive Hotspots</option>
                  <option value="asset_replacement">Asset Replacement</option>
                  <option value="broken_asset">Report Broken Asset</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Target Dish</label>
                <select 
                  name="dish_id" 
                  className="w-full bg-obsidian border border-border-strong/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 cursor-pointer"
                >
                  <option value="">General (No Specific Dish)</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Request Title</label>
              <input 
                type="text" 
                name="title" 
                placeholder="e.g. Generate photorealistic 3D model for Paneer Tikka" 
                className="w-full bg-obsidian border border-border-strong/80 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50" 
                required 
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Specifications / Instructions</label>
              <textarea 
                name="description" 
                placeholder="Provide details on camera angle, lighting, texture quality, or AR scaling requirement..." 
                rows={3} 
                className="w-full bg-obsidian border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 resize-none" 
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-md shadow-[#c9a84c]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: `All Requests (${totalCount})` },
          { id: 'open', label: `Open (${openCount})` },
          { id: 'in_progress', label: `In Progress (${inProgressCount})` },
          { id: 'resolved', label: `Resolved (${resolvedCount})` },
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

      {/* Request Cards Pipeline List */}
      <div className="grid gap-4">
        {filteredRequests.map(req => {
          const dishMatch = dishes.find(d => d.id === req.dish_id);

          return (
            <div 
              key={req.id} 
              className="group p-5 lg:p-6 border border-border-subtle rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl shadow-[0_15px_40px_rgba(201,168,76,0.1)] transition-all duration-300 hover:border-champagne/60 hover:shadow-[0_20px_50px_rgba(201,168,76,0.2)] hover:-translate-y-1 gap-4"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded-lg bg-elevated text-zinc-200 border border-border-strong/50 shadow-sm flex items-center gap-1.5">
                    <Cuboid className="w-3 h-3 text-champagne" />
                    {req.request_type?.replace('_', ' ')}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded-full border shadow-sm ${
                    req.status === 'open' 
                      ? 'bg-amber-500/10 text-warning border-border-subtle' 
                      : req.status === 'in_progress' 
                      ? 'bg-platinum/5 text-platinum border-border-subtle' 
                      : req.status === 'resolved' 
                      ? 'bg-emerald-500/10 text-success border-border-subtle' 
                      : 'bg-zinc-500/10 text-text-secondary border-zinc-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      req.status === 'open' ? 'bg-amber-400 animate-pulse' : req.status === 'in_progress' ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
                    }`} />
                    {req.status?.replace('_', ' ')}
                  </span>
                  
                  <span className="text-xs font-medium text-text-secondary/70 font-mono">
                    {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-lg text-zinc-100 mb-1 group-hover:text-platinum transition-colors">
                    {req.title}
                  </h3>
                  <p className="text-text-secondary text-xs leading-relaxed max-w-2xl">{req.description}</p>
                </div>

                {dishMatch ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary bg-obsidian/80 px-2.5 py-1 rounded-lg border border-border-subtle">
                    <span className="text-text-secondary/70">Dish:</span>
                    <span className="text-champagne">{dishMatch.name}</span>
                  </div>
                ) : req.dish_id ? (
                  <span className="text-[11px] font-mono text-text-secondary/70 bg-obsidian/80 px-2 py-0.5 rounded border border-border-subtle">
                    ID: {req.dish_id.slice(0, 8)}...
                  </span>
                ) : null}
              </div>
              
              {/* Status Update Selector */}
              <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 md:pl-5">
                <label className="block text-[10px] uppercase tracking-widest text-text-secondary/70 font-semibold mb-1.5">
                  Pipeline Status
                </label>
                <AssetStatusCustomDropdown
                  currentStatus={req.status}
                  onChange={async (newStatus) => {
                    await sb(supabase).from('asset_requests').update({ status: newStatus }).eq('id', req.id);
                    fetchRequests();
                  }}
                />
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="p-16 text-center bg-surface/40 border border-dashed border-border-subtle rounded-2xl space-y-3">
            <Cuboid className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-text-secondary font-medium text-sm">No asset requests found</p>
            <p className="text-xs text-text-secondary/70">Click &apos;New Asset Request&apos; above to submit 3D model or image requests to developers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Luxury Asset Pipeline Dropdown
function AssetStatusCustomDropdown({
  currentStatus,
  onChange
}: {
  currentStatus: string;
  onChange: (status: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'open', label: 'Open', color: 'text-warning', dot: 'bg-amber-400' },
    { value: 'in_progress', label: 'In Progress', color: 'text-platinum', dot: 'bg-cyan-400' },
    { value: 'resolved', label: 'Resolved', color: 'text-success', dot: 'bg-emerald-400' },
    { value: 'closed', label: 'Closed', color: 'text-text-secondary', dot: 'bg-zinc-500' },
  ];

  const current = options.find(o => o.value === currentStatus) || options[0];

  return (
    <div className="relative w-full md:w-36">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-obsidian border border-border-strong/80 rounded-xl text-xs text-zinc-200 outline-none hover:border-champagne/50 transition-all font-medium"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${current.dot}`} />
          <span className={current.color}>{current.label}</span>
        </div>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : 'text-text-secondary/70'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-obsidian/95 border border-border-subtle rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-1 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all ${
                  opt.value === currentStatus ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:bg-surface hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  <span className={opt.color}>{opt.label}</span>
                </div>
                {opt.value === currentStatus && <Check className="w-3.5 h-3.5 text-champagne" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



