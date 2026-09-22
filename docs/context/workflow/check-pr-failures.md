# Checking a Pull Request's CI Failures — Playbook

This is the **single source of truth** for working through failing CI checks on a Site Kit pull
request. Every AI coding tool points at this file through a thin per-tool adapter, so the
procedure stays identical everywhere. When you update the process, update it **here** — not in
the adapters.

The goal is not "make CI green". It is **to know why each check fails**, and to fix only what
this PR caused.

---

## Step 0 — Watching the checks land (optional)

When the PR has just been pushed, checks take ~30 minutes to complete and arrive in no useful
order. Rather than polling by hand, watch them and report each as it lands:

```
gh api "repos/google/site-kit-wp/commits/<sha>/check-runs?per_page=100" \
  --jq '.check_runs[]? | select(.status=="completed") | select(.conclusion!="skipped") | "\(.conclusion|ascii_upcase): \(.name)"'
```

Poll every 45s, emitting only newly-completed checks, and stop once none are `in_progress`.

Two things to get right while reporting:

- **Say what is still pending**, not just what failed. "E2E failed" reads as a broken board when
  VRT and JS Tests have not reported yet.
- **Job names can mislead.** In this repo three jobs are named `WordPress 5.2.21` / `latest` /
  `nightly` — those are Playwright. The E2E jobs are named `E2E (WordPress …)`. Check names
  before attributing a failure.

Set expectations up front where you can: if a check is known to be red for a reason already
established, say so before it reports, so a red mark does not restart an investigation that is
already settled.

## Step 1 — Collect the check results

```
gh pr checks <number>
gh api "repos/google/site-kit-wp/commits/<head-sha>/check-runs?per_page=100" \
  --jq '.check_runs[] | select(.conclusion=="failure" or .status!="completed") | "\(.status)\t\(.conclusion // "-")\t\(.name)"'
```

Record which checks fail and which pass. A workflow shows as failed when any one of its jobs
fails, so "Code Linting and JS Tests failed" may mean only JS Tests failed — check job level,
not workflow level, before telling anyone what broke.

## Step 2 — Get the failure detail

```
gh run view <run-id> --log-failed
```

Check-run **annotations are usually useless** (`Process completed with exit code 1`). The job
log is what carries the failing test names and assertions. For VRT, the report linked from the
PR comment shows reference/test/diff images side by side, which is often the fastest way to see
what actually changed.

If `gh` is unavailable, ask the user to install and authenticate it (`brew install gh && gh auth
login`) rather than working from pasted log archives — job logs need auth and cannot be fetched
anonymously.

## Step 3 — Classify every failure

Classify **before** changing anything. Each class has a test that settles it:

| Class | Test | Evidence it produces |
| --- | --- | --- |
| **Order-dependent / flaky** | Run the suite alone: `npx jest --config=./jest.config.js <pattern>`, or `npm run test:e2e -- --testPathPattern "<spec>"` | Passes in isolation, fails in a full run. Often a *different* subset each run — that variation is itself the evidence. |
| **Pre-existing** | Check out the merge base (`git merge-base HEAD origin/develop`) in a worktree or detached HEAD, reproduce there | Fails without any of this PR's changes |
| **Environmental** | Compare local against CI for the same commit | Fails locally, passes in CI (or vice versa) |
| **Caused by this PR** | Everything else, once the above are excluded | Green on `develop`, red here |

Two further checks worth running before concluding anything:

- **Search the issue tracker.** `gh issue list --repo google/site-kit-wp --state all --search "<area>"`. A test that looks broken is sometimes obsolete by design — a shipped decision removed the scenario it covers. Equally, a "new" bug may already be filed.
- **Compare against other PRs.** If another open PR's run fails the same scenario, it is shared
  flakiness, not yours. This is especially useful for VRT.

## Step 4 — Apply the distinction that matters most

**"The behaviour is pre-existing" and "the failure is unrelated to this PR" are different
claims.** A test that is green on `develop` and red here is this PR's to resolve, even when the
behaviour it trips over is older than the PR.

The common case: a suite runs against a different code path than production. E2E in this repo
filters `googlesitekit_is_feature_enabled` at priority 999
(`tests/e2e/mu-plugins/e2e-rest-feature-flag.php`), overriding any force-enable in `Plugin.php`.
So E2E may have been exercising a path no user has taken for several releases. Removing a flag
switches E2E onto the real path for the first time, and the resulting failures are in scope even
though nothing about the underlying behaviour changed.

Check the issue's **Test Coverage** section before arguing scope. "Ensure the remaining suites
pass" makes the suites part of the deliverable.

## Step 5 — Decide an action per class

- **Caused by this PR** — fix it. If a shared component genuinely misbehaves, fix the component
  rather than the assertion, and say so in the PR description.
- **Obsolete** — remove the test, but only with evidence that the scenario can no longer occur
  (a linked issue, the code path, and ideally a manual check). Cite that evidence in the commit
  message.
- **Flaky / pre-existing / environmental** — leave it, and report it with the evidence. Re-run
  the job if a green board is worth more than the caveat, but do not present a re-run as a fix.
- **Someone else's broken fixture** — do not regenerate it. Report it so its owner can.

## Step 6 — Verify locally before pushing

Reproduce locally first; a CI round trip costs ~30 minutes.

- **E2E needs `npm run build:test`**, not `npm run build` — a production build omits the E2E
  bundle and every spec then dies in `setupSiteKit()` waiting for `window._e2eApiFetch`.
- **VRT needs a `VRT=1` Storybook build** (`npm run test:visualtest`), which **wipes
  `dist/assets`** and blanks the local dashboard until you rebuild. Run it last, and rebuild
  afterwards.
- After merging `develop`, re-run `npm install` — a merge can bring new dependencies.
- Re-run the full suite after any fix. Semantic merge conflicts are common: `develop` can add a
  test asserting copy this PR renamed, and git merges both cleanly with no conflict markers.

## Step 7 — Report

Produce a table, one row per failing check, and nothing that the evidence does not support:

| Check | Failure | Class | Evidence | Action |
| --- | --- | --- | --- | --- |
| E2E (WP latest) | `write-scope-requests` ×2 | Obsolete | #11372 made the scope part of the initial request; confirmed in `get_refined_scopes()` and on a real site | Remove, citing #11372 |
| JS Tests | `WelcomeModal` | Flaky | Passes in isolation; failing subset differs per run | Leave; note in PR |

Then state plainly what is left failing and why, so the reviewer can check the reasoning rather
than take it on trust.

---

## Guardrails

- **Never mask a failure.** Do not suppress a console error, loosen an assertion, delete a test
  or approve a reference image to turn a check green. Every one of those hides a defect that
  will resurface later, usually for someone else.
- **Do not touch artifacts this PR does not own** — another scenario's VRT references, another
  module's specs. A green board bought with scope creep is a worse PR.
- **A test that fails is not automatically wrong.** Establish that its scenario is obsolete
  before removing it; "it's flaky" and "it's broken" are different findings.
- **Do not claim a fix is verified until it has been run.** Say which suites were run and which
  were not.
- **Ask before pushing, re-running jobs, or editing the PR.**
