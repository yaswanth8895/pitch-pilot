# Hackathon Readiness Checklist

## Tonight: decisions and access

- [ ] Copy the challenge and judging criteria into `docs/PRODUCT_BRIEF.md`.
- [ ] Write the one-sentence pitch: target user, painful problem, visible outcome.
- [ ] Select one core user journey and at most three MVP capabilities.
- [ ] Explicitly list features that are out of scope.
- [ ] Choose the stack based on team familiarity and deployment speed.
- [ ] Assign owners for product/demo, frontend, backend/data, and deployment.
- [ ] Create the GitHub repository, invite teammates, and verify push access.
- [ ] Confirm everyone can run `hermes`, `git`, `gh`, the runtime, and package manager.
- [ ] Create required vendor/cloud accounts and verify quotas, billing, and regions.
- [ ] Share credentials through a secret manager, never through Git.
- [ ] Test the deployment account and target before application work.
- [ ] Prepare chargers, adapters, hotspot access, and presentation cables.

## First hour

- [ ] Run `./scripts/setup-hermes.sh` for each Hermes developer.
- [ ] Complete the product brief and decision log.
- [ ] Update `AGENTS.md` with exact stack, commands, paths, ports, and conventions.
- [ ] Commit dependency manifests and one package-manager lockfile per component.
- [ ] Add required variable names to `.env.example` without real values.
- [ ] Agree on API contracts and ownership before parallel implementation.
- [ ] Create a walking skeleton spanning UI, logic/API, and data/integration.

## Build checkpoints

- [ ] Core flow runs locally from a clean checkout.
- [ ] Required external integration is tested early with a real request.
- [ ] First deployment is complete by the midpoint, even if visually rough.
- [ ] Deterministic seed/demo data is available.
- [ ] Network calls have timeouts and understandable errors.
- [ ] Critical business logic has focused tests.
- [ ] Lint, type-check, test, and build commands are documented and pass.
- [ ] A teammate other than the author has followed the setup instructions.
- [ ] No secrets or private data are present in Git history.

## Demo readiness

- [ ] The demo runbook contains a 2–3 minute script mapped to judging criteria.
- [ ] The demo starts from a known state and dedicated test account.
- [ ] The deployed URL and local fallback both work.
- [ ] Screenshots or a short recording cover external-service failure.
- [ ] Browser tabs, terminals, notifications, and sample data are prepared.
- [ ] The pitch covers problem, product, live flow, differentiator, and impact.
- [ ] Speakers, driver, timekeeper, and recovery owner are assigned.
- [ ] The demo has been rehearsed twice under the actual time limit.

## Final 60 minutes

- [ ] Freeze feature work unless the core demo is broken.
- [ ] Run all quality gates and smoke-test from a clean start.
- [ ] Verify repository visibility, submission links, video, and sponsor tags.
- [ ] Remove debug output and recheck secret exclusion.
- [ ] Tag or commit the exact demonstrated version.
- [ ] Open the deployed app and fallback assets before presenting.
