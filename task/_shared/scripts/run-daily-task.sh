#!/usr/bin/env bash
# Shared daily-task runner. Invoked by task/*/scripts/generate.sh wrappers.
set -euo pipefail

TASK_ID="${1:?task id required, e.g. daily-news}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TASK_DIR="$REPO_ROOT/task/$TASK_ID"

if [[ ! -f "$TASK_DIR/task.json" ]]; then
  echo "Missing task.json for $TASK_ID" >&2
  exit 2
fi

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

DAILY_DATE="${DAILY_DATE:-${NEWS_DATE:-$(date +%F)}}"
DAILY_DRY_RUN="${DAILY_DRY_RUN:-${NEWS_DRY_RUN:-1}}"
DAILY_COMMIT_PUSH="${DAILY_COMMIT_PUSH:-${NEWS_COMMIT_PUSH:-0}}"
DAILY_RUN_BUILD="${DAILY_RUN_BUILD:-${NEWS_RUN_BUILD:-0}}"
DAILY_RUN_SUMMARIES="${DAILY_RUN_SUMMARIES:-${NEWS_RUN_SUMMARIES:-0}}"
DAILY_RUN_DOC_LINKS="${DAILY_RUN_DOC_LINKS:-${NEWS_RUN_DOC_LINKS:-0}}"
DAILY_RUN_TYPES_CHECK="${DAILY_RUN_TYPES_CHECK:-${NEWS_RUN_TYPES_CHECK:-0}}"
DAILY_FORCE="${DAILY_FORCE:-0}"
DAILY_TMP_DIR="${DAILY_TMP_DIR:-task/$TASK_ID/tmp}"
HERMES_CMD="${HERMES_CMD:-hermes}"

if [[ ! "$DAILY_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "DAILY_DATE must be YYYY-MM-DD, got: $DAILY_DATE" >&2
  exit 2
fi

CONFIG_JSON="$(cat "$TASK_DIR/task.json")"
CONTENT_DIR_REL="$(node -e "console.log(JSON.parse(process.argv[1]).contentDir)" "$CONFIG_JSON")"
FILENAME_MODE="$(node -e "console.log(JSON.parse(process.argv[1]).filename)" "$CONFIG_JSON")"
PROMPT_TEMPLATE="$(node -e "console.log(JSON.parse(process.argv[1]).promptTemplate)" "$CONFIG_JSON")"
SITE_BASE_URL="$(node -e "console.log(JSON.parse(process.argv[1]).siteBaseUrl)" "$CONFIG_JSON")"
SKILL="$(node -e "const c=JSON.parse(process.argv[1]); console.log(c.skill||'')" "$CONFIG_JSON")"
TOOLSETS="$(node -e "const c=JSON.parse(process.argv[1]); console.log(c.toolsets||'file,skills')" "$CONFIG_JSON")"

mkdir -p "$REPO_ROOT/$DAILY_TMP_DIR"

TARGET_SLUG="$DAILY_DATE"
DRAFT_REL="$DAILY_TMP_DIR/$DAILY_DATE.mdx"
if [[ "$FILENAME_MODE" == "lesson" ]]; then
  TARGET_SLUG="$(node -e "
    const fs=require('fs'); const path=require('path');
    const repo=process.argv[1]; const cfg=JSON.parse(fs.readFileSync(path.join(repo,'task/$TASK_ID/task.json'),'utf8'));
    const dir=path.join(repo,cfg.contentDir); const prefix=cfg.lessonPrefix||'lesson-';
    const nums=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.startsWith(prefix)&&n.endsWith('.mdx')).map(n=>parseInt(n.slice(prefix.length),10)).filter(n=>Number.isFinite(n)):[];
    const next=nums.length?Math.max(...nums)+1:1;
    console.log(prefix+String(next).padStart(2,'0'));
  " "$REPO_ROOT")"
  DRAFT_REL="$DAILY_TMP_DIR/$TARGET_SLUG.mdx"
fi
DRAFT_FILE="$REPO_ROOT/$DRAFT_REL"

if [[ -f "$TASK_DIR/sources.json" ]]; then
  SOURCE_HINTS_FILE="$REPO_ROOT/$DAILY_TMP_DIR/source-hints-$DAILY_DATE.md"
  node "$SCRIPT_DIR/collect-rss-hints.mjs" "$TASK_DIR/sources.json" "$SOURCE_HINTS_FILE" >/dev/null
  SOURCE_HINTS="$(cat "$SOURCE_HINTS_FILE")"
else
  SOURCE_HINTS=""
fi

LESSON_CONTEXT=""
if [[ -f "$TASK_DIR/syllabus.json" ]]; then
  LESSON_CONTEXT="$(node -e "
    const fs=require('fs'); const path=require('path');
    const repo=process.argv[1]; const task=process.argv[2];
    const cfg=JSON.parse(fs.readFileSync(path.join(repo,'task',task,'task.json'),'utf8'));
    const syllabus=JSON.parse(fs.readFileSync(path.join(repo,'task',task,cfg.syllabusFile),'utf8'));
    const dir=path.join(repo,cfg.contentDir);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    const prefix=cfg.lessonPrefix||'lesson-';
  const nums=fs.readdirSync(dir).filter(n=>n.startsWith(prefix)&&n.endsWith('.mdx')).map(n=>parseInt(n.slice(prefix.length),10)).filter(n=>Number.isFinite(n));
  const next=nums.length?Math.max(...nums)+1:1;
  const lesson=syllabus.lessons.find(l=>l.lesson===next);
  if(!lesson){console.error('No syllabus entry for lesson '+next); process.exit(3);}
  console.log(JSON.stringify({nextLesson:next,topic:lesson.topic,objectives:lesson.objectives,prerequisites:lesson.prerequisites||[]}));
  " "$REPO_ROOT" "$TASK_ID")"
fi

PROMPT_FILE="$REPO_ROOT/$DAILY_TMP_DIR/prompt-$DAILY_DATE.md"
TEMPLATE="$(cat "$TASK_DIR/$PROMPT_TEMPLATE")"
PROMPT="$TEMPLATE"
PROMPT="${PROMPT//\{\{REPO_ROOT\}\}/$REPO_ROOT}"
PROMPT="${PROMPT//\{\{DAILY_DATE\}\}/$DAILY_DATE}"
PROMPT="${PROMPT//\{\{NEWS_DATE\}\}/$DAILY_DATE}"
PROMPT="${PROMPT//\{\{DAILY_COMMIT_PUSH\}\}/$DAILY_COMMIT_PUSH}"
PROMPT="${PROMPT//\{\{NEWS_COMMIT_PUSH\}\}/$DAILY_COMMIT_PUSH}"
PROMPT="${PROMPT//\{\{DAILY_RUN_BUILD\}\}/$DAILY_RUN_BUILD}"
PROMPT="${PROMPT//\{\{NEWS_RUN_BUILD\}\}/$DAILY_RUN_BUILD}"
PROMPT="${PROMPT//\{\{DAILY_RUN_SUMMARIES\}\}/$DAILY_RUN_SUMMARIES}"
PROMPT="${PROMPT//\{\{NEWS_RUN_SUMMARIES\}\}/$DAILY_RUN_SUMMARIES}"
PROMPT="${PROMPT//\{\{DAILY_RUN_DOC_LINKS\}\}/$DAILY_RUN_DOC_LINKS}"
PROMPT="${PROMPT//\{\{NEWS_RUN_DOC_LINKS\}\}/$DAILY_RUN_DOC_LINKS}"
PROMPT="${PROMPT//\{\{DAILY_RUN_TYPES_CHECK\}\}/$DAILY_RUN_TYPES_CHECK}"
PROMPT="${PROMPT//\{\{NEWS_RUN_TYPES_CHECK\}\}/$DAILY_RUN_TYPES_CHECK}"
PROMPT="${PROMPT//\{\{SOURCE_HINTS\}\}/$SOURCE_HINTS}"
PROMPT="${PROMPT//\{\{LESSON_CONTEXT\}\}/$LESSON_CONTEXT}"
PROMPT="${PROMPT//\{\{SITE_BASE_URL\}\}/$SITE_BASE_URL}"
PROMPT="${PROMPT//\{\{DRAFT_FILE\}\}/$DRAFT_REL}"
printf '%s\n' "$PROMPT" > "$PROMPT_FILE"

cat <<EOF
Daily task prepared.
- task: $TASK_ID
- date: $DAILY_DATE
- slug: $TARGET_SLUG
- draft: $DRAFT_REL
- repo: $REPO_ROOT
- prompt: ${PROMPT_FILE#$REPO_ROOT/}
- dry run: $DAILY_DRY_RUN
EOF

if [[ "$DAILY_DRY_RUN" == "1" ]]; then
  echo "Dry run only; set DAILY_DRY_RUN=0 to call Hermes."
  exit 0
fi

if [[ "$DAILY_FORCE" != "1" && -f "$REPO_ROOT/$CONTENT_DIR_REL/$TARGET_SLUG.mdx" ]]; then
  echo "Target exists: $CONTENT_DIR_REL/$TARGET_SLUG.mdx (set DAILY_FORCE=1 to overwrite)" >&2
  exit 0
fi

MODEL_ARGS=()
if [[ -n "${HERMES_PROVIDER:-}" ]]; then
  MODEL_ARGS+=(--provider "$HERMES_PROVIDER")
fi
if [[ -n "${HERMES_MODEL:-}" ]]; then
  MODEL_ARGS+=(--model "$HERMES_MODEL")
fi

SKILL_ARGS=()
if [[ -n "$SKILL" ]]; then
  SKILL_ARGS=(--skills "$SKILL")
fi

cd "$REPO_ROOT"
"$HERMES_CMD" chat \
  --quiet \
  "${SKILL_ARGS[@]}" \
  --toolsets "$TOOLSETS" \
  "${MODEL_ARGS[@]}" \
  --query "$PROMPT"

if [[ ! -f "$DRAFT_FILE" ]]; then
  echo "Hermes did not produce draft at $DRAFT_FILE" >&2
  exit 4
fi

export DAILY_TASK="$TASK_ID"
export DAILY_DATE
export DAILY_INPUT_FILE="${DRAFT_FILE#$REPO_ROOT/}"
export DAILY_RUN_SUMMARIES
node "$SCRIPT_DIR/apply-daily-content.mjs"

if [[ "$DAILY_COMMIT_PUSH" == "1" ]]; then
  export DAILY_SLUG="$TARGET_SLUG"
  node "$SCRIPT_DIR/commit-daily-content.mjs"
fi
