#!/usr/bin/env bash
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$TASK_DIR/../.." && pwd)"

# Load folder-local env. Do not source .env.example because it intentionally
# contains empty placeholders that would override one-off command env vars.
set -a
if [[ -f "$TASK_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  source "$TASK_DIR/.env"
fi
if [[ -f "$TASK_DIR/.env.local" ]]; then
  # shellcheck disable=SC1091
  source "$TASK_DIR/.env.local"
fi
set +a

NEWS_DATE="${NEWS_DATE:-$(date +%F)}"
NEWS_DRY_RUN="${NEWS_DRY_RUN:-1}"
NEWS_COMMIT_PUSH="${NEWS_COMMIT_PUSH:-0}"
NEWS_RUN_BUILD="${NEWS_RUN_BUILD:-1}"
NEWS_RUN_DOC_LINKS="${NEWS_RUN_DOC_LINKS:-0}"
NEWS_RUN_TYPES_CHECK="${NEWS_RUN_TYPES_CHECK:-0}"
NEWS_TMP_DIR="${NEWS_TMP_DIR:-task/news/tmp}"
HERMES_CMD="${HERMES_CMD:-hermes}"

if [[ ! "$NEWS_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "NEWS_DATE must be YYYY-MM-DD, got: $NEWS_DATE" >&2
  exit 2
fi

mkdir -p "$REPO_ROOT/$NEWS_TMP_DIR"
SOURCE_HINTS_FILE="$REPO_ROOT/$NEWS_TMP_DIR/source-hints-$NEWS_DATE.md"
PROMPT_FILE="$REPO_ROOT/$NEWS_TMP_DIR/prompt-$NEWS_DATE.md"

node "$TASK_DIR/scripts/collect-source-hints.mjs" "$SOURCE_HINTS_FILE" >/dev/null

SOURCE_HINTS="$(cat "$SOURCE_HINTS_FILE")"
TEMPLATE="$(cat "$TASK_DIR/prompts/daily-news-cron.md")"
PROMPT="$TEMPLATE"
PROMPT="${PROMPT//\{\{REPO_ROOT\}\}/$REPO_ROOT}"
PROMPT="${PROMPT//\{\{NEWS_DATE\}\}/$NEWS_DATE}"
PROMPT="${PROMPT//\{\{NEWS_COMMIT_PUSH\}\}/$NEWS_COMMIT_PUSH}"
PROMPT="${PROMPT//\{\{NEWS_RUN_BUILD\}\}/$NEWS_RUN_BUILD}"
PROMPT="${PROMPT//\{\{NEWS_RUN_DOC_LINKS\}\}/$NEWS_RUN_DOC_LINKS}"
PROMPT="${PROMPT//\{\{NEWS_RUN_TYPES_CHECK\}\}/$NEWS_RUN_TYPES_CHECK}"
PROMPT="${PROMPT//\{\{SOURCE_HINTS\}\}/$SOURCE_HINTS}"
printf '%s\n' "$PROMPT" > "$PROMPT_FILE"

cat <<EOF
Daily news task prepared.
- date: $NEWS_DATE
- repo: $REPO_ROOT
- source hints: ${SOURCE_HINTS_FILE#$REPO_ROOT/}
- prompt: ${PROMPT_FILE#$REPO_ROOT/}
- dry run: $NEWS_DRY_RUN
EOF

if [[ "$NEWS_DRY_RUN" == "1" ]]; then
  echo "Dry run only; set NEWS_DRY_RUN=0 in task/news/.env.local to call Hermes."
  exit 0
fi

MODEL_ARGS=()
if [[ -n "${HERMES_PROVIDER:-}" ]]; then
  MODEL_ARGS+=(--provider "$HERMES_PROVIDER")
fi
if [[ -n "${HERMES_MODEL:-}" ]]; then
  MODEL_ARGS+=(--model "$HERMES_MODEL")
fi

cd "$REPO_ROOT"
"$HERMES_CMD" chat \
  --quiet \
  --skills daily-tech-news-vuepress \
  --toolsets web,terminal,file,browser,skills \
  "${MODEL_ARGS[@]}" \
  --query "$PROMPT"
