"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import {
  ArrowLeft,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Phone,
  PhoneCall,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseTranscript } from "@/lib/transcript";

function LeadDetails() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("id");
  const lead = useQuery(api.leads.getById, leadId ? { leadId } : "skip");
  const startCall = useAction(api.voice.startCall);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [callMessage, setCallMessage] = useState("");
  const transcriptTurns = parseTranscript(lead?.transcript ?? "");

  const handleStartCall = async () => {
    if (!lead) return;
    setCallMessage("");
    setIsStartingCall(true);
    try {
      const result = await startCall({ leadId: lead._id as Id<"leads"> });
      setCallMessage(
        result.callId ? `Call started · ${result.callId}` : "Call started successfully.",
      );
    } catch (error) {
      setCallMessage(error instanceof Error ? error.message : "Call could not be started.");
    } finally {
      setIsStartingCall(false);
    }
  };

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
              {lead?.name ?? (leadId ? "Lead details" : "Select a lead")}
            </h1>
            {lead && <Badge>{lead.currentState.replaceAll("_", " ")}</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {lead
              ? lead.company
              : leadId
                ? "Loading lead…"
                : "Open a lead from the dashboard to see its call workspace."}
          </p>
        </div>
        {lead?.currentState === "READY" && !lead.callStarted && (
          <Button disabled={isStartingCall} onClick={handleStartCall} type="button">
            {isStartingCall ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <PhoneCall className="size-4" />
            )}
            {isStartingCall ? "Starting call" : "Start call"}
          </Button>
        )}
      </div>

      {callMessage && (
        <p className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {callMessage}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {lead?.summary && (
            <Card className="border-emerald-200 bg-emerald-50/40 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <Sparkles className="size-4" />
                Call summary
              </div>
              <p className="mt-4 text-sm leading-6 text-emerald-900/80">{lead.summary}</p>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="size-4 text-slate-400" />
              Call strategy
            </div>
            <div className="mt-5 whitespace-pre-wrap rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-left text-sm leading-6 text-slate-600">
              {lead?.strategy ?? "Strategy will appear after the lead is prepared."}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquareText className="size-4 text-slate-400" />
              Transcript
            </div>
            {transcriptTurns.length > 0 ? (
              <div className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
                {transcriptTurns.map((turn, index) => {
                  const isAgent = turn.speaker.toLowerCase() === "agent";
                  return (
                    <div
                      className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                      key={`${turn.speaker}-${index}`}
                    >
                      <div className={`max-w-[82%] ${isAgent ? "text-left" : "text-right"}`}>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {turn.speaker}
                        </p>
                        <p
                          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-6 ${
                            isAgent
                              ? "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                              : "rounded-tr-sm bg-slate-900 text-left text-white"
                          }`}
                        >
                          {turn.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                The completed call transcript will appear here automatically.
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Lead</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Company</dt>
                <dd className="mt-1 font-medium text-slate-800">{lead?.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                  <Phone className="size-3.5 text-slate-400" />
                  {lead?.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Meeting</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {lead?.meetingBooked ? "Booked" : "Not booked"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
            {lead?.history.length ? (
              <div className="mt-5 space-y-4">
                {[...lead.history].reverse().map((item) => (
                  <div className="flex gap-3" key={`${item.timestamp}-${item.event}`}>
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-slate-900" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{item.event}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 text-center text-xs leading-5 text-slate-500">
                Activity will appear as this lead moves through the campaign.
              </div>
            )}
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
