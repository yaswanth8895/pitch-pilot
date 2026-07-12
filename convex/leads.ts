import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("leads").order("desc").collect(),
});

export const getById = query({
  args: { leadId: v.string() },
  handler: async (ctx, { leadId }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    return id ? ctx.db.get(id) : null;
  },
});

export const importLeads = mutation({
  args: {
    leads: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        company: v.string(),
      }),
    ),
  },
  handler: async (ctx, { leads }) => {
    const organization = await ctx.db.query("organizations").first();
    if (!organization?.productKnowledge) {
      throw new Error("Generate product knowledge before importing leads.");
    }

    const existingLeads = await ctx.db.query("leads").collect();
    const existingKeys = new Set(
      existingLeads.map(
        (lead) => `${lead.phone.trim()}::${lead.company.trim().toLowerCase()}`,
      ),
    );

    let created = 0;
    let skipped = 0;
    for (const lead of leads) {
      const key = `${lead.phone.trim()}::${lead.company.trim().toLowerCase()}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }

      await ctx.db.insert("leads", {
        organizationId: organization._id,
        name: lead.name.trim(),
        phone: lead.phone.trim(),
        company: lead.company.trim(),
        currentState: "NEW",
        meetingBooked: false,
        callStarted: false,
        history: [{ timestamp: Date.now(), event: "Lead Created" }],
      });
      existingKeys.add(key);
      created += 1;
    }

    return { created, skipped, total: existingLeads.length + created };
  },
});
