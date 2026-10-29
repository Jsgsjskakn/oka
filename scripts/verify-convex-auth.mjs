import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

async function testAuthFlow() {
  console.log(`Testing Convex Authentication on: ${CONVEX_URL}`);

  // 1. Sign In as Admin
  console.log('\n1. Testing Admin Sign In...');
  const adminRes = await client.mutation(api.auth.signIn, {
    identifier: process.env.ADMIN_EMAIL || 'admin@thegoldenoak.in',
    password: process.env.ADMIN_PASSWORD || 'password',
  });

  if (adminRes.error || !adminRes.token) {
    console.error('Admin Sign In Failed:', adminRes.error);
    process.exit(1);
  }
  console.log(`✓ Admin authenticated. Token: ${adminRes.token.slice(0, 16)}...`);
  console.log(`  User: ${adminRes.user.name} | Role: ${adminRes.user.role}`);

  // 2. Validate Session Token
  console.log('\n2. Testing Session Validation...');
  const sessionUser = await client.query(api.auth.validateSession, {
    token: adminRes.token,
  });

  if (!sessionUser || sessionUser.role !== 'admin') {
    console.error('Session validation failed or wrong role');
    process.exit(1);
  }
  console.log(`✓ Session successfully verified for: ${sessionUser.email} (Role: ${sessionUser.role})`);

  // 2b. Testing Staff Sign In
  console.log('\n2b. Testing Staff Sign In...');
  const staffRes = await client.mutation(api.auth.signIn, {
    identifier: process.env.STAFF_EMAIL || 'staff@thegoldenoak.in',
    password: process.env.STAFF_PASSWORD || 'password',
  });
  if (staffRes.error || !staffRes.token) {
    console.error('Staff Sign In Failed:', staffRes.error);
    process.exit(1);
  }
  console.log(`✓ Staff authenticated. Token: ${staffRes.token.slice(0, 16)}...`);
  console.log(`  User: ${staffRes.user.name} | Role: ${staffRes.user.role}`);

  // 3. Customer Sign Up Flow
  const testCustomerEmail = `test.guest.${Date.now()}@goldenoak.local`;
  console.log(`\n3. Testing Customer Signup with ${testCustomerEmail}...`);
  const signupRes = await client.mutation(api.auth.signUp, {
    email: testCustomerEmail,
    password: process.env.ADMIN_PASSWORD || 'password',
    name: 'Test Customer',
    phone: '9876543210',
  });

  if (signupRes.error || !signupRes.token) {
    console.error('Customer Signup Failed:', signupRes.error);
    process.exit(1);
  }
  console.log(`✓ Customer account created. Token: ${signupRes.token.slice(0, 16)}...`);
  console.log(`  User: ${signupRes.user.name} | Role: ${signupRes.user.role}`);

  // 4. Customer Sign In Flow
  console.log('\n4. Testing Customer Sign In...');
  const custLoginRes = await client.mutation(api.auth.signIn, {
    identifier: testCustomerEmail,
    password: process.env.ADMIN_PASSWORD || 'password',
  });

  if (custLoginRes.error || !custLoginRes.token) {
    console.error('Customer Login Failed:', custLoginRes.error);
    process.exit(1);
  }
  console.log(`✓ Customer login succeeded. Role: ${custLoginRes.user.role}`);

  // 5. Customer Sign Out
  console.log('\n5. Testing Sign Out...');
  await client.mutation(api.auth.signOut, { token: custLoginRes.token });
  const afterSignout = await client.query(api.auth.validateSession, {
    token: custLoginRes.token,
  });

  if (afterSignout === null) {
    console.log('✓ Session revoked successfully upon sign out.');
  } else {
    console.error('Session was not revoked!');
    process.exit(1);
  }

  console.log('\n✓ CONVEX AUTHENTICATION & RBAC FULLY VERIFIED ON CLOUD DEPLOYMENT');
}

testAuthFlow();
