"use client";

import { useState } from "react";
import { ArrowRight, Check, FileSpreadsheet, Globe2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  { number: "01", label: "Product", description: "Teach PitchPilot what you sell" },
  { number: "02", label: "Leads", description: "Upload the people you want to reach" },
  { number: "03", label: "Launch", description: "Prepare strategies and start calling" },
];

export default function SetupPage() {
  const [landingPage, setLandingPage] = useState("");
  const [fileName, setFileName] = useState("");

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
            <p className="mt-2 text-xs text-slate-500">
              This page becomes the source of truth for every call.
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-slate-800">Lead list</span>
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
                    Required columns: name, phone, company
                  </span>
                </span>
              </span>
              {fileName && <Check className="size-4 text-emerald-600" />}
              <input
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
                type="file"
              />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Ready to launch</span>
              <span className="text-xs text-slate-500">0 leads prepared</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-0 rounded-full bg-slate-900" />
            </div>
          </div>

          <Button className="w-full" disabled={!landingPage || !fileName}>
            Start campaign
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
