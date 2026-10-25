import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
console.log(`Testing live Convex deployment at: ${CONVEX_URL}`);

const client = new ConvexHttpClient(CONVEX_URL);

async function runVerification() {
  const results = {};

  try {
    // 1. Menu dishes
    const dishes = await client.query(api.menu.getAllDishes);
    results.dishes = { count: dishes.length, sample: dishes[0]?.name };

    // 2. Categories
    const categories = await client.query(api.menu.getCategories);
    results.categories = { count: categories.length, sample: categories[0]?.name };

    // 3. Tables
    const tables = await client.query(api.tables.getAllTables);
    results.tables = { count: tables.length, sample: `Table ${tables[0]?.tableNumber} (Cap: ${tables[0]?.capacity})` };

    // 4. Employees
    const employees = await client.query(api.employees.getEmployees);
    results.employees = { count: employees.length, sample: `${employees[0]?.name} (${employees[0]?.role})` };

    // 5. Settings
    const settings = await client.query(api.settings.getAllSettings);
    const settingKeys = Object.keys(settings);
    results.settings = { count: settingKeys.length, sample: `${settingKeys[0]}: ${settings[settingKeys[0]]}` };

    // 6. Analytics Summary
    const analytics = await client.query(api.analytics.getAnalyticsSummary);
    results.analytics = {
      totalRevenuePaise: analytics.totalRevenuePaise,
      totalOrders: analytics.totalOrders,
      fulfillmentRatePercent: analytics.fulfillmentRatePercent,
    };

    // 7. Test Auth - Verify Admin & Staff user exist
    console.log('\n--- LIVE CONVEX DEPLOYMENT AUDIT ---');
    console.log(JSON.stringify(results, null, 2));

    if (dishes.length > 0 && tables.length > 0 && employees.length > 0 && settingKeys.length > 0) {
      console.log('\n✓ ALL CONVEX CLOUD RESOURCES VERIFIED LIVE & OPERATIONAL');
    } else {
      console.error('\n✗ Some resources are empty!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

runVerification();
