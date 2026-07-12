---
name: hackathon-delivery
description: Use when building a hackathon MVP into a verified demo.
version: 1.0.0
author: Hackathon Team
license: MIT
metadata:
  hermes:
    tags: [hackathon, mvp, vertical-slice, demo, delivery]
    related_skills: [test-driven-development, systematic-debugging, requesting-code-review, github-pr-workflow]
---

# Hackathon Delivery

## Overview

Turn an idea or feature request into the smallest end-to-end slice that can be demonstrated reliably. This workflow protects the demo path, forces early integration and deployment, and defers work that does not improve judging value.

## When to Use

Use for selecting and scoping the MVP, implementing a core demo feature, integrating a sponsor API, preparing deployment, or deciding what to cut.

Do not use this skill as a substitute for root-cause debugging. Load `systematic-debugging` when a defect is not understood. Use `plan` separately when the user explicitly wants a plan without implementation.

## Procedure

### 1. Establish the target

Read `AGENTS.md`, the product brief, decision log, README, manifests, and `git status`. Extract the target user, core journey, judging value, required technology, deadline, and acceptance criteria.

If the product or stack is undecided, make only decisions required for the next vertical slice. Do not generate a large scaffold before acceptance criteria exist.

Completion criterion: the task has observable acceptance criteria and a sentence explaining how it improves the demo.

### 2. Choose the thinnest vertical slice

Design a tracer bullet crossing every required boundary: UI/input, core logic, API or persistence, required external service, and visible result. Stub optional internals, not the sponsor requirement.

Order work by risk:

1. external API or hardware feasibility;
2. end-to-end data path;
3. deployment feasibility;
4. correctness and failure behavior;
5. visual polish;
6. secondary features.

Cut secondary roles, custom infrastructure, and speculative abstractions unless they are judging requirements.

Completion criterion: one path can be built and verified independently before expanding any layer.

### 3. Implement in tight loops

For business logic and regressions, follow `test-driven-development`: failing test, minimal implementation, passing test, refactor. For UI-only work, define a concrete interaction check and automate the critical flow when practical.

After each meaningful edit, run the narrowest check, inspect failures instead of applying random changes, keep the diff within the slice, and checkpoint working states with small commits when the team workflow permits.

When a failure is unclear, stop feature work and load `systematic-debugging`.

Completion criterion: the slice works locally and relevant narrow checks pass with real output.

### 4. Harden external boundaries

For each network or model dependency:

- centralize its client and configuration;
- use explicit timeouts;
- validate inputs and outputs;
- show a useful user-facing failure;
- keep credentials out of source, logs, and errors;
- provide deterministic demo data or a labeled fallback when availability is uncertain.

Exercise at least one real request early. A mock-only integration is not sufficient for required hackathon technology.

Completion criterion: the real integration was exercised and its failure cannot hang or destroy the demo.

### 5. Verify the complete slice

Run all applicable formatting/lint, type-check, test, production-build, and smoke-test commands. Exercise the exact journey from a clean start.

Review the diff for credentials, personal data, generated artifacts, debug output, dead code, undocumented configuration, accidental lockfile changes, and unrelated refactors. Use `requesting-code-review` before declaring a substantial slice complete.

Completion criterion: automated checks and the manual path pass, or every unrun check has a precise blocker.

### 6. Keep the demo deployable

Deploy the vertical slice before secondary capabilities. Update the demo runbook with exact preflight, path, reset procedure, and fallback. Rehearse from the deployed build or presentation machine.

If an addition threatens the stable demo, prefer a branch or backlog over destabilizing the main path.

Completion criterion: another teammate can reproduce the core demo from the runbook without oral instructions.

## Time Triage

When behind, cut invisible refactors, generalized abstractions, secondary screens, optional integrations, and nonessential visual effects—in that order. Do not cut the core journey, required judging evidence, secret hygiene, reproducible launch, or fallback.

## Common Pitfalls

1. **Horizontal layers.** A complete frontend with no real data is not a demo. Build end to end.
2. **Boilerplate first.** Scaffolding before acceptance criteria creates rework.
3. **Mocked sponsor requirement.** Prove the real integration early.
4. **Late deployment.** Ship a rough build by the midpoint.
5. **Every idea becomes a feature.** Maintain explicit non-goals.
6. **Unverified success.** Run checks and the actual flow.
7. **Perfect-Wi-Fi dependency.** Prepare seed data, screenshots, recording, or local fallback.

## Verification Checklist

- [ ] Product brief and acceptance criteria are explicit.
- [ ] Work improves the core demo or judging evidence.
- [ ] Required real integrations were exercised.
- [ ] Relevant tests, lint, type checks, and build pass.
- [ ] The exact end-to-end journey was smoke-tested.
- [ ] Network failure is bounded and recoverable.
- [ ] No secrets or private demo data are committed.
- [ ] Setup and variable names are documented.
- [ ] Deployment and fallback are in the runbook.
- [ ] Another teammate can reproduce the slice.
