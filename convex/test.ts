import { internalMutation, internalQuery } from "./_generated/server";

// Internal test write mutation (CLI / dashboard only)
export const insertSampleData = internalMutation({
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

// Internal test read query
export const getTestMessages = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("test_connection").collect();
  },
});
