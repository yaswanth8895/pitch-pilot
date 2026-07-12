import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { parseProductKnowledge } from "./productKnowledge";
import { cleanStrategy } from "./strategy";

const PRODUCT_EXPERT_PROMPT = `You are the Product Expert for an outbound sales team.
Analyze only the supplied landing-page content and return a JSON object with exactly this shape:
{
  "summary": "Concise description of the product and target customer",
  "features": ["Feature"],
  "pricing": ["Published pricing detail, or 'Pricing not published'"],
  "objections": ["Likely buyer objection with enough context to prepare a response"],
  "faq": [{"question": "Question", "answer": "Answer grounded in the page"}],
  "benefits": ["Outcome or benefit"]
}
Return JSON only. Do not use markdown fences. Do not invent facts. If a category is absent, use an empty array except pricing, which must state that pricing was not published.`;

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function validateLandingPage(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid landing-page URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Landing-page URL must use http or https.");
  }

  return url.toString();
}

export const extractProductKnowledge = action({
  args: { landingPage: v.string() },
  handler: async (ctx, { landingPage }) => {
    const normalizedUrl = validateLandingPage(landingPage);
    const linkupApiKey = getRequiredEnvironmentVariable("LINKUP_API_KEY");
    const hermesBaseUrl = getRequiredEnvironmentVariable("HERMES_BASE_URL").replace(/\/$/, "");
    const hermesApiKey = getRequiredEnvironmentVariable("HERMES_API_KEY");

    const linkupResponse = await fetch("https://api.linkup.so/v1/fetch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linkupApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: normalizedUrl,
        extractImages: false,
        includeRawHtml: false,
        renderJs: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!linkupResponse.ok) {
      throw new Error(`Linkup could not fetch this page (${linkupResponse.status}).`);
    }

    const linkupResult = (await linkupResponse.json()) as { markdown?: unknown };
    if (typeof linkupResult.markdown !== "string" || !linkupResult.markdown.trim()) {
      throw new Error("Linkup returned no readable landing-page content.");
    }

    const pageContent = linkupResult.markdown.slice(0, 40_000);
    const hermesResponse = await fetch(`${hermesBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hermesApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hermes-agent",
        messages: [
          { role: "system", content: PRODUCT_EXPERT_PROMPT },
          {
            role: "user",
            content: `Landing page: ${normalizedUrl}\n\nContent:\n${pageContent}`,
          },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!hermesResponse.ok) {
      throw new Error(`Hermes could not analyze this page (${hermesResponse.status}).`);
    }

    const hermesResult = (await hermesResponse.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = hermesResult.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Hermes returned no product analysis.");
    }

    const productKnowledge = parseProductKnowledge(content);
    await ctx.runMutation(internal.organizations.saveProductKnowledge, {
      landingPage: normalizedUrl,
      productKnowledge,
    });

    return productKnowledge;
  },
});

const STRATEGY_PROMPT = `You are the Strategy Agent for an outbound sales team.
Create a concise, practical call strategy using only the supplied product knowledge and lead information.
Return readable Markdown with exactly these sections:
## Why this lead
## Opening
## Discovery questions
## Likely objections
## Suggested responses
## Call goal

Personalize the strategy for the lead's company without inventing private facts. Keep the entire strategy under 450 words.`;

export const generateStrategies = action({
  args: {},
  handler: async (ctx) => {
    const { productKnowledge, leads } = await ctx.runQuery(
      internal.leads.getStrategyInputs,
    );
    if (leads.length === 0) {
      return { ready: 0, failed: 0, message: "No new leads need strategies." };
    }

    const hermesBaseUrl = getRequiredEnvironmentVariable("HERMES_BASE_URL").replace(/\/$/, "");
    const hermesApiKey = getRequiredEnvironmentVariable("HERMES_API_KEY");
    let ready = 0;
    let failed = 0;

    for (const lead of leads) {
      const startedAt = Date.now();
      try {
        const response = await fetch(`${hermesBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hermesApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "hermes-agent",
            messages: [
              { role: "system", content: STRATEGY_PROMPT },
              {
                role: "user",
                content: `Product knowledge:\n${JSON.stringify(productKnowledge)}\n\nLead:\n${JSON.stringify({ name: lead.name, phone: lead.phone, company: lead.company })}`,
              },
            ],
            stream: false,
          }),
          signal: AbortSignal.timeout(90_000),
        });

        if (!response.ok) {
          throw new Error(`Hermes returned ${response.status}.`);
        }

        const result = (await response.json()) as {
          choices?: Array<{ message?: { content?: unknown } }>;
        };
        const content = result.choices?.[0]?.message?.content;
        if (typeof content !== "string") {
          throw new Error("Hermes returned no strategy.");
        }

        await ctx.runMutation(internal.leads.saveStrategy, {
          leadId: lead._id,
          strategy: cleanStrategy(content),
          latency: Date.now() - startedAt,
        });
        ready += 1;
      } catch {
        await ctx.runMutation(internal.leads.failStrategy, {
          leadId: lead._id,
          latency: Date.now() - startedAt,
        });
        failed += 1;
      }
    }

    return { ready, failed };
  },
});
