import { describe, expect, it } from "vitest";

import { parseLeadCsvText } from "../lib/csv";

describe("parseLeadCsv", () => {
  it("normalizes headers and trims lead values", async () => {
    expect(
      parseLeadCsvText(" Name , Phone , Company \n Jane Doe , +15551234567 , Acme "),
    ).toEqual([
      { name: "Jane Doe", phone: "+15551234567", company: "Acme" },
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
});
