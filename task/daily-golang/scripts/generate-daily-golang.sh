#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../_shared/scripts" && pwd)"
exec bash "$SCRIPT_DIR/run-daily-task.sh" daily-golang "$@"
