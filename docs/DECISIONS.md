# Decision Log

Record decisions that would otherwise be repeatedly debated. Update `AGENTS.md` when a decision changes development commands or conventions.

## Template

### YYYY-MM-DD — Decision title

- Status: proposed | accepted | replaced
- Decision:
- Reason:
- Alternatives rejected:
- Consequences:
- Owner:

## Required first decisions

- Product name, pitch, core journey, and explicit non-goals
- Frontend, backend, data store, and package managers
- Repository structure, runtime versions, and ports
- Authentication approach, if any
- External APIs and fallback behavior
- Testing commands and minimum quality gate
- Deployment target and rollback/fallback plan

## Accepted decisions

### 2026-07-12 — Build PitchPilot as a narrow outbound-sales demo

- Status: accepted
- Decision: Support one organization, product, campaign, language, active call, and outbound call per lead.
- Reason: The 4.5-hour build window rewards a reliable end-to-end demonstration.
- Alternatives rejected: Multi-tenant SaaS features, generalized campaign management, CRM integrations, and production-scale orchestration.
- Consequences: No authentication, organizations UI, permissions, queues, scheduling, retries, or analytics.
- Owner: Agency/UI developer

### 2026-07-12 — Use a static Next.js dashboard with Convex backend

- Status: accepted
- Decision: Use Next.js 15, React, TypeScript, Tailwind CSS, and minimal shadcn/ui components. Use Convex for data, backend actions, HTTP endpoints, and realtime subscriptions.
- Reason: This keeps the browser application simple while providing a managed backend and live dashboard.
- Alternatives rejected: A custom Node API, Azure application hosting, microservices, and server-side Next.js features.
- Consequences: The frontend must not depend on Server Actions, API routes, middleware, SSR, or ISR. Lead details use `/lead?id=<leadId>` so static export does not require unknown dynamic routes.
- Owner: Agency/UI developer

### 2026-07-12 — Deploy the UI to Cloudflare Pages

- Status: accepted
- Decision: Configure Next.js for static export and host the user-facing application on Cloudflare Pages. Deploy Convex separately as its managed backend.
- Reason: Cloudflare is part of the judging value and static Pages hosting is sufficient for a Convex client application.
- Alternatives rejected: Azure and a full-stack Next.js deployment for the MVP.
- Consequences: Private API keys live in Convex environment variables. If an unexpected static-export blocker appears, Cloudflare Workers is the first fallback; Azure is not planned.
- Owner: Agency/UI developer

### 2026-07-12 — Keep the data model to three Convex tables

- Status: accepted
- Decision: Use only `organizations`, `leads`, and `runs`. Store product knowledge and organization history on the organization, and lead activity history on each lead.
- Reason: Embedded data is sufficient for one organization and one campaign and avoids unnecessary joins and abstractions.
- Alternatives rejected: Separate campaigns, product knowledge, calls, transcripts, and activity-event tables.
- Consequences: The activity feed merges organization and lead history in the browser. Convex `_id` and `_creationTime` are used instead of duplicate ID fields.
- Owner: Agency/UI developer

### 2026-07-12 — Use direct external-service contracts

- Status: accepted
- Decision: Use Linkup Fetch for landing-page content and Hermes for three responsibilities only: product knowledge, lead strategy, and transcript classification. Trigger the voice service with only `POST /start-call { leadId }`.
- Reason: Small explicit contracts are easiest to integrate and debug during the hackathon.
- Alternatives rejected: Agent frameworks, generic AI providers, event buses, giant voice payloads, and orchestration platforms.
- Consequences: Exact Hermes and voice update formats must be confirmed before their implementation milestones. Failed external calls show an error and do not automatically retry.
- Owner: Agency/UI developer and voice developer for the shared voice contract

### 2026-07-12 — Use npm and Node.js 20

- Status: accepted
- Decision: Use npm with a committed `package-lock.json` and pin Node.js 20 for local development and deployment.
- Reason: Node.js 20 is a stable deployment target for the selected stack and npm is already available to the team.
- Alternatives rejected: Mixing package managers or using the machine's unpinned runtime.
- Consequences: Application scaffolding must create npm scripts for development, linting, type-checking, tests, builds, and static export verification.
- Owner: Agency/UI developer
