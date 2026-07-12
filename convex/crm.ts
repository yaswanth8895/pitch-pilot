export type CrmOutcome = {
  summary: string;
  leadState: "INTERESTED" | "MEETING_BOOKED" | "NOT_INTERESTED" | "FAILED";
  meetingBooked: boolean;
};

const allowedStates = new Set([
  "INTERESTED",
  "MEETING_BOOKED",
  "NOT_INTERESTED",
  "FAILED",
]);

export function parseCrmOutcome(content: string): CrmOutcome {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let value: unknown;
  try {
    value = JSON.parse(cleaned);
  } catch {
    throw new Error("Hermes returned invalid CRM JSON.");
  }

  if (!value || typeof value !== "object") {
    throw new Error("Hermes returned an invalid CRM outcome.");
  }

  const result = value as Record<string, unknown>;
  if (
    typeof result.summary !== "string" ||
    typeof result.leadState !== "string" ||
    !allowedStates.has(result.leadState) ||
    typeof result.meetingBooked !== "boolean"
  ) {
    throw new Error("Hermes returned an incomplete CRM outcome.");
  }

  return {
    summary: result.summary,
    leadState: result.meetingBooked
      ? "MEETING_BOOKED"
      : (result.leadState as CrmOutcome["leadState"]),
    meetingBooked: result.meetingBooked,
  };
}
