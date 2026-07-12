export type ProductKnowledge = {
  summary: string;
  features: string[];
  pricing: string[];
  objections: string[];
  faq: Array<{ question: string; answer: string }>;
  benefits: string[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseProductKnowledge(content: string): ProductKnowledge {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Hermes returned invalid JSON. Please try the extraction again.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Hermes returned an invalid product knowledge object.");
  }

  const value = parsed as Record<string, unknown>;
  const faqIsValid =
    Array.isArray(value.faq) &&
    value.faq.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).question === "string" &&
        typeof (item as Record<string, unknown>).answer === "string",
    );

  if (
    typeof value.summary !== "string" ||
    !isStringArray(value.features) ||
    !isStringArray(value.pricing) ||
    !isStringArray(value.objections) ||
    !faqIsValid ||
    !isStringArray(value.benefits)
  ) {
    throw new Error("Hermes returned incomplete product knowledge.");
  }

  return value as ProductKnowledge;
}
