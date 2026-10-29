const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  'restaurants',
  'categories',
  'dishes',
  'orders',
  'order_items',
  'bookings',
  'restaurant_settings',
  'employees',
  'tables',
  'profiles',
  'audit_logs',
  'asset_requests'
];

async function countSupabase() {
  console.log('--- SUPABASE (PRESERVED FALLBACK) COUNTS ---');
  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`${t}: error (${error.message})`);
      } else {
        console.log(`${t}: ${count}`);
      }
    } catch (e) {
      console.log(`${t}: exception (${e.message})`);
    }
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error && data) {
      // get total count if available
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      console.log(`supabase_auth_users: ${allUsers?.users?.length || 0}`);
    }
  } catch (e) {}
}

countSupabase();
