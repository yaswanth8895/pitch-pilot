import { ConvexError, v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

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

export const updateStrategy = mutation({
  args: { leadId: v.id("leads"), strategy: v.string() },
  handler: async (ctx, { leadId, strategy }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new ConvexError("Lead not found.");
    const value = strategy.trim();
    if (!value) throw new ConvexError("Strategy cannot be empty.");
    if (value.length > 12_000) throw new ConvexError("Strategy is too long.");

    await ctx.db.patch(leadId, {
      strategy: value,
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: "Strategy Updated" },
      ],
    });
  },
});

export const deleteLead = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) return { deleted: false };

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_lead", (query) => query.eq("leadId", leadId))
      .collect();
    for (const run of runs) await ctx.db.delete(run._id);
    await ctx.db.delete(leadId);
    return { deleted: true };
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

export const getStrategyInputs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const organization = await ctx.db.query("organizations").first();
    if (!organization?.productKnowledge) {
      throw new Error("Generate product knowledge before creating strategies.");
    }

    const leads = await ctx.db.query("leads").collect();
    return {
      productKnowledge: organization.productKnowledge,
      leads: leads.filter((lead) => lead.currentState === "NEW"),
    };
  },
});

export const saveStrategy = internalMutation({
  args: {
    leadId: v.id("leads"),
    strategy: v.string(),
    latency: v.number(),
  },
  handler: async (ctx, { leadId, strategy, latency }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead no longer exists.");

    await ctx.db.patch(leadId, {
      strategy,
      currentState: "READY",
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: "Strategy Generated" },
      ],
    });
    await ctx.db.insert("runs", {
      leadId,
      steps: [{ name: "Strategy Generated", status: "completed", latency, cost: 0 }],
      latency,
      cost: 0,
    });
  },
});

export const failStrategy = internalMutation({
  args: {
    leadId: v.id("leads"),
    latency: v.number(),
  },
  handler: async (ctx, { leadId, latency }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) return;

    await ctx.db.patch(leadId, {
      currentState: "FAILED",
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: "Strategy Generation Failed" },
      ],
    });
    await ctx.db.insert("runs", {
      leadId,
      steps: [{ name: "Strategy Generated", status: "failed", latency, cost: 0 }],
      latency,
      cost: 0,
    });
  },
});
