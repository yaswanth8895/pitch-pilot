import Link from "next/link";
import { ArrowUpRight, Clock3, PhoneCall, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Total leads", value: "0", icon: Users },
  { label: "Ready to call", value: "0", icon: PhoneCall },
  { label: "Meetings", value: "0", icon: Clock3 },
];

export default function LeadsPage() {
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
        <Badge>
          <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
          Live
        </Badge>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card className="flex items-center justify-between p-5" key={stat.label}>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
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
              <p className="mt-1 text-xs text-slate-500">No leads imported yet</p>
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
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
              <Users className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-800">Your leads will appear here</p>
            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
              Upload a CSV on Setup to begin preparing personalized sales strategies.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <ArrowUpRight className="size-4 text-slate-400" />
          </div>
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="size-2 rounded-full bg-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">Nothing yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Product, strategy, and call events will stream here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
