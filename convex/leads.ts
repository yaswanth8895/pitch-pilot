import { v } from "convex/values";

import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("leads").order("desc").collect(),
});

export const getById = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => ctx.db.get(leadId),
});
