import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => ctx.db.query("organizations").first(),
});

export const saveProductKnowledge = internalMutation({
  args: {
    landingPage: v.string(),
    productKnowledge: v.object({
      summary: v.string(),
      features: v.array(v.string()),
      pricing: v.array(v.string()),
      objections: v.array(v.string()),
      faq: v.array(v.object({ question: v.string(), answer: v.string() })),
      benefits: v.array(v.string()),
    }),
  },
  handler: async (ctx, { landingPage, productKnowledge }) => {
    const organization = await ctx.db.query("organizations").first();
    const event = { timestamp: Date.now(), event: "Product Knowledge Generated" };

    if (organization) {
      await ctx.db.patch(organization._id, {
        landingPage,
        productKnowledge,
        history: [...organization.history, event],
      });
      return organization._id;
    }

    return ctx.db.insert("organizations", {
      name: "PitchPilot Demo",
      landingPage,
      productKnowledge,
      history: [event],
    });
  },
});
