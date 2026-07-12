import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const leadState = v.union(
  v.literal("NEW"),
  v.literal("READY"),
  v.literal("CALLING"),
  v.literal("INTERESTED"),
  v.literal("MEETING_BOOKED"),
  v.literal("NOT_INTERESTED"),
  v.literal("FAILED"),
);

const historyItem = v.object({
  timestamp: v.number(),
  event: v.string(),
});

export const callStatus = v.union(
  v.literal("STARTING"),
  v.literal("CALLING"),
  v.literal("PROCESSING"),
  v.literal("COMPLETED"),
  v.literal("FAILED"),
);

const productKnowledge = v.object({
  summary: v.string(),
  features: v.array(v.string()),
  pricing: v.array(v.string()),
  objections: v.array(v.string()),
  faq: v.array(
    v.object({
      question: v.string(),
      answer: v.string(),
    }),
  ),
  benefits: v.array(v.string()),
});

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    landingPage: v.string(),
    productKnowledge: v.optional(productKnowledge),
    history: v.array(historyItem),
  }),
  leads: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    phone: v.string(),
    company: v.string(),
    strategy: v.optional(v.string()),
    currentState: leadState,
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    meetingBooked: v.boolean(),
    callStarted: v.boolean(),
    history: v.array(historyItem),
  }).index("by_organization", ["organizationId"]),
  calls: defineTable({
    leadId: v.id("leads"),
    externalCallId: v.optional(v.string()),
    status: callStatus,
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    outcome: v.optional(leadState),
    meetingBooked: v.boolean(),
    failureReason: v.optional(v.string()),
    history: v.array(historyItem),
  })
    .index("by_lead", ["leadId"])
    .index("by_external_call", ["externalCallId"]),
  runs: defineTable({
    leadId: v.id("leads"),
    steps: v.array(
      v.object({
        name: v.string(),
        status: v.string(),
        latency: v.optional(v.number()),
        cost: v.optional(v.number()),
      }),
    ),
    latency: v.number(),
    cost: v.number(),
  }).index("by_lead", ["leadId"]),
});
