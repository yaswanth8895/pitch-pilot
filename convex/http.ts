import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

function authorized(request: Request) {
  const expected = process.env.VOICE_SHARED_SECRET;
  return Boolean(expected && request.headers.get("X-Shared-Secret") === expected);
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

http.route({
  path: "/voice/context",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
    const leadId = new URL(request.url).searchParams.get("leadId");
    if (!leadId) return json({ error: "leadId is required" }, 400);
    const context = await ctx.runQuery(internal.voice.getContext, { leadId });
    return context ? json(context) : json({ error: "Lead not found or not ready" }, 404);
  }),
});

http.route({
  path: "/voice/completed",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
    const body = (await request.json()) as { leadId?: unknown; transcript?: unknown };
    if (typeof body.leadId !== "string" || typeof body.transcript !== "string") {
      return json({ error: "leadId and transcript are required" }, 400);
    }
    await ctx.runMutation(internal.voice.receiveTranscript, {
      leadId: body.leadId,
      transcript: body.transcript,
    });
    return json({ accepted: true }, 202);
  }),
});

http.route({
  path: "/voice/failed",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
    const body = (await request.json()) as { leadId?: unknown; reason?: unknown };
    if (typeof body.leadId !== "string" || typeof body.reason !== "string") {
      return json({ error: "leadId and reason are required" }, 400);
    }
    const context = await ctx.runQuery(internal.voice.getContext, { leadId: body.leadId });
    if (!context) return json({ error: "Lead not found" }, 404);
    await ctx.runMutation(internal.voice.failCall, {
      leadId: context.leadId,
      reason: body.reason,
    });
    return json({ accepted: true });
  }),
});

export default http;
