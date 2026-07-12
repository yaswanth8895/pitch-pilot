import { v } from "convex/values";

import { mutation } from "./_generated/server";

const productKnowledge = {
  summary:
    "PitchPilot turns a product page and lead list into researched outbound calls with live CRM-style outcomes.",
  features: [
    "Landing-page product extraction",
    "Personalized lead strategies",
    "AI outbound phone calls",
    "Live transcript and outcome tracking",
  ],
  pricing: ["Demo pricing is tailored to call volume."],
  objections: [
    "We already handle outbound manually.",
    "AI calls may not sound natural.",
    "We need outcomes in our existing workflow.",
  ],
  faq: [
    {
      question: "How quickly can a campaign start?",
      answer: "A landing page and CSV are enough to prepare the first lead.",
    },
    {
      question: "What happens after a call?",
      answer: "The transcript is summarized and the lead state updates automatically.",
    },
  ],
  benefits: [
    "Research every lead consistently",
    "Reach more prospects without adding manual work",
    "See call outcomes immediately",
  ],
};

export const reset = mutation({
  args: {
    secret: v.string(),
    mode: v.union(
      v.literal("leads"),
      v.literal("clean"),
      v.literal("showcase"),
    ),
  },
  handler: async (ctx, { secret, mode }) => {
    const expected = process.env.DEMO_RESET_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("Invalid demo reset secret.");
    }

    for (const run of await ctx.db.query("runs").collect()) {
      await ctx.db.delete(run._id);
    }
    for (const lead of await ctx.db.query("leads").collect()) {
      await ctx.db.delete(lead._id);
    }

    if (mode === "leads") {
      const organizations = await ctx.db.query("organizations").collect();
      return { mode, organizations: organizations.length, leads: 0 };
    }

    for (const organization of await ctx.db.query("organizations").collect()) {
      await ctx.db.delete(organization._id);
    }

    if (mode === "clean") return { mode, organizations: 0, leads: 0 };

    const now = Date.now();
    const organizationId = await ctx.db.insert("organizations", {
      name: "PitchPilot Demo",
      landingPage: "https://pitch-pilot.pages.dev",
      productKnowledge,
      history: [{ timestamp: now - 180_000, event: "Product Knowledge Generated" }],
    });

    const completedLeadId = await ctx.db.insert("leads", {
      organizationId,
      name: "Aarav Mehta",
      phone: "+1 415 555 0136",
      company: "Northstar Dental",
      strategy:
        "Open with Northstar Dental's missed-call risk, connect after-hours coverage to booked patients, confirm their current process, and offer a short tailored walkthrough.",
      currentState: "MEETING_BOOKED",
      transcript:
        "Agent: Hi Aarav, we help dental practices answer calls and book patients.\nAarav: We miss several after-hours calls each week.\nAgent: Would a tailored demo be useful?\nAarav: Yes, let us meet Tuesday at 2 PM.\nAgent: Great, I have noted Tuesday at 2 PM.",
      summary:
        "Aarav confirmed missed after-hours calls and agreed to a tailored demo Tuesday at 2 PM.",
      meetingBooked: true,
      callStarted: true,
      history: [
        { timestamp: now - 150_000, event: "Lead Created" },
        { timestamp: now - 120_000, event: "Strategy Generated" },
        { timestamp: now - 90_000, event: "Call Started" },
        { timestamp: now - 30_000, event: "Meeting Booked" },
        { timestamp: now - 20_000, event: "Lead Updated" },
      ],
    });

    const readyLeadId = await ctx.db.insert("leads", {
      organizationId,
      name: "Maya Chen",
      phone: "+1 415 555 0188",
      company: "BrightSmile Group",
      strategy:
        "Ask how BrightSmile handles overflow calls across locations, quantify missed bookings, and position PitchPilot as a consistent follow-up layer.",
      currentState: "READY",
      meetingBooked: false,
      callStarted: false,
      history: [
        { timestamp: now - 145_000, event: "Lead Created" },
        { timestamp: now - 110_000, event: "Strategy Generated" },
      ],
    });

    await ctx.db.insert("runs", {
      leadId: completedLeadId,
      steps: [{ name: "Strategy Generated", status: "completed", latency: 1240, cost: 0 }],
      latency: 1240,
      cost: 0,
    });
    await ctx.db.insert("runs", {
      leadId: readyLeadId,
      steps: [{ name: "Strategy Generated", status: "completed", latency: 980, cost: 0 }],
      latency: 980,
      cost: 0,
    });

    return { mode, organizations: 1, leads: 2 };
  },
});
