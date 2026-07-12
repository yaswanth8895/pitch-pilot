import { ConvexError } from "convex/values";

export async function requireUser(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Authentication required.");
  return identity;
}
