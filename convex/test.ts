import { mutation, query } from "./_generated/server";

// Test write mutation (no args needed for test)
export const insertSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.db.insert("test_connection", {
      text: "The Golden Oak Convex is 100% Connected!",
      timestamp: Date.now(),
      status: "ACTIVE",
    });
    return { success: true, insertedId: id };
  },
});

// Test read query
export const getTestMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("test_connection").collect();
  },
});
