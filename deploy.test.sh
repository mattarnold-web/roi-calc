#!/usr/bin/env bash
#
# deploy.test.sh — TDD tests for deploy.sh
#
# Exercises every guard in isolation using temporary git repos and
# mocked external commands (gcloud, npm).
#
# Usage:  ./deploy.test.sh
#
set -euo pipefail

PASS=0; FAIL=0
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REAL_DEPLOY="$SCRIPT_DIR/deploy.sh"
ORIG_PATH="$PATH"
GIT_BIN="$(command -v git)"
TMP_ROOT=""

# ── Cleanup trap ──────────────────────────────────────────────────────────
cleanup() { export PATH="$ORIG_PATH"; [[ -n "$TMP_ROOT" ]] && rm -rf "$TMP_ROOT"; TMP_ROOT=""; }
trap cleanup EXIT

# ── Assertions (single-execution: capture once, check exit + output) ─────
# run_deploy: runs deploy.sh once, captures exit code + combined output
# Sets: LAST_EXIT, LAST_OUTPUT
run_deploy() {
  set +e
  LAST_OUTPUT="$(bash deploy.sh "$@" 2>&1)"
  LAST_EXIT=$?
  set -e
}

assert_exit() {
  local desc="$1" expected="$2"
  if [[ "$LAST_EXIT" -eq "$expected" ]]; then
    echo -e "  ${GREEN}✓ PASS${NC}: $desc"; PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗ FAIL${NC}: $desc (expected exit $expected, got $LAST_EXIT)"; FAIL=$((FAIL+1))
  fi
}

assert_output() {
  local desc="$1" pattern="$2"
  if echo "$LAST_OUTPUT" | grep -qE "$pattern"; then
    echo -e "  ${GREEN}✓ PASS${NC}: $desc"; PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗ FAIL${NC}: $desc — expected /$pattern/"; FAIL=$((FAIL+1))
  fi
}

# ── Repo setup ────────────────────────────────────────────────────────────
setup_valid_repo() {
  cleanup  # clean any prior temp dirs
  TMP_ROOT="$(mktemp -d)"
  "$GIT_BIN" init --bare "$TMP_ROOT/origin.git" -b main >/dev/null 2>&1
  "$GIT_BIN" clone "$TMP_ROOT/origin.git" "$TMP_ROOT/local" >/dev/null 2>&1
  cd "$TMP_ROOT/local"
  "$GIT_BIN" checkout -b main 2>/dev/null || true
  cp "$REAL_DEPLOY" deploy.sh; chmod +x deploy.sh
  cat > package.json <<'EOF'
{"name":"t","version":"1.0.0","scripts":{"test":"echo ok","build":"echo ok"}}
EOF
  cp package.json package-lock.json
  "$GIT_BIN" add -A && "$GIT_BIN" commit -m "init" --quiet
  "$GIT_BIN" push origin main --quiet 2>/dev/null
  mkdir -p "$TMP_ROOT/bin"
  printf '#!/usr/bin/env bash\necho "[mock] gcloud $*"\n' > "$TMP_ROOT/bin/gcloud"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$TMP_ROOT/bin/npm"
  chmod +x "$TMP_ROOT/bin/gcloud" "$TMP_ROOT/bin/npm"
  export PATH="$TMP_ROOT/bin:$ORIG_PATH"
}

echo "━━━ deploy.sh tests ━━━"
echo ""

# Test 1: wrong branch
echo "Test 1: Rejects deploy from non-main branch"
setup_valid_repo
"$GIT_BIN" checkout -b feature/foo --quiet
run_deploy --dry-run
assert_exit "exits non-zero" 1
assert_output "error mentions branch" "Must be on.*main"

# Test 2: dirty working tree
echo "Test 2: Rejects deploy with uncommitted changes"
setup_valid_repo
echo dirty > untracked.txt && "$GIT_BIN" add untracked.txt
run_deploy --dry-run
assert_exit "exits non-zero" 1
assert_output "error mentions dirty" "dirty"

# Test 3: out-of-sync with origin
echo "Test 3: Rejects deploy when behind origin/main"
setup_valid_repo
"$GIT_BIN" clone "$TMP_ROOT/origin.git" "$TMP_ROOT/other" --quiet 2>/dev/null
(cd "$TMP_ROOT/other" && echo x>f && "$GIT_BIN" add -A && "$GIT_BIN" commit -m ahead --quiet && "$GIT_BIN" push origin main --quiet 2>/dev/null)
cd "$TMP_ROOT/local"
run_deploy --dry-run
assert_exit "exits non-zero" 1
assert_output "error mentions differs" "differs from origin"

# Test 4: missing gcloud (isolated PATH — only mock bin + git's own dir)
echo "Test 4: Rejects deploy when gcloud is missing"
setup_valid_repo
rm "$TMP_ROOT/bin/gcloud"
GIT_DIR="$(dirname "$GIT_BIN")"
export PATH="$TMP_ROOT/bin:$GIT_DIR:/usr/bin:/bin"
run_deploy --dry-run
assert_exit "exits non-zero" 1
assert_output "error mentions gcloud" "gcloud CLI not found"
export PATH="$TMP_ROOT/bin:$ORIG_PATH"

# Test 5: --dry-run succeeds and does NOT run npm ci/test/build
echo "Test 5: --dry-run completes without install/test/build"
setup_valid_repo
run_deploy --dry-run
assert_exit "exits zero" 0
assert_output "shows DRY RUN" "DRY RUN"

# Test 6: commit SHA in output
echo "Test 6: Output includes commit SHA"
setup_valid_repo
SHA="$("$GIT_BIN" rev-parse --short HEAD)"
run_deploy --dry-run
assert_output "shows commit SHA" "$SHA"

# Test 7: service metadata in output
echo "Test 7: Output includes service name, project, region"
setup_valid_repo
run_deploy --dry-run
assert_output "shows service" "roi-calc"
assert_output "shows project" "augment-skills-test"
assert_output "shows region" "us-central1"

# Test 8: unknown argument
echo "Test 8: Rejects unknown arguments"
setup_valid_repo
run_deploy --bogus
assert_exit "exits non-zero" 1
assert_output "error mentions unknown" "Unknown argument"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS+FAIL))
echo -e "  Total: $TOTAL  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
