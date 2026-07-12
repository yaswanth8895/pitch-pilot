import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireUser } from "./authz";

export const listByLead = query({
  args: { leadId: v.string() },
  handler: async (ctx, { leadId }) => {
    await requireUser(ctx);
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id) return [];
    return ctx.db
      .query("calls")
      .withIndex("by_lead", (query) => query.eq("leadId", id))
      .order("desc")
      .collect();
  },
});
