#!/usr/bin/env bash
# Detect "catastrophic" Jest failures (runtime error test suites / missing results file)
# Usage: check-catastrophic-jest-failures.sh [results-json-path]
# Default results JSON filename: jest-results.json (looked for in current working directory).
# Exits non‑zero if a catastrophic condition is detected so CI can abort early.

set -euo pipefail

RESULTS_FILE="${1:-jest-results.json}"

if [ ! -f "$RESULTS_FILE" ]; then
  echo "❌ Catastrophic Jest failure: no $RESULTS_FILE produced (possible crash or misconfiguration)." >&2
  exit 1
fi

# Try jq if available for resilience against weird formatting; fallback to node require.
if command -v jq >/dev/null 2>&1; then
  NUM_RUNTIME_ERRORS=$(jq -r '.numRuntimeErrorTestSuites // 0' "$RESULTS_FILE")
else
  NUM_RUNTIME_ERRORS=$(node -e "const f=require('./${RESULTS_FILE}');console.log(f.numRuntimeErrorTestSuites||0);")
fi

if [ "${NUM_RUNTIME_ERRORS}" -gt 0 ]; then
  echo "❌ Catastrophic Jest failure: ${NUM_RUNTIME_ERRORS} test suite(s) had runtime errors (syntax/dependency issues). Aborting without retries." >&2
  exit 1
fi

echo "No catastrophic suite failures detected. Proceeding to potential retries for normal test failures."
exit 0
