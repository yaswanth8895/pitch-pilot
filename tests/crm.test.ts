import { describe, expect, it } from "vitest";

import { parseCrmOutcome } from "../convex/crm";

describe("parseCrmOutcome", () => {
  it("accepts a valid final outcome", () => {
    expect(
      parseCrmOutcome(
        '{"summary":"Interested in a demo.","leadState":"INTERESTED","meetingBooked":false}',
      ),
    ).toEqual({
      summary: "Interested in a demo.",
      leadState: "INTERESTED",
      meetingBooked: false,
    });
  });

  it("forces the meeting-booked state when a meeting was booked", () => {
    expect(
      parseCrmOutcome(
        '{"summary":"Booked Tuesday.","leadState":"INTERESTED","meetingBooked":true}',
      ).leadState,
    ).toBe("MEETING_BOOKED");
  });

  it("rejects a state outside the fixed lead states", () => {
    expect(() =>
      parseCrmOutcome(
        '{"summary":"Follow up.","leadState":"FOLLOW_UP","meetingBooked":false}',
      ),
    ).toThrow("incomplete CRM outcome");
  });
});
