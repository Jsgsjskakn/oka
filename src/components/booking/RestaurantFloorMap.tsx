'use client';

import React, { useState } from 'react';
import { Sparkles, Compass, Users, Check, Flame, Leaf, Crown } from 'lucide-react';

export interface FloorTable {
  id: number;
  tableNumber: number;
  name: string;
  zone: string;
  capacity: number;
  ambience: string;
  x: number; // percentage in floor plan
  y: number; // percentage in floor plan
  shape: 'round' | 'rect';
}

export const RESTAURANT_TABLES: FloorTable[] = [
  // Zone 1: The Hearth Chef's Counter
  {
    id: 1,
    tableNumber: 1,
    name: 'Table #01 · Hearthside',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Live wood-fired oven view · Chef interaction',
    x: 18,
    y: 24,
    shape: 'round',
  },
  {
    id: 2,
    tableNumber: 2,
    name: 'Table #02 · Hearthside',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Aromatic ember view · Intimate high-top',
    x: 36,
    y: 24,
    shape: 'round',
  },
  // Zone 2: Main Chandelier Hall
  {
    id: 3,
    tableNumber: 3,
    name: 'Table #03 · Center Aisle',
    zone: 'Main Chandelier Hall',
    capacity: 2,
    ambience: 'Warm chandelier spotlight · Lively fine-dining',
    x: 20,
    y: 52,
    shape: 'round',
  },
  {
    id: 4,
    tableNumber: 4,
    name: 'Table #04 · Center Grand',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Direct chandelier glow · Prime acoustic balance',
    x: 44,
    y: 52,
    shape: 'rect',
  },
  {
    id: 5,
    tableNumber: 5,
    name: 'Table #05 · East Wing',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Elegant velvet seating · Spacious spacing',
    x: 68,
    y: 52,
    shape: 'rect',
  },
  {
    id: 6,
    tableNumber: 6,
    name: 'Table #06 · Wine Cellar View',
    zone: 'Main Chandelier Hall',
    capacity: 2,
    ambience: 'Overlooking vintage cellar · Romantic setting',
    x: 22,
    y: 75,
    shape: 'round',
  },
  {
    id: 7,
    tableNumber: 7,
    name: 'Table #07 · Window Corner',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Panoramic street garden view · Soft golden lighting',
    x: 48,
    y: 75,
    shape: 'rect',
  },
  // Zone 3: Emerald Botanical Terrace
  {
    id: 8,
    tableNumber: 8,
    name: 'Table #08 · Garden Pergola',
    zone: 'Emerald Botanical Terrace',
    capacity: 2,
    ambience: 'Alfresco night breeze · Living flora canopy',
    x: 64,
    y: 22,
    shape: 'round',
  },
  {
    id: 9,
    tableNumber: 9,
    name: 'Table #09 · Veranda Table',
    zone: 'Emerald Botanical Terrace',
    capacity: 4,
    ambience: 'Candlelight lantern view · Open terrace',
    x: 82,
    y: 22,
    shape: 'rect',
  },
  {
    id: 10,
    tableNumber: 10,
    name: 'Table #10 · Terrace Rail',
    zone: 'Emerald Botanical Terrace',
    capacity: 2,
    ambience: 'Secluded terrace railing · Starlit dining',
    x: 86,
    y: 46,
    shape: 'round',
  },
  // Zone 4: The Velvet Private Booths
  {
    id: 11,
    tableNumber: 11,
    name: 'Table #11 · Velvet Alcove',
    zone: 'The Velvet Private Booths',
    capacity: 6,
    ambience: 'Deep velvet acoustic booth · VIP Privacy',
    x: 74,
    y: 74,
    shape: 'rect',
  },
  {
    id: 12,
    tableNumber: 12,
    name: 'Table #12 · Presidential Booth',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Ultra-luxury dining lounge · Dedicated sommelier access',
    x: 88,
    y: 74,
    shape: 'rect',
  },
];

interface RestaurantFloorMapProps {
  selectedTableNumber: number | null;
  onSelectTable: (table: FloorTable) => void;
  guests: number;
  availableTableNumbers?: number[]; // from live check
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
}

export function RestaurantFloorMap({
  selectedTableNumber,
  onSelectTable,
  guests,
  availableTableNumbers,
  selectedZone,
  onSelectZone,
}: RestaurantFloorMapProps) {
  const [hoveredTable, setHoveredTable] = useState<FloorTable | null>(null);

  const zones = [
    { name: "The Hearth", key: "The Hearth Chef's Counter", icon: Flame },
    { name: 'Chandelier Hall', key: 'Main Chandelier Hall', icon: Sparkles },
    { name: 'Botanical Terrace', key: 'Emerald Botanical Terrace', icon: Leaf },
    { name: 'Velvet Booths', key: 'The Velvet Private Booths', icon: Crown },
  ];

  // Selected table object
  const activeTable = RESTAURANT_TABLES.find((t) => t.tableNumber === selectedTableNumber);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Floor Plan Header & Legend */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#E2A84B]" />
          <span className="text-xs font-semibold tracking-wider uppercase text-[#FAF5EC]">
            Interactive Architectural Floor Map
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-medium">
          <span className="inline-flex items-center gap-1 text-[#22C58B]">
            <span className="w-2 h-2 rounded-full bg-[#22C58B] shadow-[0_0_6px_#22C58B]" />
            Available
          </span>
          <span className="inline-flex items-center gap-1 text-[#E2A84B]">
            <span className="w-2 h-2 rounded-full bg-[#E2A84B] shadow-[0_0_6px_#E2A84B]" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1 text-white/30">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Reserved
          </span>
        </div>
      </div>

      {/* Dining Zone Quick Filter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {zones.map((z) => {
          const isSelected = selectedZone === z.key;
          return (
            <button
              key={z.key}
              type="button"
              onClick={() => onSelectZone?.(isSelected ? '' : z.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left truncate flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0E1F18] border border-[#22C58B]/50 text-[#E2A84B] shadow-[0_0_10px_rgba(34,197,139,0.2)]'
                  : 'bg-white/[0.03] border border-white/[0.06] text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/[0.06]'
              }`}
            >
              <z.icon className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
              <span className="truncate">{z.name}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Architectural Map Canvas */}
      <div className="relative w-full h-[250px] sm:h-[280px] rounded-xl bg-[#0F0B09] border border-[rgba(226,168,75,0.2)] p-3 overflow-hidden select-none shadow-inner">
        {/* Subtle Architectural Grid Lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(226, 168, 75, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 168, 75, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Zone Demarcation Boundary Lines */}
        <div className="absolute left-[54%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#E2A84B]/20 pointer-events-none" />
        <div className="absolute left-0 right-0 top-[40%] h-[1px] border-b border-dashed border-[#E2A84B]/20 pointer-events-none" />

        {/* Architectural Room Labels */}
        <span className="absolute top-2 left-3 text-[9px] font-mono tracking-widest text-[#E2A84B]/40 uppercase pointer-events-none">
          ZONE 01 · THE HEARTH
        </span>
        <span className="absolute top-2 right-3 text-[9px] font-mono tracking-widest text-[#22C58B]/40 uppercase pointer-events-none">
          ZONE 03 · BOTANICAL TERRACE
        </span>
        <span className="absolute bottom-2 left-3 text-[9px] font-mono tracking-widest text-[#FAF5EC]/30 uppercase pointer-events-none">
          ZONE 02 · CHANDELIER HALL
        </span>
        <span className="absolute bottom-2 right-3 text-[9px] font-mono tracking-widest text-[#E2A84B]/40 uppercase pointer-events-none">
          ZONE 04 · VELVET BOOTHS
        </span>

        {/* Interactive Tables */}
        {RESTAURANT_TABLES.map((t) => {
          const isSelected = selectedTableNumber === t.tableNumber;
          const fitsCapacity = t.capacity >= guests;

          // If availableTableNumbers provided, check if in set, else if fitsCapacity consider available
          const isLiveAvailable = availableTableNumbers
            ? availableTableNumbers.includes(t.tableNumber)
            : fitsCapacity;

          const isZoneMatch = !selectedZone || t.zone === selectedZone;

          return (
            <div
              key={t.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200"
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                zIndex: isSelected ? 20 : 10,
              }}
              onMouseEnter={() => setHoveredTable(t)}
              onMouseLeave={() => setHoveredTable(null)}
              onClick={() => {
                if (isLiveAvailable) {
                  onSelectTable(t);
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate(12);
                  }
                }
              }}
            >
              <button
                type="button"
                disabled={!isLiveAvailable}
                className={`relative flex items-center justify-center transition-all ${
                  t.shape === 'rect'
                    ? 'w-10 h-8 sm:w-12 sm:h-9 rounded-lg'
                    : 'w-8 h-8 sm:w-9 sm:h-9 rounded-full'
                } ${
                  isSelected
                    ? 'bg-[#E2A84B] text-[#0D0A08] font-extrabold shadow-[0_0_16px_rgba(226,168,75,0.75)] scale-110 border-2 border-white'
                    : isLiveAvailable && isZoneMatch
                    ? 'bg-[#0A261C] border border-[#22C58B]/70 text-[#22C58B] hover:scale-115 hover:border-[#E2A84B] hover:shadow-[0_0_12px_rgba(34,197,139,0.5)]'
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/20 opacity-35 cursor-not-allowed'
                }`}
                aria-label={t.name}
              >
                <span className="font-mono text-[10px] font-bold">#{t.tableNumber}</span>

                {/* Capacity dot indicator */}
                <span className="absolute -top-1 -right-1 text-[8px] px-1 rounded-full bg-[#15110E] border border-white/10 text-[#9A9286]">
                  {t.capacity}p
                </span>

                {/* Active checkmark */}
                {isSelected && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#0D0A08] text-[#E2A84B] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Floating Table Hover Tooltip */}
        {hoveredTable && (
          <div
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-[rgba(21,17,14,0.95)] backdrop-blur-md border border-[#E2A84B]/40 shadow-[0_8px_20px_rgba(0,0,0,0.8)] text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${hoveredTable.x}%`,
              top: `${hoveredTable.y - 8}%`,
            }}
          >
            <p className="text-xs font-bold text-[#FAF5EC]">{hoveredTable.name}</p>
            <p className="text-[10px] text-[#E2A84B] flex items-center gap-1">
              <Users className="w-2.5 h-2.5" /> Up to {hoveredTable.capacity} Guests · {hoveredTable.zone}
            </p>
          </div>
        )}
      </div>

      {/* Selected Table Ambience Highlight Card */}
      {activeTable ? (
        <div className="p-3 rounded-xl bg-[#0E1F18]/80 border border-[#22C58B]/30 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#E2A84B] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FAF5EC]">{activeTable.name}</span>
              <span className="text-[10px] font-semibold text-[#22C58B] uppercase tracking-wider">
                Confirmed Choice
              </span>
            </div>
            <p className="text-[11px] text-[#B5ADA2] font-light mt-0.5">
              {activeTable.ambience}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[#9A9286] italic text-center py-1">
          Click any glowing green table on the floor map to lock your specific dining location.
        </p>
      )}
    </div>
  );
}
