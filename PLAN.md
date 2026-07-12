# PitchPilot — Build Plan

Status: active build plan (supersedes the earlier draft)
Demo: 2026-07-13 · Build window: ~4.5 hours · Two developers

> This file is the **build sequence**, not the decision record. The authoritative
> decisions live in `docs/PRODUCT_BRIEF.md`, `docs/DECISIONS.md`, `AGENTS.md`, and
> `contracts/voice-api.md`. If anything here disagrees with those, they win.

## 1. What we're building

PitchPilot turns a product landing page + a CSV of leads into prepared,
personalized outbound sales calls with a live dashboard. Core journey:

1. Paste a landing-page URL and upload a CSV of leads → **Start Campaign**.
2. Linkup fetches the page; **Hermes** builds structured product knowledge.
3. Hermes generates a per-lead call strategy.
4. The dashboard triggers **one real outbound call** via the voice service.
5. An **ElevenLabs** agent (native Twilio) runs the conversation and returns the
   transcript.
6. Hermes classifies the transcript → summary, final lead state, meeting flag.
7. The Convex dashboard updates live throughout — no refresh.

## 2. Architecture (one system, two repos)

```text
Next.js 15 (static export) ── Cloudflare Pages          [repo: pitch-pilot]
  └─ Convex client subscriptions (live dashboard)
Convex (data + actions + HTTP actions)                  [repo: pitch-pilot]
  ├─ Linkup Fetch  (landing-page content)
  ├─ Hermes API    (knowledge / strategy / CRM classify)
  └─ Voice Worker  POST /start-call { leadId }          [repo: pitch-pilot-voice]
       └─ ElevenLabs Agent (LLM = OpenAI via Custom LLM) + native Twilio
            └─ post_call_transcription webhook → Worker → Convex /voice/completed
```

**The seam between the two workstreams is `contracts/voice-api.md`** — binding;
change only by mutual agreement. Two secrets guard it: `VOICE_SHARED_SECRET`
(every Convex↔Worker hop) and `ELEVENLABS_WEBHOOK_SECRET` (HMAC on the inbound
ElevenLabs webhook). The browser never calls the Worker and never holds a secret.

Scope (from `docs/PRODUCT_BRIEF.md`): one org, one product, one campaign, English,
one active call, one call per lead. **Out:** auth, teams, multiple campaigns,
email/WhatsApp/calendar/CRM, queues/retries/scheduling, analytics, live
transcript streaming.

## 3. Where AI runs (no direct OpenAI in either repo's code)

| Role | Provider | Repo / config | When |
|---|---|---|---|
| Product-knowledge extraction, per-lead strategy, transcript → CRM classification | **Hermes** (`HERMES_*`) | pitch-pilot (Convex) | out of call |
| Live in-call brain (STT→**LLM**→TTS) | **ElevenLabs agent, LLM = OpenAI via Custom LLM** | ElevenLabs agent config | during call |

No `OPENAI_API_KEY`, OpenAI SDK, or `gpt-5.6-*` in either repo — OpenAI is only
the ElevenLabs agent's Custom LLM (its key is stored inside ElevenLabs).

> ⚠️ "Hermes" is overloaded: the **coding-agent CLI** in `AGENTS.md` is unrelated
> to the **Hermes AI API** (`HERMES_API_KEY`/`HERMES_BASE_URL`/`HERMES_MODEL`).

## 4. Workstream A — Agency/UI + Data  ·  *colleague*  ·  repo `pitch-pilot`

Owns the Next.js dashboard, Convex, Linkup, Hermes, and Cloudflare Pages.

1. Scaffold Next.js 15 + Convex + Tailwind + shadcn (npm, Node 20); configure
   **static export**; deploy skeleton to Cloudflare Pages.
2. Convex schema — exactly 3 tables:
   - `organizations`: `landingUrl`, `productKnowledge { summary, features[],
     pricing[], objections[], faq[{question,answer}], benefits[] }`, `history[]`.
   - `leads`: `orgId, name, phone, company, strategy, state, meetingBooked, history[]`.
   - `runs`: `leadId, callId, status, transcript, transcriptProvider, endedReason,
     summary, outcome, recordingId (Convex file storage), recordingUrl`.
3. Actions: `extractProduct` (Linkup→Hermes), `importLeads` (CSV `name,phone,company`),
   `generateStrategy` (Hermes), `startCall` (→ Worker `/start-call`, set
   `CONTACTING`, create a `run`), `processTranscript` (Hermes classify →
   summary/state/meeting, validate transition, append history).
4. **Convex HTTP actions** (shared-secret; the seam the voice Worker calls):
   `GET /voice/context`, `POST /voice/completed`, `POST /voice/failed`, and
   `POST /voice/recording` (store audio bytes in **Convex file storage**, link to
   the run). Deploy minimal versions **+ a synthetic seed lead early** — this
   unblocks voice Stage 1.
5. Routes (static-export safe): `/`, `/leads`, `/lead?id=<leadId>`; live via
   Convex subscriptions.
6. Lead state machine (server-validated), seed/reset script, readable error states.

Lead states (server-validated, Convex+Hermes decide — never the client/voice app):
`NEW → READY → CONTACTING →` terminal `INTERESTED | MEETING_BOOKED | NOT_INTERESTED | FAILED`.

Acceptance: paste URL → product knowledge; CSV → leads + strategies; a completed
call → transcript/summary/state/meeting/history live; deployed on Cloudflare.

## 5. Workstream B — Voice  ·  *you*  ·  repo `pitch-pilot-voice` (separate)

Owns the Cloudflare Worker voice adapter + the ElevenLabs account/agent + the
Twilio number. Full spec: `contracts/voice-api.md`. Build order:

1. Scaffold the Worker repo; `GET /health` → `{ ok: true }`.
2. `POST /start-call` — validate `X-Shared-Secret` + `{ leadId }`; status codes
   `202/400/401/404/409/502`; return `{ accepted, callId }`.
3. Fetch context: `GET {CONVEX_SITE_URL}/voice/context?leadId=..` → map to concise
   dynamic variables `lead_name, company, product_summary, strategy, objections,
   call_goal` (+ `lead_id` so the webhook can recover it).
4. **Stage 1 (no ElevenLabs):** a flag-guarded fake path posts a canned transcript
   straight to `/voice/completed`, proving the round-trip against Convex (or a
   local mock) before any provider work.
5. **Stage 2:** replace the fake path with one real ElevenLabs outbound call
   passing `dynamic_variables`; return the ElevenLabs conversation id as `callId`.
6. `POST /webhooks/elevenlabs` — verify `ElevenLabs-Signature` HMAC; on
   `post_call_transcription` flatten turns → read `leadId` → POST `/voice/completed`
   `{ leadId, callId, transcript, transcriptProvider:"elevenlabs", endedReason }`;
   on `call_initiation_failure` → POST `/voice/failed`. Return `200` promptly.
   Then (background) pull the call audio from ElevenLabs and POST it to
   `/voice/recording` — recording is on by default.
7. Secrets via `wrangler secret put`; `wrangler deploy`; hand the Worker URL to the
   colleague for `VOICE_SERVICE_URL`.

ElevenLabs agent config (dashboard, one-time): **Custom LLM = OpenAI** (endpoint +
tool-calling model + `OPENAI_API_KEY` stored in ElevenLabs); system prompt with
`{{lead_name}} {{company}} {{product_summary}} {{strategy}} {{objections}}
{{call_goal}}`; native Twilio phone number; `post_call_transcription` webhook →
`POST /webhooks/elevenlabs`.

Acceptance = the voice-dev Definition of Done in `contracts/voice-api.md`.

## 6. Integration stages (shared)

- **Stage 1 — contract round-trip (no ElevenLabs).** Worker `/health` + fake
  `/start-call` → `/voice/context` (synthetic lead) → fake transcript to
  `/voice/completed` → dashboard updates. *Do not start ElevenLabs until this works.*
- **Stage 2 — real call.** ElevenLabs dials one approved number → signed webhook →
  real transcript to Convex → dashboard updates.
- **Stage 3 — hardening.** Invalid number, provider failure, duplicate call, second
  simultaneous call; record a fallback video of the successful flow.

## 7. Environment variables

`pitch-pilot` (browser): `NEXT_PUBLIC_CONVEX_URL`.
`pitch-pilot` (Convex, never `NEXT_PUBLIC_`): `LINKUP_API_KEY`, `HERMES_API_KEY`,
`HERMES_BASE_URL`, `HERMES_MODEL`, `VOICE_SERVICE_URL`, `VOICE_SHARED_SECRET`.
`pitch-pilot-voice` (Worker secrets): `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`,
`ELEVENLABS_PHONE_NUMBER_ID`, `ELEVENLABS_WEBHOOK_SECRET`, `CONVEX_SITE_URL`,
`VOICE_SHARED_SECRET`. The OpenAI Custom-LLM key lives **inside the ElevenLabs
agent config**, not in any repo. No secrets in Git.

## 8. Definition of done (project)

- [ ] Paste URL → stored product knowledge (summary, features, pricing, objections, FAQ, benefits).
- [ ] CSV upload → leads + generated strategies on the live dashboard.
- [ ] One real outbound call → transcript, summary, final state, meeting flag, activity — live.
- [ ] The call is recorded and the audio is saved to Convex file storage, playable from the run.
- [ ] Lead state changes only through validated transitions; failures → `FAILED`.
- [ ] Deployed: UI on Cloudflare Pages, Convex managed, Worker on Cloudflare Workers.
- [ ] No credentials committed; quality gates pass (`AGENTS.md` command table).
- [ ] Demo rehearsed from `docs/DEMO_RUNBOOK.md` with a fallback recording ready.
