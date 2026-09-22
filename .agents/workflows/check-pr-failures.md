---
title: Check a pull request's CI failures
description: Work through a Site Kit pull request's failing CI checks, classifying each failure as caused by the PR, pre-existing, flaky or environmental before changing anything.
---

# Check a pull request's CI failures

Run with `/check-pr-failures <pr-number>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/check-pr-failures.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Watch the checks land** if they are still running (Step 0) — poll every 45s, report each as it completes, and say what is still pending rather than only what failed.
2. **Collect the checks** — `gh pr checks <number>` and the `check-runs` API for the head SHA (resolve it with `gh pr view <number> --json headRefOid --jq .headRefOid`).
   Read results at job level, not workflow level: a workflow shows as failed when any one of its
   jobs fails.
3. **Get the failure detail** — `gh run view <run-id> --log-failed`. Check-run annotations are
   usually useless (`Process completed with exit code 1`); the job log carries the failing test
   names. For VRT, open the report linked from the PR comment.
4. **Classify every failure before changing anything**, using the evidence tests in the
   playbook's Step 3: order-dependent/flaky (passes in isolation), pre-existing (reproduces at
   the merge base), environmental (local and CI disagree), or caused by this PR. Search the issue
   tracker and compare against other open PRs' runs before concluding.
5. **Apply the distinction in Step 4** — "the behaviour is pre-existing" and "the failure is
   unrelated to this PR" are different claims. A test green on `develop` and red here is this
   PR's to resolve.
6. **Act per class** (Step 5). Fix only what this PR caused. Remove a test only with evidence its
   scenario can no longer occur, and cite that evidence.
7. **Verify locally** before pushing (Step 6) — mind `npm run build:test` for E2E, and that the
   `VRT=1` build wipes `dist/assets`.
8. **Report** the table defined in Step 7: one row per failing check, with its class, the
   evidence, and a recommended action.

## Guardrails

- **Never mask a failure** — no suppressing console errors, loosening assertions, deleting tests,
  or regenerating another scenario's reference images to turn a check green.
- **Do not touch artifacts this PR does not own.**
- **Ask before pushing, re-running jobs, or editing the PR.**
