import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { leadState } from "./schema";

export const getContext = internalQuery({
  args: { leadId: v.string() },
  handler: async (ctx, { leadId }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id) return null;
    const lead = await ctx.db.get(id);
    if (!lead?.strategy || !["READY", "CALLING"].includes(lead.currentState)) {
      return null;
    }
    const organization = await ctx.db.get(lead.organizationId);
    if (!organization?.productKnowledge) return null;

    return {
      leadId: lead._id,
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      strategy: lead.strategy,
      productKnowledge: organization.productKnowledge,
    };
  },
});

export const reserveCall = internalMutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found.");
    if (lead.currentState !== "READY" || lead.callStarted) {
      throw new Error("This lead is not eligible for another call.");
    }
    const activeCall = await ctx.db
      .query("leads")
      .filter((query) => query.eq(query.field("currentState"), "CALLING"))
      .first();
    if (activeCall) throw new Error("Another lead is already being called.");

    await ctx.db.patch(leadId, {
      currentState: "CALLING",
      callStarted: true,
      history: [...lead.history, { timestamp: Date.now(), event: "Call Started" }],
    });
  },
});

export const receiveTranscript = internalMutation({
  args: {
    leadId: v.string(),
    transcript: v.string(),
  },
  handler: async (ctx, { leadId, transcript }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id) throw new Error("Invalid lead ID.");
    const lead = await ctx.db.get(id);
    if (!lead) throw new Error("Lead not found.");
    if (lead.currentState !== "CALLING") {
      throw new Error("Lead is not in an active call.");
    }

    await ctx.db.patch(id, {
      transcript,
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: "Transcript Received" },
      ],
    });
    await ctx.scheduler.runAfter(0, internal.ai.processTranscript, { leadId: id });
  },
});

export const getTranscriptContext = internalQuery({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead?.transcript) throw new Error("Transcript not found.");
    return {
      name: lead.name,
      company: lead.company,
      transcript: lead.transcript,
    };
  },
});

export const applyCrmOutcome = internalMutation({
  args: {
    leadId: v.id("leads"),
    summary: v.string(),
    currentState: leadState,
    meetingBooked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found.");
    const outcomeEvent = args.meetingBooked ? "Meeting Booked" : "Lead Updated";
    await ctx.db.patch(args.leadId, {
      summary: args.summary,
      currentState: args.currentState,
      meetingBooked: args.meetingBooked,
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: outcomeEvent },
      ],
    });
  },
});

export const failCall = internalMutation({
  args: { leadId: v.id("leads"), reason: v.string() },
  handler: async (ctx, { leadId, reason }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found.");
    await ctx.db.patch(leadId, {
      currentState: "FAILED",
      history: [
        ...lead.history,
        { timestamp: Date.now(), event: `Call Failed: ${reason}` },
      ],
    });
  },
});

export const startCall = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const serviceUrl = process.env.VOICE_SERVICE_URL;
    const secret = process.env.VOICE_SHARED_SECRET;
    if (!serviceUrl || !secret) throw new Error("Voice service is not configured.");

    await ctx.runMutation(internal.voice.reserveCall, { leadId });
    try {
      const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/start-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shared-Secret": secret,
        },
        body: JSON.stringify({ leadId }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Voice service returned ${response.status}.`);
      return (await response.json()) as { accepted: boolean; callId?: string };
    } catch (error) {
      await ctx.runMutation(internal.voice.failCall, {
        leadId,
        reason: error instanceof Error ? error.message : "Voice service failed.",
      });
      throw error;
    }
  },
});
