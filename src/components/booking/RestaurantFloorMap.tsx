'use client';

import React, { useState } from 'react';
import { Sparkles, Compass, Users, Check } from 'lucide-react';

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
  // Row 1: T1 to T4
  {
    id: 1,
    tableNumber: 1,
    name: 'Table #01 · Hearthside',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Live wood-fired oven view · Chef interaction',
    x: 18,
    y: 22,
    shape: 'rect',
  },
  {
    id: 2,
    tableNumber: 2,
    name: 'Table #02 · Hearthside',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Aromatic ember view · Intimate setting',
    x: 39,
    y: 22,
    shape: 'rect',
  },
  {
    id: 3,
    tableNumber: 3,
    name: 'Table #03 · Chandelier North',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Warm chandelier spotlight · Prime acoustic balance',
    x: 61,
    y: 22,
    shape: 'rect',
  },
  {
    id: 4,
    tableNumber: 4,
    name: 'Table #04 · Botanical Pergola',
    zone: 'Emerald Botanical Terrace',
    capacity: 4,
    ambience: 'Alfresco terrace canopy view · Living flora',
    x: 82,
    y: 22,
    shape: 'rect',
  },
  // Row 2: T5 to T8
  {
    id: 5,
    tableNumber: 5,
    name: 'Table #05 · Hearth Alcove',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Warm fireplace glow · Cozy seating',
    x: 18,
    y: 50,
    shape: 'rect',
  },
  {
    id: 6,
    tableNumber: 6,
    name: 'Table #06 · Wine Cellar View',
    zone: 'Main Chandelier Hall',
    capacity: 2,
    ambience: 'Overlooking vintage cellar · Romantic setting',
    x: 39,
    y: 50,
    shape: 'rect',
  },
  {
    id: 7,
    tableNumber: 7,
    name: 'Table #07 · Fireplace Lounge',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Direct fireplace warmth · Artisanal wood-fired aroma',
    x: 61,
    y: 50,
    shape: 'rect',
  },
  {
    id: 8,
    tableNumber: 8,
    name: 'Table #08 · Veranda Garden',
    zone: 'Emerald Botanical Terrace',
    capacity: 4,
    ambience: 'Lantern-lit veranda · Starlit dining view',
    x: 82,
    y: 50,
    shape: 'rect',
  },
  // Row 3: T9 to T12
  {
    id: 9,
    tableNumber: 9,
    name: 'Table #09 · East Wing Booth',
    zone: 'The Velvet Private Booths',
    capacity: 4,
    ambience: 'Velvet seating · Private acoustic dining',
    x: 18,
    y: 78,
    shape: 'rect',
  },
  {
    id: 10,
    tableNumber: 10,
    name: 'Table #10 · Center Grand',
    zone: 'Main Chandelier Hall',
    capacity: 6,
    ambience: 'Prime chandelier centerpiece · Spacious seating',
    x: 39,
    y: 78,
    shape: 'rect',
  },
  {
    id: 11,
    tableNumber: 11,
    name: 'Table #11 · Velvet Alcove',
    zone: 'The Velvet Private Booths',
    capacity: 6,
    ambience: 'Deep velvet acoustic booth · VIP Privacy',
    x: 61,
    y: 78,
    shape: 'rect',
  },
  {
    id: 12,
    tableNumber: 12,
    name: 'Table #12 · Presidential Booth',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Ultra-luxury dining lounge · Dedicated sommelier access',
    x: 82,
    y: 78,
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
  selectedZone: _selectedZone,
  onSelectZone: _onSelectZone,
}: RestaurantFloorMapProps) {
  const [hoveredTable, setHoveredTable] = useState<FloorTable | null>(null);


  return (
    <div className="w-full flex flex-col gap-3">
      {/* Floor Plan Header & Legend */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#F0C36B]" />
          <span className="text-xs font-semibold tracking-wider uppercase text-[#F8F2E8] font-mono">
            INTERACTIVE ARCHITECTURAL FLOOR MAP
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-medium font-mono">
          <span className="inline-flex items-center gap-1 text-[#36D6A0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]" />
            Available
          </span>
          <span className="inline-flex items-center gap-1 text-[#F0C36B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0C36B] shadow-[0_0_6px_#F0C36B]" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1 text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            Reserved
          </span>
        </div>
      </div>

      {/* Visual Architectural Map Canvas */}
      <div className="relative w-full h-[250px] sm:h-[270px] rounded-2xl bg-[rgba(12,9,7,0.35)] backdrop-blur-xl border border-[#F0C36B]/35 p-3 overflow-hidden select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.45)]">
        {/* Subtle Architectural Grid Lines */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(240, 195, 107, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(240, 195, 107, 0.2) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Zone Demarcation Boundary Lines */}
        <div className="absolute left-[50%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#F0C36B]/15 pointer-events-none" />
        <div className="absolute left-0 right-0 top-[50%] h-[1px] border-b border-dashed border-[#F0C36B]/15 pointer-events-none" />

        {/* Interactive Tables (T1 through T12) */}
        {RESTAURANT_TABLES.map((t) => {
          const isSelected = selectedTableNumber === t.tableNumber;
          const fitsCapacity = t.capacity >= guests;

          const isLiveAvailable = availableTableNumbers
            ? availableTableNumbers.includes(t.tableNumber)
            : fitsCapacity;

          const isZoneMatch = true;

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
                className={`relative flex items-center justify-center transition-all w-11 h-9 sm:w-12 sm:h-10 rounded-xl ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#F0C36B] to-[#DDA33E] text-[#17100C] font-extrabold shadow-[0_0_20px_rgba(240,195,107,0.7)] scale-110 border-2 border-[#FFE3A5]'
                    : isLiveAvailable && isZoneMatch
                    ? 'bg-black/60 border border-[#36D6A0]/60 text-[#F8F2E8] shadow-[0_0_8px_rgba(54,214,160,0.2)] hover:scale-105 hover:border-[#F0C36B]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/20 opacity-30 cursor-not-allowed'
                }`}
                aria-label={t.name}
              >
                <span className="font-mono text-xs font-bold">T{t.tableNumber}</span>

                {/* Capacity badge */}
                <span
                  className={`absolute -top-1 -right-1 text-[8px] px-1 rounded-full font-mono font-medium ${
                    isSelected
                      ? 'bg-[#17100C] text-[#F0C36B]'
                      : 'bg-black/80 border border-white/10 text-[#A99A88]'
                  }`}
                >
                  {t.capacity}
                </span>

                {isSelected && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#17100C] text-[#F0C36B] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Ambient Room Labels at Canvas Bottom */}
        <div className="absolute bottom-2 left-4 flex items-center gap-1.5 text-[9.5px] font-mono tracking-wider text-[#F0C36B]/70 uppercase pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C36B] shadow-[0_0_4px_#F0C36B]" />
          <span>FIREPLACE LOUNGE</span>
        </div>
        <div className="absolute bottom-2 right-4 flex items-center gap-1.5 text-[9.5px] font-mono tracking-wider text-[#F8F2E8]/40 uppercase pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span>PRIVATE DINING</span>
        </div>

        {/* Floating Table Hover Tooltip */}
        {hoveredTable && (
          <div
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-[rgba(20,15,11,0.95)] backdrop-blur-md border border-[#F0C36B]/40 shadow-[0_8px_20px_rgba(0,0,0,0.8)] text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${hoveredTable.x}%`,
              top: `${hoveredTable.y - 12}%`,
            }}
          >
            <p className="text-xs font-bold text-[#F8F2E8]">{hoveredTable.name}</p>
            <p className="text-[10px] text-[#F0C36B] flex items-center gap-1">
              <Users className="w-2.5 h-2.5" /> Up to {hoveredTable.capacity} Guests · {hoveredTable.zone}
            </p>
          </div>
        )}
      </div>

      {/* Click Here to Select Seat - Glass Pill & Interactive Cue in Red Box Area */}
      <div className="pt-2 flex flex-col items-center justify-center gap-1.5 select-none">
        <button
          type="button"
          onClick={() => {
            const targetTable = RESTAURANT_TABLES.find((t) =>
              availableTableNumbers ? availableTableNumbers.includes(t.tableNumber) : t.capacity >= guests
            );
            if (targetTable) {
              onSelectTable(targetTable);
              if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12);
            }
          }}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(240,195,107,0.14)] hover:bg-[rgba(240,195,107,0.25)] border border-[#F0C36B]/60 hover:border-[#F0C36B] text-[#FFE3A5] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(240,195,107,0.3)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_24px_rgba(240,195,107,0.45)] transition-all cursor-pointer backdrop-blur-xl active:scale-95"
          title="Click here to select seat on the floor map"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F0C36B] group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-[13px] font-bold tracking-wide text-[#F8F2E8] group-hover:text-[#FFE3A5]">
            Click here to select seat
          </span>
          <span className="w-2 h-2 rounded-full bg-[#36D6A0] shadow-[0_0_8px_#36D6A0] animate-pulse" />
        </button>

        <p className="text-[11px] text-[#D4C7B6]/85 text-center font-light">
          Tap any glowing table above to choose the perfect spot for your experience.
        </p>
      </div>
    </div>
  );
}
