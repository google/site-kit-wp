---
name: check-pr-failures
description: >
  Work through the failing CI checks on a pull request: classify each failure as caused by
  the PR, pre-existing, flaky or environmental, and iterate until the board is green or every
  remaining failure is evidenced as unrelated. Use when the user asks why CI is failing, to
  check or watch a PR's checks, or to work through test failures on a pull request (e.g.
  "why is CI failing on #12345", "check the failures on my PR", "/check-pr-failures 12345").
argument-hint: "[pr-number]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Check a pull request's CI failures

Work through the CI checks on pull request **#$ARGUMENTS**. If no number was given, ask for one.

The goal is not "make CI green". It is **to know why each check fails**, and to fix only what
this PR caused.

---

## Step 0 — Watching the checks land (optional)

When the PR has just been pushed, the checks take a while to complete and arrive in no useful
order. Don't guess how long they will take. Estimate it from recent passing runs of the same
workflow, using the workflow's file name from `.github/workflows/`:

```
gh run list --workflow <workflow-file> --status success --limit 5 --json databaseId,createdAt,updatedAt \
  --jq '.[] | "\(.databaseId)\t\(((.updatedAt | fromdate) - (.createdAt | fromdate)) / 60 | floor) min"'
```

A run's time includes any time it spent queued. For the time of each job on its own, use one of
those run IDs:

```
gh run view <run-id> --json jobs \
  --jq '.jobs[] | select(.conclusion == "success") | "\(((.completedAt | fromdate) - (.startedAt | fromdate)) / 60 | floor) min\t\(.name)"'
```

Tell the user when to expect the slowest check. Rather than polling by hand, watch the checks and
report each one as it lands:

```
gh api "repos/google/site-kit-wp/commits/$(gh pr view <number> --json headRefOid --jq .headRefOid)/check-runs?per_page=100" \
  --jq '.check_runs[]? | select(.status=="completed") | select(.conclusion!="skipped") | "\(.conclusion|ascii_upcase): \(.name)"'
```

Poll every 45s, emitting only newly-completed checks, and stop once none are `in_progress`.

Two things to get right while reporting:

- **Say what is still pending**, not just what failed. "E2E failed" reads as a broken board when
  VRT and JS Tests have not reported yet.
- **Job names can mislead.** Job names don't always say which suite they run. For example, the
  Playwright jobs are named after the WordPress version alone (`WordPress <version>`), while the
  E2E jobs are named `E2E (WordPress …)`. Check which workflow in `.github/workflows/` a job
  belongs to before attributing a failure.

Set expectations up front where you can: if a check is known to be red for a reason already
established, say so before it reports, so a red mark does not restart an investigation that is
already settled.

## Step 1 — Collect the check results

```
gh pr checks <number>
gh api "repos/google/site-kit-wp/commits/$(gh pr view <number> --json headRefOid --jq .headRefOid)/check-runs?per_page=100" \
  --jq '.check_runs[] | select(.conclusion=="failure" or .status!="completed") | "\(.status)\t\(.conclusion // "-")\t\(.name)"'
```

**Stop and ask the user** if the PR can't be found or no checks have run.

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
| **Order-dependent / flaky** | First check whether CI already retried the test (see below). For a suite that CI does not retry, run the test alone (`npm run test:e2e -- --testPathPattern "<spec>"`), run it several times on the same commit, and check the job's recent runs on `develop` for the same failure (see Step 4). | Passes in isolation, fails in a full run. Or passes on some runs of the same commit and fails on others. Often a *different* subset each run — that variation is itself the evidence. |
| **Pre-existing** | Check out the merge base (`git merge-base HEAD origin/develop`) in a worktree or detached HEAD, reproduce there | Fails without any of this PR's changes |
| **Environmental** | Compare local against CI for the same commit | Fails locally, passes in CI (or vice versa) |
| **Caused by this PR** | Everything else, once the above are excluded | Fails on every run here, and passes on every run at the merge base |

**Most suites already retry in CI.** Check the job's workflow in `.github/workflows/` and the
suite's test config to see how. For example, the JS Tests job reruns failed tests, and the VRT and
Playwright suites retry failed tests. A test that failed every retry is very unlikely to be flaky,
so don't spend time re-running it locally to prove otherwise. A VRT screenshot that failed and
then passed on retry is not a failure: CI lists it as flaky in the PR comment and in the
**VRT: flaky screenshots** check. Flakiness matters most for a suite with no retries, such as the
`E2E (WordPress …)` jobs.

Two further checks worth running before concluding anything:

- **Search the issue tracker.** `gh issue list --repo google/site-kit-wp --state all --search "<area>"`. A test that looks broken is sometimes obsolete by design — a shipped decision removed the scenario it covers. Equally, a "new" bug may already be filed.
- **Compare against other PRs.** If another open PR's run fails the same scenario, it is shared
  flakiness, not yours. This is especially useful for VRT.

## Step 4 — Apply the distinction that matters most

**"The behaviour is pre-existing" and "the failure is unrelated to this PR" are different
claims.** Once Step 3 has ruled out flakiness, a test that passes on `develop` and fails here is
this PR's to resolve, even when the behaviour it trips over is older than the PR.

For a suite that CI does not retry, one green run on `develop` does not rule out flakiness. A
flaky test can pass there by chance and fail here by chance. Before you call such a failure the
PR's, make sure the result repeats: the test fails on every run here and passes on every run at
the merge base. Then check whether the same job has recently failed on `develop`:

```
gh run list --workflow <workflow-file> --branch develop --status failure --limit 10
gh run view <run-id> --log-failed
```

If any of those runs failed the same test, the test is flaky. Report it as flaky, with links to
those runs.

The common case: a suite runs against a different code path than production. For example, E2E
sets feature flags through `tests/e2e/mu-plugins/e2e-rest-feature-flag.php`, which filters
`googlesitekit_is_feature_enabled` at a late priority. It overrides any other code that enables a
flag through the same filter, so E2E can exercise a path no user has taken for several releases.
Removing a flag switches E2E onto the real path for the first time, and the resulting failures
are in scope even though nothing about the underlying behaviour changed.

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

Reproduce locally first. A CI round trip takes as long as the slowest workflow the change
triggers, which you can estimate as in Step 0.

- **E2E needs `npm run build:test`**, not `npm run build` — a production build omits the E2E
  bundle and every spec then dies in `setupSiteKit()` waiting for `window._e2eApiFetch`.
- **VRT runs in Docker** against a Storybook build made with `VRT=1`. Follow
  `tests/vrt/README.md` to run it: it covers when the build is made or reused, how to run only
  some stories, and the viewports.
- After merging `develop`, re-run `npm install` — a merge can bring new dependencies.
- Re-run the full suite after any fix. Semantic merge conflicts are common: `develop` can add a
  test asserting copy this PR renamed, and git merges both cleanly with no conflict markers.

## Step 7 — Report

Produce a table, one row per failing check, and nothing that the evidence does not support:

| Check | Failure | Class | Evidence | Action |
| --- | --- | --- | --- | --- |
| E2E (WordPress latest) | `write-scope-requests` ×2 | Obsolete | #11372 made the scope part of the initial request; confirmed in `get_refined_scopes()` and on a real site | Remove, citing #11372 |
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
