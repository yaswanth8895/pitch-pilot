# Demo Runbook

## Demo metadata

- Duration: 2–3 minutes
- Presenter:
- Driver:
- Timekeeper/recovery owner:
- Deployed URL: https://pitch-pilot.pages.dev
- Local fallback command: `npm run dev`
- Demo account: none

## Hosted services

- Cloudflare Pages: `https://pitch-pilot.pages.dev`
- Convex dashboard: `https://dashboard.convex.dev/t/hemant-thota/pitch-pilot`
- Convex production: `https://impressive-ferret-121.convex.cloud`
- Hermes: `https://pitch-pilot-hermes.bravehill-6bfdcb7d.centralindia.azurecontainerapps.io/v1`

The presentation laptop is not required to run Hermes. Azure Container Apps
keeps one Hermes replica warm for the demo.

## Reset data

Use `clean` immediately before demonstrating the full setup flow:

```bash
RESET_SECRET="$(npx convex env get --prod DEMO_RESET_SECRET)"
npx convex run --prod demo:reset "{\"secret\":\"$RESET_SECRET\",\"mode\":\"clean\"}"
```

Use `showcase` if the live landing-page, model, or phone flow is unavailable:

```bash
RESET_SECRET="$(npx convex env get --prod DEMO_RESET_SECRET)"
npx convex run --prod demo:reset "{\"secret\":\"$RESET_SECRET\",\"mode\":\"showcase\"}"
```

## Preflight

- [ ] Use the exact demonstrated commit.
- [ ] Confirm network and deployed health.
- [ ] Reset seed/demo data to a known state.
- [ ] Open the deployed dashboard and the Convex data view in separate tabs.
- [ ] Confirm Hermes returns `200` from authenticated `/v1/models`.
- [ ] Confirm the voice Worker's `/health` endpoint returns `{ "ok": true }`.
- [ ] Silence notifications and close unrelated windows.
- [ ] Keep screenshots or a recording ready as fallback.

## Script

| Time | Speaker action | Screen action | Judging value shown |
|---|---|---|---|
| 0:00 | “Sales teams lose hours researching and calling leads that never convert.” | Setup screen | Relevance |
| 0:20 | Paste the product URL and analyze it. | Product knowledge appears | Linkup + Hermes |
| 0:45 | Upload `leads-template.csv`, import, and prepare strategies. | Leads move from NEW to READY | Personalization |
| 1:15 | Start one call. | Lead moves to CALLING | ElevenLabs integration |
| 1:30 | Complete the conversation. | Transcript, summary, and meeting update live | Realtime orchestration |
| 2:10 | Open lead details and activity. | Strategy, dialogue, and timeline | Demo polish |
| 2:30 | Close with the product promise. | Dashboard result | Potential |

## Recovery paths

- If deployment is unavailable: run Convex and Next.js locally, then open `http://localhost:3000`.
- If Linkup or Hermes times out: switch to `showcase` mode and explain the stored result.
- If the phone call fails: switch to `showcase` mode and open Aarav Mehta's completed call.
- If seed data is missing: run the `showcase` reset command above and refresh `/leads`.
- If the live demo cannot continue: use the prerecorded walkthrough and keep the deployed dashboard open.

## Final line

“PitchPilot turns one product page and one lead list into personalized conversations and live sales outcomes—without adding manual work for the sales team.”
