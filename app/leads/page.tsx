"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  LoaderCircle,
  PhoneCall,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

const stateStyles: Record<string, string> = {
  NEW: "border-slate-200 bg-slate-50 text-slate-600",
  READY: "border-blue-200 bg-blue-50 text-blue-700",
  CALLING: "border-amber-200 bg-amber-50 text-amber-700",
  INTERESTED: "border-violet-200 bg-violet-50 text-violet-700",
  MEETING_BOOKED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NOT_INTERESTED: "border-slate-200 bg-slate-100 text-slate-500",
  FAILED: "border-red-200 bg-red-50 text-red-700",
};

export default function LeadsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const leads = useQuery(api.leads.list);
  const generateStrategies = useAction(api.ai.generateStrategies);
  const total = leads?.length ?? 0;
  const ready = leads?.filter((lead) => lead.currentState === "READY").length ?? 0;
  const meetings = leads?.filter((lead) => lead.meetingBooked).length ?? 0;
  const activities = (leads ?? [])
    .flatMap((lead) =>
      lead.history.map((item) => ({ ...item, leadName: lead.name, leadId: lead._id })),
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  const stats = [
    { label: "Total leads", value: total, icon: Users },
    { label: "Ready to call", value: ready, icon: PhoneCall },
    { label: "Meetings", value: meetings, icon: Clock3 },
  ];

  const newLeadCount = leads?.filter((lead) => lead.currentState === "NEW").length ?? 0;

  const handleGenerateStrategies = async () => {
    setGenerationMessage("");
    setIsGenerating(true);
    try {
      const result = await generateStrategies();
      setGenerationMessage(
        result.failed > 0
          ? `${result.ready} ready, ${result.failed} failed.`
          : `${result.ready} ${result.ready === 1 ? "strategy" : "strategies"} ready.`,
      );
    } catch (error) {
      setGenerationMessage(
        error instanceof Error ? error.message : "Strategy generation failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Leads</h1>
          <p className="mt-2 text-sm text-slate-500">
            Strategies, calls, and outcomes update here automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {generationMessage && (
            <span className="text-xs font-medium text-slate-500">{generationMessage}</span>
          )}
          <Badge>
            <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
            Live
          </Badge>
          <Button
            disabled={newLeadCount === 0 || isGenerating}
            onClick={handleGenerateStrategies}
            size="sm"
          >
            {isGenerating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isGenerating
              ? "Preparing strategies"
              : newLeadCount === 0
                ? "All strategies ready"
                : `Prepare ${newLeadCount} ${newLeadCount === 1 ? "lead" : "leads"}`}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card className="flex items-center justify-between p-5" key={stat.label}>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {leads === undefined ? "—" : stat.value}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <stat.icon className="size-4" />
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Campaign leads</h2>
              <p className="mt-1 text-xs text-slate-500">
                {leads === undefined
                  ? "Loading leads…"
                  : `${total} ${total === 1 ? "lead" : "leads"} in this campaign`}
              </p>
            </div>
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/">
              Import CSV
            </Link>
          </div>
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_1fr_36px] border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>Name</span>
            <span>Phone</span>
            <span>Status</span>
            <span>Meeting</span>
            <span>Summary</span>
            <span />
          </div>

          {leads?.map((lead) => (
            <div
              className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_1fr_36px] items-center border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
              key={lead._id}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{lead.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{lead.company}</p>
              </div>
              <span className="truncate text-slate-600">{lead.phone}</span>
              <Badge className={`w-fit justify-self-start ${stateStyles[lead.currentState]}`}>
                {lead.currentState.replaceAll("_", " ")}
              </Badge>
              <span className="text-slate-600">{lead.meetingBooked ? "Yes" : "No"}</span>
              <span className="truncate pr-4 text-xs text-slate-500">
                {lead.summary ?? "No call yet"}
              </span>
              <Link
                aria-label={`View ${lead.name}`}
                className="flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                href={`/lead?id=${lead._id}`}
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}

          {leads?.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <Users className="size-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-800">Your leads will appear here</p>
              <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                Upload a CSV on Setup to begin preparing personalized sales strategies.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <ArrowUpRight className="size-4 text-slate-400" />
          </div>
          {activities.length > 0 ? (
            <div className="mt-5 space-y-5">
              {activities.map((activity) => (
                <div className="flex gap-3" key={`${activity.leadId}-${activity.timestamp}`}>
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-slate-900" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{activity.event}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {activity.leadName} · {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center text-center">
              <span className="size-2 rounded-full bg-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">Nothing yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Product, strategy, and call events will stream here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
