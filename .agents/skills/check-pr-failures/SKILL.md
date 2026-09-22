---
name: check-pr-failures
description: >
  Work through the failing CI checks on a Site Kit pull request: classify each failure as caused by
  the PR, pre-existing, flaky or environmental, and iterate until the board is green or every
  remaining failure is evidenced as unrelated. Use when the user asks why CI is failing, to
  check or watch a PR's checks, or to work through test failures on a pull request (e.g.
  "why is CI failing on #12345", "check the failures on my PR", "/check-pr-failures 12345") in the
  google/site-kit-wp repo.
argument-hint: "[pr-number]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Check a pull request's CI failures

Work through the CI checks on pull request **#$ARGUMENTS** (if no number was given, ask for one) by
following the project's shared playbook. Do not reimplement the procedure here — read and
follow the playbook, which is the single source of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/check-pr-failures.md` and follow every step: watch
   the checks land if they are still running, collect the results, pull the failure detail,
   classify each failure against the evidence tests, decide an action per class, verify locally,
   and report.
2. **Collect the checks**: `gh pr checks $ARGUMENTS` and
   `gh api "repos/google/site-kit-wp/commits/<sha>/check-runs?per_page=100"`. Stop and ask the
   user if the PR is missing or no checks have run.
3. **Classify before fixing.** A failure is only the PR's to fix once the evidence says so. The
   playbook defines the four classes and the test that distinguishes each.
4. **Never mask a failure.** Do not suppress console errors, loosen assertions, delete tests or
   regenerate another scenario's reference images to turn a check green — see the playbook's
   Guardrails.
5. **Report** in the structure the playbook defines, with an evidenced classification and a
   recommended action for every failure.

## Important

- **Ask before pushing**, and before re-running jobs or editing the PR on GitHub.
- Report what the evidence supports, not what would be convenient. "Pre-existing behaviour" and
  "unrelated to this PR" are different claims; the playbook explains why.
