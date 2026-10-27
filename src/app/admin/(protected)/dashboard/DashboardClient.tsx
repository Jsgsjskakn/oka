'use client';

import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/db/types';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bell,
} from 'lucide-react';

export interface DashboardOrder {
  id: string;
  total_paise: number;
  status: string;
  order_type: string;
  created_at: string;
  customer_name: string;
}

export interface DashboardBooking {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  guests: number;
  status: string;
}

export interface DashboardTrendingDish {
  id: string;
  slug: string;
  name: string;
  pricePaise: number;
  image: string;
  category: string;
  orderCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
}

export interface DashboardAssetRequest {
  id: string;
  request_type: string;
  status: string;
  dish_id: string | null;
}

export interface DailySeriesPoint {
  label: string;
  date: string;
  revenuePaise: number;
  orderCount: number;
}

interface DashboardClientProps {
  adminName: string;
  formattedMonthYear: string;
  revenueTodayPaise: number;
  totalRevenuePaise: number;
  totalOrdersToday: number;
  totalOrdersAllTime: number;
  runningOrdersCount: number;
  completedOrdersCount: number;
  activeBookingsCount: number;
  totalBookingsCount: number;
  totalTablesCount: number;
  openIssuesCount: number;
  trendingDishes: DashboardTrendingDish[];
  recentOrders: DashboardOrder[];
  recentBookings: DashboardBooking[];
  openAssetRequests: DashboardAssetRequest[];
  dailySeries: DailySeriesPoint[];
}

function RevenueIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 2-3 2.5-3 4.5" />
      <path d="m8 12 1.5-1.5" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <path d="M12 7v6l4 2" />
      <path d="M10 9a2 2 0 1 1 4 0c0 1.5-2 2-2 3" />
    </svg>
  );
}

function AvgRevenueIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M12 10v6" />
      <path d="M9.5 11.5a2 2 0 0 1 3.5-1c1 1 1 2-1 2.5s-2 1-1 2.5a2 2 0 0 0 3.5-.5" />
    </svg>
  );
}

export interface TrendingDishItem {
  id: string;
  slug: string;
  name: string;
  priceDisplay: string;
  image: string;
}

export const DEFAULT_TRENDING_DISHES: TrendingDishItem[] = [
  // First Screen (Pos 1, 2, 3): Mushroom Pizza, Classic Pizza, Burger
  {
    id: 'dish-mushroom-truffle-pizza',
    slug: 'mushroom-truffle-pizza',
    name: 'Mushroom Truffle Pizza',
    priceDisplay: '$289',
    image: '/images/dishes/mushroom-truffle-pizza.webp',
  },
  {
    id: 'dish-chicken-tikka-pizza',
    slug: 'chicken-tikka-pizza',
    name: 'Chicken Tikka Pizza',
    priceDisplay: '$265',
    image: '/images/dishes/chicken-tikka-pizza.webp',
  },
  {
    id: 'dish-classic-smash-burger',
    slug: 'classic-smash-burger',
    name: 'Classic Smash Burger',
    priceDisplay: '$240',
    image: '/images/dishes/classic-smash-burger.webp',
  },
  // Slide Right: The Remaining 7 Genuine Golden Oak Menu Items (No external/rice items)
  {
    id: 'dish-tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    priceDisplay: '$275',
    image: '/images/dishes/tandoori-paneer-pizza.webp',
  },
  {
    id: 'dish-peri-peri-fiesta-pizza',
    slug: 'peri-peri-fiesta-pizza',
    name: 'Peri-Peri Fiesta Pizza',
    priceDisplay: '$285',
    image: '/images/dishes/peri-peri-fiesta-pizza.webp',
  },
  {
    id: 'dish-bbq-chicken-overload',
    slug: 'bbq-chicken-overload',
    name: 'BBQ Chicken Overload',
    priceDisplay: '$310',
    image: '/images/dishes/bbq-chicken-overload.webp',
  },
  {
    id: 'dish-golden-oak-signature-burger',
    slug: 'golden-oak-signature-burger',
    name: 'Golden Oak Signature Burger',
    priceDisplay: '$295',
    image: '/images/dishes/golden-oak-signature-burger.webp',
  },
  {
    id: 'dish-crispy-paneer-burger',
    slug: 'crispy-paneer-burger',
    name: 'Crispy Paneer Burger',
    priceDisplay: '$215',
    image: '/images/dishes/crispy-paneer-burger.webp',
  },
  {
    id: 'dish-dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    priceDisplay: '$185',
    image: '/images/dishes/dynamite-chilli-potatoes.webp',
  },
  {
    id: 'dish-wok-tossed-chow-mein',
    slug: 'wok-tossed-chow-mein',
    name: 'Wok-Tossed Chow Mein',
    priceDisplay: '$195',
    image: '/images/dishes/wok-tossed-chow-mein.webp',
  },
];

export function DashboardClient({
  adminName,
  formattedMonthYear,
  revenueTodayPaise,
  totalRevenuePaise,
  totalOrdersToday,
  totalOrdersAllTime,
  runningOrdersCount,
  completedOrdersCount,
  activeBookingsCount,
  totalBookingsCount,
  totalTablesCount,
  openIssuesCount,
  trendingDishes,
  recentOrders,
  recentBookings,
  openAssetRequests,
  dailySeries,
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [salesPeriod, setSalesPeriod] = useState<'Monthly' | 'Today'>('Monthly');
  const [chartPeriod, setChartPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [showLiveQueues, setShowLiveQueues] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    // Scroll by the container width to seamlessly show the next batch
    const scrollAmount = container.clientWidth;
    if (direction === 'right') {
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (container.scrollLeft <= 15) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // SVG Donut Geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  // Segments matching reference image:
  // Coral (Total Order): 36%
  // Orchid (Running order): 22%
  // Mint (Customer Growth): 26%
  // Blue (Total Revenue): 16%
  const seg1 = circumference * 0.36; // Coral #ff7563
  const seg2 = circumference * 0.22; // Orchid #d28bef
  const seg3 = circumference * 0.26; // Mint #20d77e
  const seg4 = circumference * 0.16; // Blue #7888f4
  const gap = 5;

  // Filter items by search query
  const visibleTrendingDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEFAULT_TRENDING_DISHES;
    return DEFAULT_TRENDING_DISHES.filter((d) =>
      d.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trendingDishes;
    return trendingDishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [trendingDishes, searchQuery]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentOrders;
    return recentOrders.filter(
      (o) =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q)
    );
  }, [recentOrders, searchQuery]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentBookings;
    return recentBookings.filter(
      (b) =>
        b.customer_name?.toLowerCase().includes(q) ||
        b.booking_date?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q)
    );
  }, [recentBookings, searchQuery]);

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      {/* 1. Top Bar inside Main Area matching reference */}
      <div className="rounded-[22px] bg-[#1a120c]/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.5)] px-5 py-3 flex items-center justify-between gap-4">
        {/* Left Welcome message */}
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-1.5">
            Welcome, Sajib
          </h1>
        </div>

        {/* Center Pill Search Input */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-white/45 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search dashboard"
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#0a0705]/65 border border-white/[0.08] text-xs text-white/90 placeholder-white/40 outline-none focus:border-white/30 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Right Notification Bell + Profile Area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Bell with red indicator dot */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff5252] shadow-[0_0_8px_#ff5252]" />
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-1">
            <img
              src="/images/admin-avatar.png"
              alt="Sajib Supriyo"
              className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-md shrink-0"
            />
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-white tracking-tight">
                Sajib Supriyo
              </span>
              <span className="text-[10.5px] text-white/50 mt-0.5">
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Frosted Glass Dashboard Card Container */}
      <div className="rounded-[28px] bg-[#1a120c]/52 backdrop-blur-2xl border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] p-5 md:p-6 space-y-4">
        {/* ROW 1: 4 Vibrant Metric Cards matching reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Mint Green */}
          <div className="rounded-[20px] bg-gradient-to-r from-[#20d77e] to-[#2cdb8b] p-4 flex items-center gap-3.5 shadow-[0_10px_25px_rgba(32,215,126,0.22)] transition-transform duration-200 hover:-translate-y-0.5 text-black">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-md">
              <RevenueIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-black leading-tight tracking-tight truncate">
                $ 11,256
              </p>
              <p className="text-[11.5px] font-semibold text-black/75 mt-0.5 truncate">
                Today&apos;s Revenue
              </p>
            </div>
          </div>

          {/* Card 2: Lilac Purple */}
          <div className="rounded-[20px] bg-gradient-to-r from-[#cf85ee] to-[#d695f2] p-4 flex items-center gap-3.5 shadow-[0_10px_25px_rgba(207,133,238,0.22)] transition-transform duration-200 hover:-translate-y-0.5 text-black">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-md">
              <OrderIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-black leading-tight tracking-tight truncate">
                245
              </p>
              <p className="text-[11.5px] font-semibold text-black/75 mt-0.5 truncate">
                Today&apos;s Order
              </p>
            </div>
          </div>

          {/* Card 3: Periwinkle Blue */}
          <div className="rounded-[20px] bg-gradient-to-r from-[#7080f3] to-[#8292f7] p-4 flex items-center gap-3.5 shadow-[0_10px_25px_rgba(112,128,243,0.22)] transition-transform duration-200 hover:-translate-y-0.5 text-black">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-md">
              <ExpenseIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-black leading-tight tracking-tight truncate">
                $ 6,556
              </p>
              <p className="text-[11.5px] font-semibold text-black/75 mt-0.5 truncate">
                Avg. Expense
              </p>
            </div>
          </div>

          {/* Card 4: Warm Coral */}
          <div className="rounded-[20px] bg-gradient-to-r from-[#ff6f5b] to-[#ff7d6d] p-4 flex items-center gap-3.5 shadow-[0_10px_25px_rgba(255,111,91,0.22)] transition-transform duration-200 hover:-translate-y-0.5 text-black">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 shadow-md">
              <AvgRevenueIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-black leading-tight tracking-tight truncate">
                $ 4,227
              </p>
              <p className="text-[11.5px] font-semibold text-black/75 mt-0.5 truncate">
                Avg. Revenue
              </p>
            </div>
          </div>
        </div>

        {/* ROW 2: Sales Details (Donut) & Order Chart (Weekly Bars) matching reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel: Sales Details */}
          <div className="lg:col-span-7 rounded-[22px] bg-[#140e0a]/65 backdrop-blur-xl border border-white/[0.1] p-5 shadow-inner flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-bold text-white tracking-tight">
                  Sales Details
                </h2>
                <p className="text-[12px] text-white/45 mt-0.5">
                  September, 2023
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSalesPeriod((p) => (p === 'Monthly' ? 'Today' : 'Monthly'))
                }
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.14] text-[11px] font-medium text-white/80 flex items-center gap-1.5 transition-colors"
              >
                <span>{salesPeriod}</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
            </div>

            <div className="mt-4 mb-2 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-7 md:gap-11 sm:pl-4">
              {/* Multi-Segment SVG Donut with 100% Center */}
              <div className="relative w-[150px] h-[150px] flex items-center justify-center shrink-0">
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 144 144"
                  className="-rotate-90 transform"
                >
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="17"
                  />
                  {/* Segment 1: Coral (#ff7563) */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="transparent"
                    stroke="#ff7563"
                    strokeWidth="17"
                    strokeDasharray={`${Math.max(0, seg1 - gap)} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="butt"
                  />
                  {/* Segment 2: Periwinkle Blue (#7888f4) */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="transparent"
                    stroke="#7888f4"
                    strokeWidth="17"
                    strokeDasharray={`${Math.max(0, seg4 - gap)} ${circumference}`}
                    strokeDashoffset={-seg1}
                    strokeLinecap="butt"
                  />
                  {/* Segment 3: Mint Green (#20d77e) */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="transparent"
                    stroke="#20d77e"
                    strokeWidth="17"
                    strokeDasharray={`${Math.max(0, seg3 - gap)} ${circumference}`}
                    strokeDashoffset={-(seg1 + seg4)}
                    strokeLinecap="butt"
                  />
                  {/* Segment 4: Orchid Lavender (#d28bef) */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="transparent"
                    stroke="#d28bef"
                    strokeWidth="17"
                    strokeDasharray={`${Math.max(0, seg2 - gap)} ${circumference}`}
                    strokeDashoffset={-(seg1 + seg4 + seg3)}
                    strokeLinecap="butt"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[20px] font-black text-white tracking-tight">
                    100%
                  </span>
                </div>
              </div>

              {/* 4-Row Legend matching reference exactly */}
              <div className="space-y-3.5 w-full sm:w-auto">
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#ff7563] shrink-0" />
                  <span className="text-white/60">Total Order</span>
                  <span className="font-bold text-white ml-2">565</span>
                </div>

                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#d28bef] shrink-0" />
                  <span className="text-white/60">Running order</span>
                  <span className="font-bold text-white ml-2">22%</span>
                </div>

                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#20d77e] shrink-0" />
                  <span className="text-white/60">Customer Growth</span>
                  <span className="font-bold text-white ml-2">26%</span>
                </div>

                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#7888f4] shrink-0" />
                  <span className="text-white/60">Total Revenue</span>
                  <span className="font-bold text-white ml-2">17%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Order Chart */}
          <div className="lg:col-span-5 rounded-[22px] bg-[#140e0a]/65 backdrop-blur-xl border border-white/[0.1] p-5 shadow-inner flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-bold text-white tracking-tight">
                  Order Chart
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setChartPeriod((p) => (p === 'Weekly' ? 'Monthly' : 'Weekly'))
                }
                className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.14] text-[11px] font-medium text-white/75 flex items-center gap-1.5 transition-colors"
              >
                <span>{chartPeriod}</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
            </div>

            <div className="mt-3 flex items-end gap-3 h-[160px]">
              {/* Y-Axis Labels matching reference: 300, 250, 200, 150, 100, 50 */}
              <div className="flex flex-col justify-between h-full text-[10.5px] text-white/40 font-medium pr-1 select-none">
                <span>300</span>
                <span>250</span>
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
              </div>

              {/* Bar Columns: Sat, Sun, Mon, Tue, Wed, Thu, Fri */}
              <div className="flex-1 flex items-end justify-between gap-2 h-full pb-1">
                {[
                  { day: 'Sat', height: 46, isHighlight: false },
                  { day: 'Sun', height: 72, isHighlight: false },
                  { day: 'Mon', height: 60, isHighlight: false },
                  { day: 'Tue', height: 82, isHighlight: true, badge: '65' },
                  { day: 'Wed', height: 66, isHighlight: false },
                  { day: 'Thu', height: 38, isHighlight: false },
                  { day: 'Fri', height: 30, isHighlight: false },
                ].map((col) => (
                  <div
                    key={col.day}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group"
                  >
                    {/* Badge number above highlighted bar */}
                    {col.badge ? (
                      <span className="text-[13px] font-bold text-white mb-0.5 tracking-tight">
                        {col.badge}
                      </span>
                    ) : (
                      <span className="text-[13px] opacity-0 select-none">-</span>
                    )}

                    {/* Bar Capsule */}
                    <div className="w-full max-w-[14px] h-[105px] bg-white/[0.04] rounded-full flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${
                          col.isHighlight
                            ? 'bg-[#f6c336] shadow-[0_0_12px_rgba(246,195,54,0.4)]'
                            : 'bg-white/[0.12] group-hover:bg-white/[0.25]'
                        }`}
                        style={{ height: `${col.height}%` }}
                      />
                    </div>

                    <span
                      className={`text-[11px] font-medium ${
                        col.isHighlight ? 'text-white font-bold' : 'text-white/45'
                      }`}
                    >
                      {col.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Trending Orders matching reference */}
        <div className="rounded-[22px] bg-[#140e0a]/65 backdrop-blur-xl border border-white/[0.1] p-5 shadow-inner">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-bold text-white tracking-tight">
                Trending Orders
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08]">
                {visibleTrendingDishes.length} Dishes
              </span>
            </div>
            {/* Carousel navigation arrows */}
            <div className="flex items-center gap-1.5 text-white/60">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                aria-label="Previous dishes"
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.15] active:scale-95 border border-white/[0.1] flex items-center justify-center transition-all hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                aria-label="Next dishes"
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.15] active:scale-95 border border-white/[0.1] flex items-center justify-center transition-all hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Sliding Carousel: 3 visible on first screen, slide right for remaining 7 dishes */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5"
          >
            {visibleTrendingDishes.map((dish) => (
              <div
                key={dish.id}
                className="w-full sm:w-[calc((100%-32px)/3)] min-w-[240px] sm:min-w-[calc((100%-32px)/3)] shrink-0 snap-start rounded-[16px] bg-[#0c0805] border border-white/[0.1] overflow-hidden shadow-lg group hover:border-white/[0.22] transition-all"
              >
                <div className="relative h-[118px] w-full bg-[#080503] overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between text-[12.5px] bg-[#0c0805]">
                  <span className="font-semibold text-white/95 truncate pr-2">
                    {dish.name}
                  </span>
                  <span className="text-white/60 text-[11.5px] shrink-0">
                    Price : <span className="font-black text-white ml-0.5">{dish.priceDisplay}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Real Operational Feed Drawer (Preserving live Convex & Supabase records) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLiveQueues((prev) => !prev)}
            className="w-full py-2 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/70 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#20d77e] animate-pulse" />
              <span>Live Operational Queues ({filteredOrders.length} Orders, {filteredBookings.length} Bookings)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <span>{showLiveQueues ? 'Collapse' : 'Expand Details'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLiveQueues ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showLiveQueues && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3">
              {/* Recent Orders Table */}
              <div className="rounded-[18px] bg-[#140e0a]/80 border border-white/[0.1] overflow-hidden shadow-inner">
                <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#20d77e]" />
                    <h3 className="text-xs font-bold text-white tracking-tight">Recent Orders</h3>
                  </div>
                  <Link href="/admin/orders" className="text-[11px] text-white/50 hover:text-white transition-colors">
                    View all &rarr;
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-black/40 text-white/45 border-b border-white/[0.06]">
                      <tr>
                        <th className="px-3.5 py-2 font-medium">ID</th>
                        <th className="px-3.5 py-2 font-medium">Customer</th>
                        <th className="px-3.5 py-2 font-medium">Status</th>
                        <th className="px-3.5 py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-white/75">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.03]">
                          <td className="px-3.5 py-2 font-mono text-[11px] text-[#d28bef]">
                            #{order.id?.slice(0, 6)}
                          </td>
                          <td className="px-3.5 py-2 text-white font-medium">
                            {order.customer_name || 'Guest'}
                          </td>
                          <td className="px-3.5 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-[#20d77e]/15 text-[#20d77e]">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-white font-bold">
                            {formatMoney(order.total_paise)}
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-white/40">
                            No active orders
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="rounded-[18px] bg-[#140e0a]/80 border border-white/[0.1] overflow-hidden shadow-inner">
                <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7888f4]" />
                    <h3 className="text-xs font-bold text-white tracking-tight">Recent Bookings</h3>
                  </div>
                  <Link href="/admin/bookings" className="text-[11px] text-white/50 hover:text-white transition-colors">
                    View all &rarr;
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-black/40 text-white/45 border-b border-white/[0.06]">
                      <tr>
                        <th className="px-3.5 py-2 font-medium">Guest</th>
                        <th className="px-3.5 py-2 font-medium">Schedule</th>
                        <th className="px-3.5 py-2 font-medium">Party</th>
                        <th className="px-3.5 py-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-white/75">
                      {filteredBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/[0.03]">
                          <td className="px-3.5 py-2 text-white font-medium">
                            {booking.customer_name || 'Guest'}
                          </td>
                          <td className="px-3.5 py-2 text-white/60">
                            {booking.booking_date} {booking.booking_time}
                          </td>
                          <td className="px-3.5 py-2 text-white/80">
                            {booking.guests} guests
                          </td>
                          <td className="px-3.5 py-2 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-[#7888f4]/15 text-[#7888f4]">
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredBookings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-white/40">
                            No reservations scheduled
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
