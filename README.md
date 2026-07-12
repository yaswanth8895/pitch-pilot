# Hackathon Project

Neutral project workspace prepared for the hackathon on 2026-07-13. The product and stack are intentionally undecided; record them before generating application boilerplate.

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

1. Fill in `docs/PRODUCT_BRIEF.md` from the challenge and judging rubric.
2. Record the stack and important choices in `docs/DECISIONS.md`.
3. Replace the `TBD` command table in `AGENTS.md` with exact commands.
4. Create a GitHub repository, add it as `origin`, and invite the team.
5. Make one end-to-end path work and deploy it before adding secondary features.
6. Rehearse `docs/DEMO_RUNBOOK.md` on the presentation machine and network.

See `HACKATHON_CHECKLIST.md` for the complete readiness list.
