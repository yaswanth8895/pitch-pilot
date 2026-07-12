import { describe, expect, it } from "vitest";

import { parseProductKnowledge } from "../convex/productKnowledge";

const validKnowledge = {
  summary: "PitchPilot prepares outbound sales calls.",
  features: ["Product research"],
  pricing: ["Contact sales"],
  objections: ["Requires a phone number"],
  faq: [{ question: "Is it live?", answer: "Yes." }],
  benefits: ["Faster preparation"],
};

describe("parseProductKnowledge", () => {
  it("accepts a valid JSON object wrapped in a markdown fence", () => {
    expect(
      parseProductKnowledge(`\`\`\`json\n${JSON.stringify(validKnowledge)}\n\`\`\``),
    ).toEqual(validKnowledge);
  });

  it("rejects incomplete product knowledge", () => {
    expect(() => parseProductKnowledge('{"summary":"Missing fields"}')).toThrow(
      "incomplete product knowledge",
    );
  });

  it("returns a readable error for malformed JSON", () => {
    expect(() => parseProductKnowledge("not-json")).toThrow("invalid JSON");
  });
});
