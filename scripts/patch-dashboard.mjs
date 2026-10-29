import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

// Patch src/app/admin/(protected)/dashboard/page.tsx
const dashboardPath = path.join(projectRoot, 'src/app/admin/(protected)/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf-8').replace(/\r\n/g, '\n');

// Find start and end of data fetch
const startMarker = `  const today = new Date();\n  today.setHours(0, 0, 0, 0);`;
const endMarker = `  // Format today's date`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Orders (Convex Primary, Supabase Fallback)
  let recentOrders: Array<{ id: string; total_paise: number; status: string; order_type: string; created_at: string; customer_name: string }> = [];
  let totalOrdersToday = 0;
  let revenueToday = 0;

  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexOrders = await fetchQuery(api.orders.getOrderHistory, {});
    if (convexOrders && convexOrders.length > 0) {
      recentOrders = convexOrders.slice(0, 5).map((o: any) => ({
        id: o._id,
        total_paise: o.totalPaise || (o.subtotalPaise + (o.taxPaise || 0) + (o.tipPaise || 0)),
        status: o.status,
        order_type: o.orderType || 'dine-in',
        created_at: new Date(o.createdAt).toISOString(),
        customer_name: o.customerName || 'Guest Customer',
      }));

      const todayStart = today.getTime();
      const todaysConvexOrders = convexOrders.filter((o: any) => o.createdAt >= todayStart);
      totalOrdersToday = todaysConvexOrders.length;
      revenueToday = todaysConvexOrders
        .filter((o: any) => o.status === 'completed' || o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.totalPaise || 0), 0);
    }
  } catch {
    // fallback
  }

  if (recentOrders.length === 0) {
    try {
      const { data: sbOrders } = await supabase
        .from('orders')
        .select('id, total_paise, status, order_type, created_at, customer_name')
        .order('created_at', { ascending: false })
        .limit(5) as { data: Array<{ id: string; total_paise: number; status: string; order_type: string; created_at: string; customer_name: string }> | null };
      if (sbOrders) recentOrders = sbOrders;

      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total_paise, status')
        .gte('created_at', today.toISOString()) as { data: Array<{ total_paise: number; status: string }> | null };
      totalOrdersToday = todaysOrders?.length ?? 0;
      revenueToday = todaysOrders
        ?.filter(o => o.status === 'completed' || o.status === 'delivered')
        ?.reduce((sum, o) => sum + (o.total_paise ?? 0), 0) ?? 0;
    } catch {
      // ignore
    }
  }

  // 2. Bookings (Convex Primary, Supabase Fallback)
  let recentBookings: Array<{ id: string; customer_name: string; booking_date: string; booking_time: string; guests: number; status: string }> = [];
  let activeBookingsCount = 0;

  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexBookings = await fetchQuery(api.bookings.getAllBookings, {});
    if (convexBookings && convexBookings.length > 0) {
      recentBookings = convexBookings.slice(0, 5).map((b: any) => ({
        id: b._id,
        customer_name: b.customerName,
        booking_date: b.bookingDate,
        booking_time: b.bookingTime,
        guests: b.guests,
        status: b.status,
      }));
      activeBookingsCount = convexBookings.filter((b: any) => b.status === 'confirmed').length;
    }
  } catch {
    // fallback
  }

  if (recentBookings.length === 0) {
    try {
      const { data: sbBookings } = await supabase
        .from('bookings')
        .select('id, customer_name, booking_date, booking_time, guests, status')
        .order('created_at', { ascending: false })
        .limit(5) as { data: Array<{ id: string; customer_name: string; booking_date: string; booking_time: string; guests: number; status: string }> | null };
      if (sbBookings) {
        recentBookings = sbBookings;
        activeBookingsCount = sbBookings.filter(b => b.status === 'confirmed').length;
      }
    } catch {
      // ignore
    }
  }

  // 3. Asset Requests (Preserved fallback)
  let openIssuesCount = 0;
  let openAssetRequests: Array<{ id: string; request_type: string; status: string; dish_id: string | null }> = [];
  try {
    const { data: reqs } = await supabase
      .from('asset_requests')
      .select('id, request_type, status, dish_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false }) as { data: Array<{ id: string; request_type: string; status: string; dish_id: string | null }> | null };
    if (reqs) {
      openAssetRequests = reqs;
      openIssuesCount = reqs.length;
    }
  } catch {
    // ignore
  }

`;

  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(dashboardPath, content, 'utf-8');
  console.log('✓ Successfully updated dashboard page');
} else {
  console.error('Failed to locate markers in dashboard page');
}
