import { describe, expect, it } from "vitest";

import { parseTranscript } from "../lib/transcript";

describe("parseTranscript", () => {
  it("splits a single-paragraph transcript into turns", () => {
    expect(
      parseTranscript(
        "Agent: Hello Aarav. Aarav: This sounds useful. Agent: Shall we meet?",
      ),
    ).toEqual([
      { speaker: "Agent", message: "Hello Aarav." },
      { speaker: "Aarav", message: "This sounds useful." },
      { speaker: "Agent", message: "Shall we meet?" },
    ]);
  });

  it("keeps unlabelled transcript text readable", () => {
    expect(parseTranscript("A call without speaker labels.")).toEqual([
      { speaker: "Transcript", message: "A call without speaker labels." },
    ]);
  });
});
