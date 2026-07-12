import { query } from "./_generated/server";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => ctx.db.query("organizations").first(),
});
