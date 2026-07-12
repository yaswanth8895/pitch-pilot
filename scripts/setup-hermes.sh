#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$ROOT/.agents/skills"

if ! command -v hermes >/dev/null 2>&1; then
  printf 'Hermes is not installed. See https://hermes-agent.nousresearch.com/docs/
' >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  printf 'git is required but was not found.
' >&2
  exit 1
fi

CONFIG_PATH="$(hermes config path | tail -n 1)"
INSTALL_DIR="$(hermes --version | awk -F ': ' '/^Install directory:/ {print $2; exit}')"
HERMES_PYTHON="$INSTALL_DIR/venv/bin/python"
if [ ! -x "$HERMES_PYTHON" ]; then
  printf 'Could not locate Hermes Python at %s
' "$HERMES_PYTHON" >&2
  printf 'Add %s to skills.external_dirs with hermes config edit.
' "$SKILLS_DIR" >&2
  exit 1
fi

"$HERMES_PYTHON" - "$CONFIG_PATH" "$SKILLS_DIR" "$INSTALL_DIR" <<'PY'
from pathlib import Path
import os
import sys
import yaml

config_path = Path(sys.argv[1]).expanduser().resolve()
skills_dir = str(Path(sys.argv[2]).resolve())
install_dir = Path(sys.argv[3]).resolve()
sys.path.insert(0, str(install_dir))
with config_path.open(encoding="utf-8") as handle:
    config = yaml.safe_load(handle) or {}
skills = config.get("skills") or {}
external = skills.get("external_dirs") or []
if isinstance(external, str):
    external = [external]
external = [str(Path(item).expanduser()) for item in external]
if skills_dir not in external:
    external.append(skills_dir)
from utils import atomic_roundtrip_yaml_update
atomic_roundtrip_yaml_update(config_path, "skills.external_dirs", external)
try:
    os.chmod(config_path, 0o600)
except OSError:
    pass
print(f"Registered project skills: {skills_dir}")
PY

hermes bundles create hackathon-dev   --skill hackathon-delivery   --skill test-driven-development   --skill requesting-code-review   --description "Build a verified, review-ready hackathon demo slice"   --instruction "Follow AGENTS.md and protect the smallest stable end-to-end demo path."   --force

printf '
Hermes status:
'
hermes doctor
printf '
GitHub CLI status:
'
if command -v gh >/dev/null 2>&1; then gh auth status || true; else printf 'gh is not installed.
'; fi
printf '
Setup complete. Restart Hermes, then run:
  %s/scripts/hackathon-agent
' "$ROOT"
