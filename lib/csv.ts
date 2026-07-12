import Papa from "papaparse";

export type LeadCsvRow = {
  name: string;
  phone: string;
  company: string;
};

const requiredColumns = ["name", "phone", "company"] as const;

export async function parseLeadCsv(file: File): Promise<LeadCsvRow[]> {
  return parseLeadCsvText(await file.text());
}

export function parseLeadCsvText(content: string): LeadCsvRow[] {
  const { data, errors, meta } = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (errors.length > 0) {
    throw new Error(`CSV could not be read: ${errors[0].message}`);
  }

  const fields = new Set(meta.fields ?? []);
  const missingColumns = requiredColumns.filter((column) => !fields.has(column));
  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}.`);
  }

  const rows = data.map((row) => ({
    name: row.name?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    company: row.company?.trim() ?? "",
  }));

  if (rows.length === 0) {
    throw new Error("CSV contains no lead rows.");
  }

  const invalidRowIndex = rows.findIndex(
    (row) => !row.name || !row.phone || !row.company,
  );
  if (invalidRowIndex >= 0) {
    throw new Error(`Row ${invalidRowIndex + 2} is missing a name, phone, or company.`);
  }

  return rows;
}
