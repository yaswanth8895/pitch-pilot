# Hackathon Project Agent Guide

## Mission

Build the smallest reliable product that clearly demonstrates the team's idea and judging value. Optimize for a working end-to-end demo, not production-scale architecture.

The hackathon date is 2026-07-13. The stack and product are not chosen yet. When they are chosen, update this file, `README.md`, and `docs/PRODUCT_BRIEF.md` with exact technologies, commands, paths, ports, and deployment targets.

## Source of Truth

Before changing code, read in this order:

1. `AGENTS.md`
2. `docs/PRODUCT_BRIEF.md`
3. `docs/DECISIONS.md`
4. `README.md`
5. Relevant manifests, tests, and source files

Prefer repository evidence over assumptions. If a missing decision changes the architecture or creates expensive rework, ask one focused question. Otherwise state the assumption and continue.

## Delivery Priorities

Use this priority order when time is limited:

1. A repeatable end-to-end demo of the core user journey
2. Correctness and graceful failure on the demo path
3. A deployed URL or reproducible local launch
4. Clear evidence of the judging criteria or sponsor technology
5. Usability and visual polish
6. Additional features

Use a tracer-bullet approach: connect UI, API, data, and required external services with the thinnest possible vertical slice before expanding any layer.

## Working Agreement

- Inspect the repository and `git status` before editing.
- For work with three or more steps, maintain a task list and keep only one item in progress.
- Make small, reviewable changes. Avoid unrelated refactors during feature work.
- Reuse an existing pattern before introducing a new abstraction.
- Do not add a dependency unless it saves meaningful hackathon time or is required by the product.
- Use the package manager selected by the committed lockfile. Never mix npm, pnpm, yarn, Bun, pip, Poetry, and uv conventions in the same component.
- Pin runtime and dependency versions once the stack is selected.
- Prefer managed services and boring technology over infrastructure the team must operate during the demo.
- Keep the default branch runnable. Use short feature branches when multiple developers or agents are editing concurrently.
- Never rewrite shared Git history or discard another developer's work without explicit approval.

## Quality Loop

For every meaningful change:

1. Define observable acceptance criteria.
2. Add or update a focused test first for business logic and regressions.
3. Implement the smallest change that satisfies the criteria.
4. Run the narrowest relevant check, then the full available lint, type-check, test, and build commands.
5. Exercise the affected user flow or API manually when automated tests do not cover it.
6. Review the diff for secrets, generated artifacts, debug code, and accidental scope.
7. Update documentation when commands, architecture, environment variables, or behavior changed.

Do not report success based only on written code. Include the real commands run and their results. If a check cannot run, explain the exact blocker.

## Definition of Done

A task is done only when all applicable items are true:

- Acceptance criteria are met.
- Relevant tests pass.
- Lint and type checks pass.
- The production build succeeds.
- The changed path has been smoke-tested.
- Failures shown to users are understandable and recoverable.
- New environment variable names appear in `.env.example` with no real values.
- Setup or behavior changes are documented.
- The diff contains no credentials, large accidental binaries, temporary output, or dead debug code.
- The demo runbook still works.

## Security and Data

- Never commit `.env`, access tokens, private keys, cookies, credentials, or personal data.
- Keep secrets in local environment files or the selected deployment platform's secret store.
- Use synthetic or explicitly approved data for the demo.
- Validate untrusted input at system boundaries.
- Use least-privilege credentials and avoid logging sensitive values.
- Review third-party code and generated commands before execution.

## Architecture Guardrails

Until the stack is decided:

- Keep product code separate from scripts, docs, generated files, and infrastructure.
- Centralize configuration and external-service clients.
- Put one clear boundary around each external API so it can be mocked or replaced.
- Add timeouts and useful error messages to network calls.
- Prepare deterministic seed/demo data and a fallback path for unreliable live services.
- Avoid microservices, custom auth, premature queues, and generalized plugin systems unless the challenge requires them.

Once components exist, add focused `AGENTS.md` files inside major subdirectories only when their commands or conventions differ from this root guide.

## Hermes Workflow

Start Hermes from the repository root so this file loads automatically:

```bash
./scripts/hackathon-agent
```

Use the available skills deliberately:

- `/hackathon-dev <task>` — build a verified demo slice using the project workflow
- `/plan <request>` — write a plan without implementing it
- `/systematic-debugging <problem>` — investigate a failure before changing code
- `/github-pr-workflow <request>` — prepare a branch, commit, PR, and CI handoff
- `/requesting-code-review <request>` — run the pre-commit review gates

Use parallel subagents only for independent workstreams. Agents editing code concurrently must use isolated Git worktrees or non-overlapping files.

## Commands

Fill these in immediately after selecting the stack; do not leave multiple competing commands.

| Purpose | Command |
|---|---|
| Install dependencies | TBD |
| Start development | TBD |
| Lint | TBD |
| Type-check | TBD |
| Unit/integration tests | TBD |
| Production build | TBD |
| End-to-end smoke test | TBD |
| Deploy | TBD |

## Commit Style

Use concise conventional commits:

```text
feat: add the core recommendation flow
fix: handle provider timeout in demo mode
test: cover invalid upload input
docs: update local setup and demo steps
chore: pin the selected runtime
```
