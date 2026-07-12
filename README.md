# PitchPilot

PitchPilot is a hackathon-scale AI outbound sales agency. A user supplies a product landing page and a CSV of leads; the system extracts product knowledge, prepares personalized strategies, triggers one outbound call at a time, and displays the transcript and sales outcome on a live dashboard.

## Architecture

- Cloudflare Pages hosts the statically exported Next.js 15 dashboard.
- Convex stores organizations, leads, and runs and provides backend actions and realtime updates.
- Linkup fetches landing-page content.
- Hermes creates product knowledge, lead strategies, and transcript outcomes.
- A separately maintained voice application receives only `{ leadId }` and uses ElevenLabs with Twilio for the call and final transcript.

The MVP intentionally excludes authentication, multiple campaigns, CRM integrations, scheduling, retries, queues, analytics, and generalized architecture layers.

## Planned application routes

- `/` — landing-page input, CSV upload, and campaign start
- `/leads` — live leads dashboard and activity feed
- `/lead?id=<leadId>` — strategy, transcript, summary, state, and history

## Local development

Application scaffolding is the next milestone. Once it is committed:

```bash
nvm use
npm ci
npm run dev:convex
npm run dev
```

See `docs/PRODUCT_BRIEF.md` for the exact scope and `docs/DECISIONS.md` for accepted architecture decisions.

The independently maintained voice application must follow [`contracts/voice-api.md`](contracts/voice-api.md). That document defines ownership, hosting, authentication, endpoints, payloads, environment variables, and the integration test sequence.

## Hermes for local development

Hermes runs as a separate OpenAI-compatible agent server. Configure its model provider with `hermes model`; choose the direct OpenAI API provider to use OpenAI API credits. Then enable the API server in `~/.hermes/.env`:

```text
API_SERVER_ENABLED=true
API_SERVER_KEY=<local-secret>
```

Start it with `hermes gateway`. Configure Convex with the matching URL and key:

```bash
npx convex env set HERMES_BASE_URL http://127.0.0.1:8642/v1
npx convex env set HERMES_API_KEY <local-secret>
npx convex env set LINKUP_API_KEY <linkup-key>
```

Never commit either key. The model name sent to Hermes remains `hermes-agent`; the real OpenAI model is selected inside Hermes.

## First-time Hermes setup

```bash
cd /Users/yaswanthkakunuri/Documents/code/hermes-hacakthon
./scripts/setup-hermes.sh
```

The setup script registers this repository's `.agents/skills` directory, creates the `/hackathon-dev` bundle, and checks Hermes plus GitHub prerequisites. Restart any open Hermes session afterward so the skill index reloads.

## Start a safe coding session

```bash
./scripts/hackathon-agent
```

This starts Hermes from the repository root with filesystem checkpoints enabled. Useful commands:

```text
/title hackathon-build
/hackathon-dev help us turn the product brief into the first vertical slice
/plan design the MVP after we choose the stack
/systematic-debugging investigate this failing test
/github-pr-workflow prepare this completed slice for review
```

## Before writing application code

1. Review `docs/PRODUCT_BRIEF.md` and keep implementation inside its fixed scope.
2. Record any changed architecture choice in `docs/DECISIONS.md` before implementing it.
3. Keep the command table in `AGENTS.md` aligned with `package.json`.
4. Create a GitHub repository, add it as `origin`, and invite the team.
5. Make one end-to-end path work and deploy it before adding secondary features.
6. Rehearse `docs/DEMO_RUNBOOK.md` on the presentation machine and network.

See `HACKATHON_CHECKLIST.md` for the complete readiness list.
