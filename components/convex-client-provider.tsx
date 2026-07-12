"use client";

import { FormEvent, useState } from "react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { AuthLoading, Authenticated, ConvexReactClient, Unauthenticated } from "convex/react";

import { authClient } from "@/lib/auth-client";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await authClient.signIn.email({ email, password });
    if (result.error) setError(result.error.message ?? "Sign in failed.");
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm" onSubmit={submit}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">PitchPilot</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Sign in to your agency</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Accounts are provisioned during onboarding. Contact sales to request access.</p>
        <label className="mt-6 block text-sm font-medium text-slate-700">Email</label>
        <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
        <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" minLength={8} onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="mt-6 h-10 w-full rounded-md bg-slate-950 text-sm font-medium text-white disabled:opacity-50" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [client] = useState(() => (url ? new ConvexReactClient(url, { expectAuth: true }) : null));

  if (!client) {
    return children;
  }

  return (
    <ConvexBetterAuthProvider client={client} authClient={authClient}>
      <AuthLoading><main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking session…</main></AuthLoading>
      <Unauthenticated><SignIn /></Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </ConvexBetterAuthProvider>
  );
}
