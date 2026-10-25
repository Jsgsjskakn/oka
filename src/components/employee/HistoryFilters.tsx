'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function HistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('q', search);
    else params.delete('q');
    params.set('page', '1'); // reset page
    router.push(`?${params.toString()}`);
  };

  const setFilter = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
      <form onSubmit={handleSearch} className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search Order ID or Table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-border-subtle rounded-xl text-sm text-platinum focus:outline-none focus:border-champagne/50 transition-colors placeholder:text-zinc-600"
        />
        <button type="submit" className="hidden" />
      </form>
      
      <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
        <select 
          onChange={(e) => setFilter('status', e.target.value)}
          value={searchParams.get('status') || ''}
          className="bg-zinc-900/80 text-zinc-300 border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-champagne/50"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <select 
          onChange={(e) => setFilter('date', e.target.value)}
          value={searchParams.get('date') || ''}
          className="bg-zinc-900/80 text-zinc-300 border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-champagne/50"
        >
          <option value="">Any Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">Past 7 Days</option>
        </select>
      </div>
    </div>
  );
}
