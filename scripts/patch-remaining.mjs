import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

// 1. Patch src/app/checkout/page.tsx
{
  const checkoutPath = path.join(projectRoot, 'src/app/checkout/page.tsx');
  let content = fs.readFileSync(checkoutPath, 'utf-8');

  // Replace useEffect to prefill details
  const oldUseEffect = `  useEffect(() => {
    setIsMounted(true);
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      if (s.tip_presets_percent && Array.isArray(s.tip_presets_percent)) {
        setTipPresets(s.tip_presets_percent);
      }
    }).catch(() => {});
  }, []);`;

  const newUseEffect = `  useEffect(() => {
    setIsMounted(true);
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      if (s.tip_presets_percent && Array.isArray(s.tip_presets_percent)) {
        setTipPresets(s.tip_presets_percent);
      }
    }).catch(() => {});

    // Check user & prefill details from Convex (primary) or Supabase (fallback)
    import('@/lib/auth/convex-auth-actions').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        if (user) {
          setDetails(prev => ({
            name: prev.name || user.name || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || '',
          }));
        } else {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
              if (sbUser) {
                setDetails(prev => ({
                  name: prev.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || '',
                  email: prev.email || sbUser.email || '',
                  phone: prev.phone || sbUser.user_metadata?.phone || '',
                }));
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      }).catch(() => {});
    });
  }, []);`;

  if (content.includes(oldUseEffect)) {
    content = content.replace(oldUseEffect, newUseEffect);
  } else {
    // Try normalized newlines
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(oldUseEffect.replace(/\r\n/g, '\n'), newUseEffect);
  }

  // Replace auth check in handlePlaceOrder
  const oldAuthCheck = `      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsSubmitting(false);
        router.push(\`/auth/login?returnUrl=\${encodeURIComponent('/checkout')}\`);
        return;
      }`;

  const newAuthCheck = `      let isAuthenticated = false;
      const { getCurrentUser } = await import('@/lib/auth/convex-auth-actions');
      const convexUser = await getCurrentUser();
      if (convexUser) {
        isAuthenticated = true;
      } else {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session) isAuthenticated = true;
        } catch {
          // ignore
        }
      }
      
      if (!isAuthenticated) {
        setIsSubmitting(false);
        router.push(\`/auth/login?returnUrl=\${encodeURIComponent('/checkout')}\`);
        return;
      }`;

  if (content.includes(oldAuthCheck)) {
    content = content.replace(oldAuthCheck, newAuthCheck);
  } else {
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(oldAuthCheck.replace(/\r\n/g, '\n'), newAuthCheck);
  }

  fs.writeFileSync(checkoutPath, content, 'utf-8');
  console.log('✓ Patched src/app/checkout/page.tsx');
}

// 2. Patch src/middleware.ts
{
  const middlewarePath = path.join(projectRoot, 'src/middleware.ts');
  const newMiddleware = `import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // Refresh session - Preserved Supabase auth fallback persistence
      await supabase.auth.getUser();
    }
  } catch {
    // Supabase fallback errors must never block Convex requests
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|gltf|woff|woff2)$).*)',
  ],
};
`;
  fs.writeFileSync(middlewarePath, newMiddleware, 'utf-8');
  console.log('✓ Patched src/middleware.ts');
}

// 3. Patch src/app/employee/(protected)/layout.tsx
{
  const layoutPath = path.join(projectRoot, 'src/app/employee/(protected)/layout.tsx');
  let content = fs.readFileSync(layoutPath, 'utf-8').replace(/\r\n/g, '\n');

  const oldLogout = `<form action={async () => {
            'use server';
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/employee/login');
          }}>`;

  const newLogout = `<form action={async () => {
            'use server';
            const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
            await signoutAction();
            try {
              const supabase = await createClient();
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            redirect('/employee/login');
          }}>`;

  content = content.replace(oldLogout, newLogout);
  fs.writeFileSync(layoutPath, content, 'utf-8');
  console.log('✓ Patched src/app/employee/(protected)/layout.tsx');
}

// 4. Patch src/components/admin/AdminSidebar.tsx
{
  const sidebarPath = path.join(projectRoot, 'src/components/admin/AdminSidebar.tsx');
  let content = fs.readFileSync(sidebarPath, 'utf-8').replace(/\r\n/g, '\n');

  const oldLogout = `  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };`;

  const newLogout = `  const handleLogout = async () => {
    try {
      const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
      await signoutAction();
    } catch {
      // ignore
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };`;

  content = content.replace(oldLogout, newLogout);
  fs.writeFileSync(sidebarPath, content, 'utf-8');
  console.log('✓ Patched src/components/admin/AdminSidebar.tsx');
}

// 5. Patch src/app/admin/(protected)/dashboard/page.tsx
{
  const dashboardPath = path.join(projectRoot, 'src/app/admin/(protected)/dashboard/page.tsx');
  let content = fs.readFileSync(dashboardPath, 'utf-8').replace(/\r\n/g, '\n');

  const oldDataFetch = `  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, total_paise, status, order_type, created_at, customer_name')
    .order('created_at', { ascending: false })
    .limit(5) as { data: Array<{ id: string; total_paise: number; status: string; order_type: string; created_at: string; customer_name: string }> | null; error: unknown };

  // Fetch today's summary stats
  const { data: todaysOrders } = await supabase
    .from('orders')
    .select('total_paise, status')
    .gte('created_at', today.toISOString()) as { data: Array<{ total_paise: number; status: string }> | null; error: unknown };

  const totalOrdersToday = todaysOrders?.length ?? 0;
  const revenueToday = todaysOrders
    ?.filter(o => o.status === 'completed' || o.status === 'delivered')
    ?.reduce((sum, o) => sum + (o.total_paise ?? 0), 0) ?? 0;

  // Fetch recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('id, customer_name, booking_date, booking_time, guests, status')
    .order('created_at', { ascending: false })
    .limit(5) as { data: Array<{ id: string; customer_name: string; booking_date: string; booking_time: string; guests: number; status: string }> | null; error: unknown };

  const activeBookingsCount = (recentBookings ?? []).filter(b => b.status === 'confirmed').length;

  // Fetch open asset requests
  const { data: openAssetRequests } = await supabase
    .from('asset_requests')
    .select('id, request_type, status, dish_id')
    .eq('status', 'open')
    .order('created_at', { ascending: false }) as { data: Array<{ id: string; request_type: string; status: string; dish_id: string | null }> | null; error: unknown };

  const openIssuesCount = openAssetRequests?.length ?? 0;`;

  const newDataFetch = `  const today = new Date();
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
        .limit(5);
      if (sbOrders) recentOrders = sbOrders;

      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total_paise, status')
        .gte('created_at', today.toISOString());
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
        .limit(5);
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
  try {
    const { data: openAssetRequests } = await supabase
      .from('asset_requests')
      .select('id, request_type, status, dish_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    openIssuesCount = openAssetRequests?.length ?? 0;
  } catch {
    // ignore
  }`;

  content = content.replace(oldDataFetch, newDataFetch);
  fs.writeFileSync(dashboardPath, content, 'utf-8');
  console.log('✓ Patched src/app/admin/(protected)/dashboard/page.tsx');
}

// 6. Patch src/app/employee/(protected)/orders/history/page.tsx
{
  const historyPath = path.join(projectRoot, 'src/app/employee/(protected)/orders/history/page.tsx');
  let content = fs.readFileSync(historyPath, 'utf-8').replace(/\r\n/g, '\n');

  const oldQueryLogic = `  let query = supabase
    .from('orders')
    .select(\`
      *,
      order_items (
        id, quantity, line_total_paise, special_instructions, dish_name
      )
    \`, { count: 'exact' })
    .in('status', status ? [status] : ['completed', 'cancelled']);

  if (q) {
    // If it's a number, it might be a table ID, otherwise order ID
    if (!isNaN(Number(q))) {
      query = query.or(\`id.ilike.%\${q}%,table_id.eq.\${q}\`);
    } else {
      query = query.ilike('id', \`%\${q}%\`);
    }
  }

  if (dateStr === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.gte('created_at', today.toISOString());
  } else if (dateStr === 'yesterday') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
  } else if (dateStr === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte('created_at', weekAgo.toISOString());
  }

  const { data: orders, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);`;

  const newQueryLogic = `  let orders: any[] = [];
  let count: number | null = 0;

  // 1. Convex Primary Query
  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexOrders = await fetchQuery(api.orders.getOrderHistory, {});
    if (convexOrders && convexOrders.length > 0) {
      let filtered = convexOrders.filter((o: any) => {
        if (status) return o.status === status;
        return ['completed', 'cancelled'].includes(o.status);
      });

      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = filtered.filter((o: any) =>
          o._id.toLowerCase().includes(lowerQ) ||
          (o.tableNumber && String(o.tableNumber).includes(lowerQ)) ||
          (o.customerName && o.customerName.toLowerCase().includes(lowerQ))
        );
      }

      if (dateStr === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((o: any) => o.createdAt >= today.getTime());
      } else if (dateStr === 'yesterday') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = filtered.filter((o: any) => o.createdAt >= yesterday.getTime() && o.createdAt < today.getTime());
      } else if (dateStr === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter((o: any) => o.createdAt >= weekAgo.getTime());
      }

      count = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);
      orders = paginated.map((o: any) => ({
        id: o._id,
        order_type: o.orderType,
        table_id: o.tableNumber || null,
        created_at: new Date(o.createdAt).toISOString(),
        order_items: (o.items || []).map((i: any) => ({
          dish_name: i.dishName,
          quantity: i.quantity,
          line_total_paise: i.lineTotalPaise,
        })),
        total_paise: o.totalPaise || (o.subtotalPaise + (o.taxPaise || 0) + (o.tipPaise || 0)),
        status: o.status,
        payment_status: o.paymentStatus || 'paid',
      }));
    }
  } catch {
    // fallback to Supabase
  }

  // 2. Supabase Fallback Query
  if (orders.length === 0) {
    try {
      let query = supabase
        .from('orders')
        .select(\`
          *,
          order_items (
            id, quantity, line_total_paise, special_instructions, dish_name
          )
        \`, { count: 'exact' })
        .in('status', status ? [status] : ['completed', 'cancelled']);

      if (q) {
        if (!isNaN(Number(q))) {
          query = query.or(\`id.ilike.%\${q}%,table_id.eq.\${q}\`);
        } else {
          query = query.ilike('id', \`%\${q}%\`);
        }
      }

      if (dateStr === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateStr === 'yesterday') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
      } else if (dateStr === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data: sbOrders, count: sbCount } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (sbOrders) {
        orders = sbOrders;
        count = sbCount;
      }
    } catch {
      // ignore
    }
  }`;

  content = content.replace(oldQueryLogic, newQueryLogic);
  fs.writeFileSync(historyPath, content, 'utf-8');
  console.log('✓ Patched src/app/employee/(protected)/orders/history/page.tsx');
}
