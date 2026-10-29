import { execSync } from 'child_process';

const tables = [
  'restaurants',
  'categories',
  'dishes',
  'orders',
  'bookings',
  'restaurant_settings',
  'employees',
  'tables',
  'users',
  'sessions',
  'test_connection'
];

console.log('--- CONVEX TABLE RECORD COUNTS ---');
const tableCounts = {};
let usersData = [];
let ordersData = [];
let bookingsData = [];

for (const t of tables) {
  try {
    const raw = execSync(`npx convex data ${t} --format json`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const parsed = JSON.parse(raw);
    tableCounts[t] = parsed.length;
    if (t === 'users') usersData = parsed;
    if (t === 'orders') ordersData = parsed;
    if (t === 'bookings') bookingsData = parsed;
  } catch (err) {
    tableCounts[t] = 'Error reading';
  }
}

for (const [t, count] of Object.entries(tableCounts)) {
  console.log(`${t}: ${count}`);
}

console.log('\n--- ACCOUNT BREAKDOWN (ZERO PII EXPOSED) ---');
const customerCount = usersData.filter(u => u.role === 'customer').length;
const adminCount = usersData.filter(u => u.role === 'admin').length;
const staffCount = usersData.filter(u => ['staff', 'employee', 'manager', 'chef'].includes(u.role)).length;
console.log(`Total User Accounts: ${usersData.length}`);
console.log(`Customer Accounts: ${customerCount}`);
console.log(`Admin Accounts: ${adminCount}`);
console.log(`Staff/Employee Accounts: ${staffCount}`);

console.log('\n--- LINKED TRANSACTIONS BREAKDOWN ---');
console.log(`Total Orders: ${ordersData.length}`);
console.log(`Orders with Customer Details: ${ordersData.filter(o => o.customerPhone || o.customerEmail).length}`);
console.log(`Total Bookings: ${bookingsData.length}`);
console.log(`Bookings with Customer Details: ${bookingsData.filter(b => b.customerPhone || b.customerEmail).length}`);
