# Product Brief

## Product

PitchPilot is an AI outbound sales agency that turns a product landing page and a CSV of leads into prepared, personalized outbound calls with live CRM-style updates.

## One-sentence pitch

For small sales teams that cannot research and call every prospect, PitchPilot extracts product knowledge, prepares a personalized call strategy, places the call, and turns the conversation into a live sales outcome.

## Core demo journey

1. The user opens the setup screen with no login.
2. The user pastes one landing-page URL and uploads a CSV containing leads.
3. The user clicks **Start Campaign**.
4. Linkup fetches the landing page and Hermes creates structured product knowledge.
5. Hermes generates a sales strategy for each lead, one at a time.
6. PitchPilot sends `{ leadId }` to the separately maintained voice service.
7. The voice service completes one real outbound call and submits the transcript.
8. Hermes summarizes the transcript and determines the final lead state and meeting status.
9. The Convex-powered dashboard updates live throughout the flow.

## MVP acceptance criteria

- [ ] A judge can paste a valid landing-page URL and see stored product knowledge containing a summary, features, pricing, objections, FAQ, and benefits.
- [ ] A judge can upload a CSV with `name`, `phone`, and `company`, then see leads and their generated strategies on the live dashboard.
- [ ] A judge can complete one outbound call and see its transcript, summary, final state, meeting status, and activity history update without refreshing.
- [ ] The user-facing application is deployed on Cloudflare Pages and uses Convex for persistent data and realtime updates.

## Fixed scope

- One organization
- One product and landing page
- One campaign
- English only
- One active call at a time
- One outbound call per lead

## Out of scope

- Authentication, organizations, teams, and permissions
- Multiple campaigns or products
- CRM, email, WhatsApp, and calendar integrations
- Scheduling, queues, retries, caching, and notifications
- A/B testing, analytics, and reporting
- Payments unless the complete demo is already working
- Production-scale architecture or generalized abstractions

## Required technology and ownership

- Next.js 15, React, TypeScript, Tailwind CSS, and shadcn/ui for the dashboard
- Convex for the database, backend actions, HTTP integration points, and realtime updates
- Linkup Fetch API for landing-page content
- Hermes API for product knowledge, lead strategy, and transcript processing
- Cloudflare Pages for the static user-facing application
- A separate voice application owned by another developer

The Agency/UI developer owns everything except the phone pipeline itself. PitchPilot sends only `POST /start-call` with `{ "leadId": "..." }`; the voice application reads and updates data through the agreed Convex contract.

## Constraints

- Build window: 4.5 hours
- Hackathon date: 2026-07-13
- Demo target: 2–3 minutes
- Data: synthetic or explicitly approved demo leads only
- Secrets: stored in Convex or deployment secret stores, never in Git
- Reliability: no automatic retry framework; errors must remain readable and recoverable

## Success evidence

Judges see a Cloudflare-hosted application progress from landing-page input to live lead preparation, one real phone call, and an automatically updated sales outcome. The primary proof is the end-to-end flow, not feature count.
