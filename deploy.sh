#!/usr/bin/env bash
#
# deploy.sh — Deterministic deployment of roi-calc from main
#
# Usage:
#   ./deploy.sh            Deploy current main to Cloud Run
#   ./deploy.sh --dry-run  Show what would happen without deploying
#   ./deploy.sh --help     Show this help message
#
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────
CLOUD_RUN_SERVICE="roi-calc"
GCP_PROJECT="augment-skills-test"
GCP_REGION="us-central1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Helpers ───────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

die()  { echo -e "${RED}✗ $1${NC}" >&2; exit 1; }
info() { echo -e "${CYAN}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

usage() {
  echo "Usage: $0 [--dry-run] [--help]"
  echo ""
  echo "Options:"
  echo "  --dry-run  Run pre-flight checks only, skip install/test/build/deploy"
  echo "  --help     Show this help message"
  exit 0
}

# ── Argument parsing ─────────────────────────────────────────────────────
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --help|-h) usage ;;
    *) die "Unknown argument: $arg (see --help)" ;;
  esac
done

cd "$SCRIPT_DIR"

# ── Pre-flight checks ────────────────────────────────────────────────────
info "Running pre-flight checks…"

# 1. Must be on main
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$BRANCH" == "main" ]] || die "Must be on 'main' branch (currently on '$BRANCH')"
ok "On branch main"

# 2. Working tree must be clean
if [[ -n "$(git status --porcelain)" ]]; then
  die "Working tree is dirty — commit or stash changes first"
fi
ok "Working tree clean"

# 3. Pull latest & verify up-to-date with origin
if ! git fetch origin main --quiet 2>/dev/null; then
  die "Failed to fetch origin/main — check your network connection and remote config"
fi
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [[ "$LOCAL" != "$REMOTE" ]]; then
  die "Local main ($LOCAL) differs from origin/main ($REMOTE). Run 'git pull' first."
fi
ok "Up-to-date with origin/main"

# 4. Record commit for reproducibility
SHORT_SHA="$(git rev-parse --short HEAD)"
COMMIT_MSG="$(git log -1 --pretty=%s)"
info "Deploying commit ${SHORT_SHA} — ${COMMIT_MSG}"

# 5. gcloud available
command -v gcloud &>/dev/null || die "gcloud CLI not found — install from https://cloud.google.com/sdk"
ok "gcloud CLI available"

# ── Dry-run exits here ───────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Service:  ${GREEN}${CLOUD_RUN_SERVICE}${NC}"
echo -e "  Project:  ${GCP_PROJECT}"
echo -e "  Region:   ${GCP_REGION}"
echo -e "  Commit:   ${SHORT_SHA} — ${COMMIT_MSG}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$DRY_RUN" == "true" ]]; then
  warn "[DRY RUN] Pre-flight checks passed. Skipping install, test, build, and deploy."
  exit 0
fi

# ── Install & Test ────────────────────────────────────────────────────────
info "Installing dependencies…"
npm ci --silent
ok "Dependencies installed (from lockfile)"

info "Running tests…"
CI=true npm test -- --watchAll=false
ok "All tests passed"

# ── Build ─────────────────────────────────────────────────────────────────
info "Building production bundle…"
PUBLIC_URL=/ npm run build
ok "Build complete"

# ── Deploy ────────────────────────────────────────────────────────────────
gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --source "$SCRIPT_DIR" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" \
  --allow-unauthenticated \
  --quiet

SERVICE_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
  --region "$GCP_REGION" --project "$GCP_PROJECT" \
  --format='value(status.url)' 2>/dev/null || echo "https://${CLOUD_RUN_SERVICE}-${GCP_REGION}.run.app")"

echo ""
ok "Deployed ${CLOUD_RUN_SERVICE} @ ${SHORT_SHA} to ${SERVICE_URL}"
