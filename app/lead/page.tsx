"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, MessageSquareText, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function LeadDetails() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("id");

  return (
    <div>
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950" href="/leads">
        <ArrowLeft className="size-4" />
        Back to leads
      </Link>

      <div className="mt-6 flex items-end justify-between border-b border-slate-200 pb-7">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {leadId ? "Lead details" : "Select a lead"}
            </h1>
            <Badge>NEW</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {leadId ? `Lead ID: ${leadId}` : "Open a lead from the dashboard to see its call workspace."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="size-4 text-slate-400" />
              Call strategy
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Strategy will appear after the lead is prepared.
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquareText className="size-4 text-slate-400" />
              Transcript
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              The completed call transcript will appear here automatically.
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Lead</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Company</dt>
                <dd className="mt-1 font-medium text-slate-800">—</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                  <Phone className="size-3.5 text-slate-400" />—
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Meeting</dt>
                <dd className="mt-1 font-medium text-slate-800">Not booked</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
            <div className="mt-8 text-center text-xs leading-5 text-slate-500">
              Activity will appear as this lead moves through the campaign.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LeadPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading lead…</p>}>
      <LeadDetails />
    </Suspense>
  );
}
