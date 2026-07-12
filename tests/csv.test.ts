import { describe, expect, it } from "vitest";

import { parseLeadCsvText } from "../lib/csv";

describe("parseLeadCsv", () => {
  it("normalizes headers and trims lead values", async () => {
    expect(
      parseLeadCsvText(" Name , Phone , Company \n Jane Doe , +15551234567 , Acme "),
    ).toEqual([
      { name: "Jane Doe", phone: "+15551234567", company: "Acme", leadContext: "" },
    ]);
  });

  it("rejects a CSV with missing required columns", async () => {
    expect(() => parseLeadCsvText("name,phone\nJane,+15551234567")).toThrow(
      "missing required columns: company",
    );
  });

  it("reports the row containing an empty value", async () => {
    expect(() => parseLeadCsvText("name,phone,company\nJane,,Acme")).toThrow("Row 2");
  });

  it("accepts optional lead context and blank values", () => {
    expect(
      parseLeadCsvText(
        "name,phone,company,lead_context\nAsha,+15550001,Acme,VP Sales focused on healthcare\nBen,+15550002,Beta,",
      ),
    ).toEqual([
      {
        name: "Asha",
        phone: "+15550001",
        company: "Acme",
        leadContext: "VP Sales focused on healthcare",
      },
      { name: "Ben", phone: "+15550002", company: "Beta", leadContext: "" },
    ]);
  });
});
