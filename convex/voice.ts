import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./authz";
import { leadState } from "./schema";

const ACTIVE_CALL_STATUSES = new Set(["STARTING", "CALLING", "PROCESSING"]);

export const getContext = internalQuery({
  args: { leadId: v.string() },
  handler: async (ctx, { leadId }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id) return null;
    const lead = await ctx.db.get(id);
    if (!lead?.strategy || lead.currentState !== "CALLING") return null;
    const organization = await ctx.db.get(lead.organizationId);
    if (!organization?.productKnowledge) return null;

    const completedCalls = (await ctx.db
      .query("calls")
      .withIndex("by_lead", (query) => query.eq("leadId", id))
      .collect())
      .filter((call) => call.status === "COMPLETED" && call.summary)
      .sort((a, b) => a.startedAt - b.startedAt);
    const summaries = completedCalls.map(
      (call) =>
        `${new Date(call.startedAt).toISOString()}: ${call.summary} Outcome: ${call.outcome ?? "UNKNOWN"}.`,
    );
    if (summaries.length === 0 && lead.callStarted && lead.summary) {
      summaries.push(`Earlier call: ${lead.summary} Outcome: ${lead.currentState}.`);
    }
    const priorContext = summaries.length
      ? `\n\n## Previous conversations\n${summaries
          .map(
            (summary, index) => `${index + 1}. ${summary}`,
          )
          .join("\n")}\nContinue naturally from these conversations. Do not repeat questions already answered.`
      : "";

    return {
      leadId: lead._id,
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      strategy: `${lead.strategy}${
        lead.leadContext
          ? `\n\n## Lead context\n${lead.leadContext}\nUse this context naturally and do not state unverified details as fact.`
          : ""
      }${priorContext}`,
      productKnowledge: organization.productKnowledge,
    };
  },
});

export const reserveCall = internalMutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found.");
    if (!lead.strategy || lead.currentState === "NEW" || lead.currentState === "CALLING") {
      throw new Error("This lead is not ready for another call.");
    }
    const allCalls = await ctx.db.query("calls").collect();
    const activeCalls = allCalls.filter((call) => ACTIVE_CALL_STATUSES.has(call.status));
    if (activeCalls.length >= 20) {
      throw new Error("The 20-call concurrency limit has been reached.");
    }
    if (activeCalls.some((call) => call.leadId === leadId)) {
      throw new Error("A call is already active for this lead.");
    }

    const now = Date.now();
    const callRecordId = await ctx.db.insert("calls", {
      leadId,
      status: "STARTING",
      startedAt: now,
      meetingBooked: false,
      history: [{ timestamp: now, event: "Call Requested" }],
    });
    await ctx.db.patch(leadId, {
      currentState: "CALLING",
      callStarted: true,
      history: [...lead.history, { timestamp: now, event: "Call Started" }],
    });
    return callRecordId;
  },
});

export const attachExternalCall = internalMutation({
  args: { callRecordId: v.id("calls"), externalCallId: v.optional(v.string()) },
  handler: async (ctx, { callRecordId, externalCallId }) => {
    const call = await ctx.db.get(callRecordId);
    if (!call) return;
    await ctx.db.patch(callRecordId, {
      externalCallId,
      ...(call.status === "STARTING" ? { status: "CALLING" as const } : {}),
      history: [...call.history, { timestamp: Date.now(), event: "Voice Call Accepted" }],
    });
  },
});

async function findCall(
  ctx: MutationCtx,
  leadId: Id<"leads">,
  externalCallId?: string,
) {
  if (externalCallId) {
    const matched = await ctx.db
      .query("calls")
      .withIndex("by_external_call", (query) => query.eq("externalCallId", externalCallId))
      .first();
    if (matched?.leadId === leadId) return matched;
  }
  const calls = await ctx.db
    .query("calls")
    .withIndex("by_lead", (query) => query.eq("leadId", leadId))
    .order("desc")
    .collect();
  return calls.find((call) => ACTIVE_CALL_STATUSES.has(call.status)) ?? null;
}

export const receiveTranscript = internalMutation({
  args: { leadId: v.string(), callId: v.optional(v.string()), transcript: v.string() },
  handler: async (ctx, { leadId, callId, transcript }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id) return { accepted: false as const, reason: "not_found" as const };
    const lead = await ctx.db.get(id);
    if (!lead) return { accepted: false as const, reason: "not_found" as const };
    let call = await findCall(ctx, id, callId);
    if (!call && lead.callStarted && lead.currentState === "CALLING") {
      const now = Date.now();
      const callRecordId = await ctx.db.insert("calls", {
        leadId: id,
        externalCallId: callId,
        status: "CALLING",
        startedAt: now,
        meetingBooked: false,
        history: [{ timestamp: now, event: "Legacy Call Recovered" }],
      });
      call = await ctx.db.get(callRecordId);
    }
    if (!call) return { accepted: false as const, reason: "not_started" as const };
    if (call.transcript) return { accepted: true as const, duplicate: true };

    const now = Date.now();
    const value = transcript.trim();
    await ctx.db.patch(call._id, {
      externalCallId: call.externalCallId ?? callId,
      status: "PROCESSING",
      endedAt: now,
      transcript: value,
      history: [...call.history, { timestamp: now, event: "Transcript Received" }],
    });
    await ctx.db.patch(id, {
      transcript: value,
      history: [...lead.history, { timestamp: now, event: "Transcript Received" }],
    });
    await ctx.scheduler.runAfter(0, internal.ai.processTranscript, { callRecordId: call._id });
    return { accepted: true as const, duplicate: false };
  },
});

export const getTranscriptContext = internalQuery({
  args: { callRecordId: v.id("calls") },
  handler: async (ctx, { callRecordId }) => {
    const call = await ctx.db.get(callRecordId);
    if (!call?.transcript) throw new Error("Transcript not found.");
    const lead = await ctx.db.get(call.leadId);
    if (!lead) throw new Error("Lead not found.");
    return { name: lead.name, company: lead.company, transcript: call.transcript };
  },
});

export const getCallLeadId = internalQuery({
  args: { callRecordId: v.id("calls") },
  handler: async (ctx, { callRecordId }) => {
    const call = await ctx.db.get(callRecordId);
    return call ? { leadId: call.leadId } : null;
  },
});

export const applyCrmOutcome = internalMutation({
  args: {
    callRecordId: v.id("calls"),
    summary: v.string(),
    currentState: leadState,
    meetingBooked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callRecordId);
    if (!call) return;
    const lead = await ctx.db.get(call.leadId);
    if (!lead) return;
    const now = Date.now();
    const event = args.meetingBooked ? "Meeting Booked" : "Lead Updated";
    await ctx.db.patch(call._id, {
      status: "COMPLETED",
      endedAt: call.endedAt ?? now,
      summary: args.summary,
      outcome: args.currentState,
      meetingBooked: args.meetingBooked,
      history: [...call.history, { timestamp: now, event }],
    });
    await ctx.db.patch(lead._id, {
      summary: args.summary,
      currentState: args.currentState,
      meetingBooked: args.meetingBooked,
      history: [...lead.history, { timestamp: now, event }],
    });
  },
});

export const failCall = internalMutation({
  args: {
    leadId: v.id("leads"),
    callRecordId: v.optional(v.id("calls")),
    callId: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, { leadId, callRecordId, callId, reason }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) return { skipped: true };
    const call = callRecordId
      ? await ctx.db.get(callRecordId)
      : await findCall(ctx, leadId, callId);
    const now = Date.now();
    if (call && call.status !== "COMPLETED") {
      await ctx.db.patch(call._id, {
        externalCallId: call.externalCallId ?? callId,
        status: "FAILED",
        endedAt: now,
        failureReason: reason,
        outcome: "FAILED",
        history: [...call.history, { timestamp: now, event: `Call Failed: ${reason}` }],
      });
    }
    await ctx.db.patch(leadId, {
      currentState: "FAILED",
      history: [...lead.history, { timestamp: now, event: `Call Failed: ${reason}` }],
    });
    return { skipped: false };
  },
});

export const receiveFailure = internalMutation({
  args: { leadId: v.string(), callId: v.optional(v.string()), reason: v.string() },
  handler: async (ctx, { leadId, callId, reason }) => {
    const id = ctx.db.normalizeId("leads", leadId);
    if (!id || !(await ctx.db.get(id))) return { skipped: true };
    const call = await findCall(ctx, id, callId);
    const lead = await ctx.db.get(id);
    if (!lead) return { skipped: true };
    if (!call || call.status === "COMPLETED") return { skipped: true };
    const now = Date.now();
    await ctx.db.patch(call._id, {
      externalCallId: call.externalCallId ?? callId,
      status: "FAILED",
      endedAt: now,
      failureReason: reason,
      outcome: "FAILED",
      history: [...call.history, { timestamp: now, event: `Call Failed: ${reason}` }],
    });
    await ctx.db.patch(id, {
      currentState: "FAILED",
      history: [...lead.history, { timestamp: now, event: `Call Failed: ${reason}` }],
    });
    return { skipped: false };
  },
});

export const startCall = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    await requireUser(ctx);
    const serviceUrl = process.env.VOICE_SERVICE_URL;
    const secret = process.env.VOICE_SHARED_SECRET;
    if (!serviceUrl || !secret) throw new Error("Voice service is not configured.");

    const callRecordId = await ctx.runMutation(internal.voice.reserveCall, { leadId });
    try {
      const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/start-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shared-Secret": secret },
        body: JSON.stringify({ leadId }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Voice service returned ${response.status}.`);
      const result = (await response.json()) as { accepted: boolean; callId?: string };
      if (!result.accepted) throw new Error("Voice service did not accept the call.");
      await ctx.runMutation(internal.voice.attachExternalCall, {
        callRecordId,
        externalCallId: result.callId,
      });
      return result;
    } catch (error) {
      await ctx.runMutation(internal.voice.failCall, {
        leadId,
        callRecordId,
        reason: error instanceof Error ? error.message : "Voice service failed.",
      });
      throw error;
    }
  },
});
