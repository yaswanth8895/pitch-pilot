"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  Globe2,
  LoaderCircle,
  Sparkles,
  Upload,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseLeadCsv, type LeadCsvRow } from "@/lib/csv";

const steps = [
  { number: "01", label: "Product", description: "Teach PitchPilot what you sell" },
  { number: "02", label: "Leads", description: "Upload the people you want to reach" },
  { number: "03", label: "Launch", description: "Prepare strategies and start calling" },
];

export default function SetupPage() {
  const [landingPage, setLandingPage] = useState("");
  const [fileName, setFileName] = useState("");
  const [leadRows, setLeadRows] = useState<LeadCsvRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const router = useRouter();
  const organization = useQuery(api.organizations.getCurrent);
  const extractProductKnowledge = useAction(api.ai.extractProductKnowledge);
  const importLeads = useMutation(api.leads.importLeads);

  const handleExtraction = async () => {
    setExtractionError("");
    setIsExtracting(true);
    try {
      await extractProductKnowledge({ landingPage });
    } catch (error) {
      setExtractionError(
        error instanceof Error ? error.message : "Product extraction failed.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelection = async (file?: File) => {
    setCsvError("");
    setLeadRows([]);
    setFileName(file?.name ?? "");
    if (!file) return;

    try {
      setLeadRows(await parseLeadCsv(file));
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "CSV could not be read.");
    }
  };

  const handleImport = async () => {
    setCsvError("");
    setIsImporting(true);
    try {
      await importLeads({ leads: leadRows });
      router.push("/leads");
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Lead import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
      <section className="pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Campaign setup
        </p>
        <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          Turn a product page into qualified conversations.
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
          Add one landing page and your leads. PitchPilot will learn the product,
          prepare each call, and keep every outcome in one live workspace.
        </p>

        <div className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <div className="flex gap-4" key={step.number}>
              <div className="flex flex-col items-center">
                <span className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                  {step.number}
                </span>
                {index < steps.length - 1 && <span className="mt-2 h-8 w-px bg-slate-200" />}
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="mt-1 text-sm text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card className="p-7 sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">New campaign</h2>
            <p className="mt-1 text-sm text-slate-500">One product. One focused outbound run.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Draft
          </span>
        </div>

        <div className="mt-7 space-y-7">
          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="landing-page">
              Product landing page
            </label>
            <div className="relative mt-2">
              <Globe2 className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                id="landing-page"
                onChange={(event) => setLandingPage(event.target.value)}
                placeholder="https://yourproduct.com"
                type="url"
                value={landingPage}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                This page becomes the source of truth for every call.
              </p>
              <Button
                disabled={!landingPage || isExtracting}
                onClick={handleExtraction}
                size="sm"
                type="button"
                variant="outline"
              >
                {isExtracting ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {isExtracting ? "Analyzing" : "Analyze page"}
              </Button>
            </div>
            {extractionError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {extractionError}
              </p>
            )}
            {organization?.productKnowledge && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <Check className="size-4" />
                  Product knowledge ready
                </div>
                <p className="mt-2 text-xs leading-5 text-emerald-800">
                  {organization.productKnowledge.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                    {organization.productKnowledge.features.length} features
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                    {organization.productKnowledge.benefits.length} benefits
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                    {organization.productKnowledge.objections.length} objections
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-800">Lead list</span>
              <a
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-950"
                download
                href="/leads-template.csv"
              >
                <Download className="size-3.5" />
                Download template
              </a>
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 hover:border-slate-400">
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                  {fileName ? <FileSpreadsheet className="size-5" /> : <Upload className="size-5" />}
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    {fileName || "Choose a CSV file"}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Required: name, phone, company · Optional: lead_context
                  </span>
                </span>
              </span>
              {fileName && <Check className="size-4 text-emerald-600" />}
              <input
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => handleFileSelection(event.target.files?.[0])}
                type="file"
              />
            </label>
            {csvError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {csvError}
              </p>
            )}
            {leadRows.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[0.8fr_0.8fr_0.8fr_1.2fr] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <span>Name</span>
                  <span>Phone</span>
                  <span>Company</span>
                  <span>Lead context</span>
                </div>
                {leadRows.slice(0, 4).map((lead, index) => (
                  <div
                    className="grid grid-cols-[0.8fr_0.8fr_0.8fr_1.2fr] gap-2 border-t border-slate-100 px-3 py-2 text-xs text-slate-700"
                    key={`${lead.phone}-${index}`}
                  >
                    <span className="truncate">{lead.name}</span>
                    <span className="truncate">{lead.phone}</span>
                    <span className="truncate">{lead.company}</span>
                    <span className="truncate text-slate-500">
                      {lead.leadContext || "Will be enriched automatically"}
                    </span>
                  </div>
                ))}
                {leadRows.length > 4 && (
                  <p className="border-t border-slate-100 px-3 py-2 text-center text-[11px] text-slate-500">
                    +{leadRows.length - 4} more leads
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Ready to launch</span>
              <span className="text-xs text-slate-500">
                {leadRows.length} {leadRows.length === 1 ? "lead" : "leads"} validated
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900 transition-[width]"
                style={{ width: leadRows.length > 0 ? "66%" : "0%" }}
              />
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!organization?.productKnowledge || leadRows.length === 0 || isImporting}
            onClick={handleImport}
            type="button"
          >
            {isImporting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {isImporting
              ? "Importing leads"
              : `Import ${leadRows.length || ""} ${leadRows.length === 1 ? "lead" : "leads"}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
