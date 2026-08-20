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

NEWS_TZ="${NEWS_TZ:-Asia/Shanghai}"
NEWS_DATE="${NEWS_DATE:-$(TZ="$NEWS_TZ" date +%F)}"
NEWS_DRY_RUN="${NEWS_DRY_RUN:-1}"
NEWS_COMMIT_PUSH="${NEWS_COMMIT_PUSH:-0}"
NEWS_FORCE="${NEWS_FORCE:-0}"
NEWS_RUN_BUILD="${NEWS_RUN_BUILD:-0}"
NEWS_RUN_SUMMARIES="${NEWS_RUN_SUMMARIES:-1}"
NEWS_RUN_DOC_LINKS="${NEWS_RUN_DOC_LINKS:-0}"
NEWS_RUN_TYPES_CHECK="${NEWS_RUN_TYPES_CHECK:-0}"
NEWS_TMP_DIR="${NEWS_TMP_DIR:-task/daily-news/tmp}"
NEWS_PUSH_REF="${NEWS_PUSH_REF:-main}"
HERMES_CMD="${HERMES_CMD:-hermes}"
export NEWS_DATE NEWS_TZ NEWS_RUN_SUMMARIES

CONTENT_REL="content/docs/news/daily-news/${NEWS_DATE}.mdx"
CONTENT_FILE="$REPO_ROOT/$CONTENT_REL"
DRAFT_FILE="$REPO_ROOT/$NEWS_TMP_DIR/${NEWS_DATE}.mdx"
SITE_URL="https://www.acongm.com/docs/news/daily-news/${NEWS_DATE}"

if [[ ! "$NEWS_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "NEWS_DATE must be YYYY-MM-DD, got: $NEWS_DATE" >&2
  exit 2
fi

already_published() {
  git -C "$REPO_ROOT" cat-file -e "HEAD:$CONTENT_REL" 2>/dev/null
}

if already_published && [[ "$NEWS_FORCE" != "1" ]]; then
  echo "Already published $NEWS_DATE; skip Hermes. Set NEWS_FORCE=1 to regenerate."
  echo "站点地址：$SITE_URL"
  exit 0
fi

mkdir -p "$REPO_ROOT/$NEWS_TMP_DIR"
SOURCE_HINTS_FILE="$REPO_ROOT/$NEWS_TMP_DIR/source-hints-$NEWS_DATE.md"
PREVIOUS_HINTS_FILE="$REPO_ROOT/$NEWS_TMP_DIR/previous-$NEWS_DATE.md"
PROMPT_FILE="$REPO_ROOT/$NEWS_TMP_DIR/prompt-$NEWS_DATE.md"

NEED_HERMES=1
if [[ "$NEWS_FORCE" != "1" && ( -f "$CONTENT_FILE" || -f "$DRAFT_FILE" ) ]]; then
  NEED_HERMES=0
fi

if [[ "$NEED_HERMES" == "1" ]]; then
  node "$TASK_DIR/scripts/collect-source-hints.mjs" "$SOURCE_HINTS_FILE" >/dev/null
  node "$TASK_DIR/scripts/collect-previous-urls.mjs" "$PREVIOUS_HINTS_FILE" >/dev/null

  SOURCE_HINTS="$(cat "$SOURCE_HINTS_FILE")"
  PREVIOUS_HINTS="$(cat "$PREVIOUS_HINTS_FILE")"
  TEMPLATE="$(cat "$TASK_DIR/prompts/daily-news-cron.md")"
  PROMPT="$TEMPLATE"
  PROMPT="${PROMPT//\{\{REPO_ROOT\}\}/$REPO_ROOT}"
  PROMPT="${PROMPT//\{\{NEWS_DATE\}\}/$NEWS_DATE}"
  PROMPT="${PROMPT//\{\{NEWS_COMMIT_PUSH\}\}/$NEWS_COMMIT_PUSH}"
  PROMPT="${PROMPT//\{\{NEWS_RUN_BUILD\}\}/$NEWS_RUN_BUILD}"
  PROMPT="${PROMPT//\{\{NEWS_RUN_SUMMARIES\}\}/$NEWS_RUN_SUMMARIES}"
  PROMPT="${PROMPT//\{\{NEWS_RUN_DOC_LINKS\}\}/$NEWS_RUN_DOC_LINKS}"
  PROMPT="${PROMPT//\{\{NEWS_RUN_TYPES_CHECK\}\}/$NEWS_RUN_TYPES_CHECK}"
  PROMPT="${PROMPT//\{\{SOURCE_HINTS\}\}/$SOURCE_HINTS}"
  PROMPT="${PROMPT//\{\{PREVIOUS_HINTS\}\}/$PREVIOUS_HINTS}"
  printf '%s\n' "$PROMPT" > "$PROMPT_FILE"
fi

cat <<EOF
Daily news task prepared.
- date: $NEWS_DATE
- tz: $NEWS_TZ
- repo: $REPO_ROOT
- source hints: ${SOURCE_HINTS_FILE#$REPO_ROOT/}
- previous hints: ${PREVIOUS_HINTS_FILE#$REPO_ROOT/}
- prompt: ${PROMPT_FILE#$REPO_ROOT/}
- dry run: $NEWS_DRY_RUN
- force: $NEWS_FORCE
- need Hermes: $NEED_HERMES
EOF

if [[ "$NEWS_DRY_RUN" == "1" ]]; then
  if [[ "$NEED_HERMES" == "0" ]]; then
    echo "Existing draft/content found; dry run will not apply or call Hermes."
  else
    echo "Dry run only; set NEWS_DRY_RUN=0 in task/daily-news/.env.local to call Hermes."
  fi
  exit 0
fi

if [[ "$NEED_HERMES" == "1" ]]; then
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
fi

INPUT_FILE=""
if [[ -f "$DRAFT_FILE" ]]; then
  INPUT_FILE="$DRAFT_FILE"
elif [[ -f "$CONTENT_FILE" ]]; then
  INPUT_FILE="$CONTENT_FILE"
else
  echo "Hermes did not produce $DRAFT_FILE or $CONTENT_REL" >&2
  exit 1
fi

NEWS_DATE="$NEWS_DATE" \
NEWS_INPUT_FILE="$INPUT_FILE" \
NEWS_RUN_SUMMARIES="$NEWS_RUN_SUMMARIES" \
node "$TASK_DIR/scripts/apply-daily-news.mjs"

cd "$REPO_ROOT"

if [[ "$NEWS_RUN_BUILD" == "1" ]]; then
  pnpm build
fi
if [[ "$NEWS_RUN_DOC_LINKS" == "1" ]]; then
  pnpm test:doc-links
fi
if [[ "$NEWS_RUN_TYPES_CHECK" == "1" ]]; then
  pnpm types:check
fi

if [[ "$NEWS_COMMIT_PUSH" != "1" ]]; then
  echo "Generated locally without commit/push."
  echo "站点地址：$SITE_URL"
  exit 0
fi

FILES=(
  "$CONTENT_REL"
  "content/docs/news/daily-news/meta.json"
  "apps/web/lib/navbar.ts"
)
if [[ "$NEWS_RUN_SUMMARIES" == "1" ]]; then
  FILES+=(
    "apps/web/public/summaries-v1.json"
    "apps/web/public/module-index.json"
  )
fi

git add -- "${FILES[@]}"
if git diff --cached --quiet; then
  echo "No daily-news changes to commit."
  echo "站点地址：$SITE_URL"
  exit 0
fi

git commit -m "docs(news): publish daily tech news for ${NEWS_DATE}"
git push origin "HEAD:${NEWS_PUSH_REF}"
echo "站点地址：$SITE_URL"
