"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RadioTower } from "lucide-react";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

const navigation = [
  { href: "/", label: "Setup" },
  { href: "/leads", label: "Leads" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50/70">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-white">
              <RadioTower className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-950">
              PitchPilot
            </span>
          </Link>
          <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) || pathname === "/lead";

              return (
                <Link
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-slate-500",
                    active && "bg-white text-slate-950 shadow-sm",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" />
            Demo workspace
            <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 hover:text-slate-950" onClick={() => authClient.signOut()} type="button">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
