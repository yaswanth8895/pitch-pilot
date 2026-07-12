import { describe, expect, it } from "vitest";

import { cleanStrategy } from "../convex/strategy";

describe("cleanStrategy", () => {
  it("trims a generated strategy", () => {
    expect(cleanStrategy("\n## Opening\nLead with the missed-call problem.\n")).toBe(
      "## Opening\nLead with the missed-call problem.",
    );
  });

  it("rejects an empty strategy", () => {
    expect(() => cleanStrategy("   ")).toThrow("empty strategy");
  });
});
