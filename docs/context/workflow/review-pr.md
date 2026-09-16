# Reviewing a Pull Request — Playbook

This is the **single source of truth** for reviewing a pull request in Site Kit by Google.
Every AI coding tool points at this file through a thin per-tool adapter, so the procedure
stays identical everywhere. When you update the process, update it **here** — not in the
adapters.

This playbook tells you _what to do and in what order_. The conventions you judge against
live in `docs/context/js/` and `docs/context/php/`, and the rubric for grading them lives in
`review-checklist.md` (in this directory) — read those, don't duplicate them here.

---

## Step 1 — Fetch the PR data

Run these in parallel (substitute `<number>`):

- `gh pr view <number> --json number,title,body,author,baseRefName,headRefName,files,additions,deletions,commits`
- `gh pr diff <number>`

**Stop and ask the user** if the PR can't be found or the diff is empty.

## Step 2 — Identify and read the linked issue

Site Kit PRs use `.github/PULL_REQUEST_TEMPLATE.md`, whose **Summary** section links the issue
the PR implements:

```
## Summary
Addresses issue:

- #<number>
```

Extract that issue number from the PR body (the first `#<number>` under "Addresses issue:";
there may be more than one). Then fetch and parse the issue — `gh issue view <number> --json title,body,labels`
— following the section map in `implement-issue.md` Step 1: **Feature Description**,
**Acceptance criteria**, **Implementation Brief**, **Test Coverage**, **QA Brief**. This is
the spec the PR must satisfy; the review is fundamentally a check of the diff **against the
issue**, not just against conventions.

If the PR body has **no** linked issue (the `- #` line is empty), say so in the review, treat
requirements adherence as "not verifiable", and review conventions and code quality only. Do
not invent acceptance criteria.

## Step 3 — Load the relevant convention docs

Read **only** the convention docs that the changed files touch — use the same scope map as
`implement-issue.md` Step 3:

- **JavaScript** (`docs/context/js/`): `component-conventions.md`, `module-architecture.md`,
  `state-management.md`, `hooks.md`, `utils.md`, `widgets.md`, `notifications.md`,
  `feature-tours.md`, `feature-flags.md`, `event-tracking.md`, `jsdoc.md`, `storybook.md`,
  `tests.md`.
- **PHP** (`docs/context/php/`): `module-architecture.md`, `naming-conventions.md`,
  `dependency-injection.md`, `context-pattern.md`, `settings-management.md`,
  `storage-patterns.md`, `rest-api.md`, `trait-composition.md`, `asset-management.md`,
  `admin-features.md`, `prompts-and-dismissals.md`, `phpunit.md`.

The convention checklist in `review-checklist.md` (§2) maps each area to its authoritative doc.

## Step 4 — Inspect the changed files

For any non-trivial changed file (not auto-generated, not lock files), read the full file for
context around the changed lines. Focus on files where the diff alone is insufficient to judge
correctness.

## Step 5 — Judge against the checklist

Grade the change against `review-checklist.md`:

- **Requirements adherence** (§1) — the primary check. Walk each **Acceptance criterion** and
  each **Implementation Brief** checkbox from the linked issue (Step 2) and confirm the diff
  actually implements it; call out anything missing, incomplete, or contradicting the brief.
  Confirm every **Test Coverage** item exists as a real test. Skip only if no issue is linked.
- **Convention adherence** (§2) — check only the areas the change actually touches; cite the
  context file + section for every deviation.
- **Code quality** (§3) — correctness, security, performance, documentation, accessibility.
- **Verification** (§4) — lint, tests run, build for non-trivial asset changes.

## Step 6 — Produce the review

Structure the output as below. Omit any section with nothing to report.

---

### PR #<number> — [title]

**Author**: [author] | **Branch**: `[head]` → `[base]` | **Size**: +[additions] / -[deletions]

#### Summary
One paragraph describing what this PR does and what areas it touches. Name the linked issue
(`#<number>`), or note that none is linked.

---

#### Requirements Adherence

Only when an issue is linked (Step 2). For each **Acceptance criterion** and **Implementation
Brief** checkbox, state ✅ met / ⚠️ partial / ❌ missing, with the `file:line` that satisfies it
(or what's absent). Note any **Test Coverage** item without a corresponding test.

---

#### Principles Compliance

For each principle area that applies to files in this PR, report:

**[Area Name]** ✅ / ⚠️ / ❌
- Specific findings with `file:line` references. ✅ = follows conventions, ⚠️ = minor
  deviation, ❌ = violation. Cite the context doc + section (per `review-checklist.md` §2).

---

#### Code Quality Issues
Bugs, logic errors, edge cases, or correctness problems not covered above. Include `file:line`.

#### Security Concerns
XSS, capability checks, nonce verification, direct SQL, or data-sanitization issues.

#### Performance
Unnecessary re-renders, missing memoization, expensive selectors, N+1 queries, large assets.

#### Test Coverage
Changed logic lacking test coverage, or existing tests not updated for new behavior.

#### Minor / Nits
Optional: style, naming, or documentation improvements that don't affect correctness.

---

#### Verdict

**APPROVE** / **REQUEST CHANGES** / **NEEDS DISCUSSION**

Brief justification. If requesting changes, list the blocking issues as a numbered checklist.

---

## Guardrails

- **Read-only by default.** Produce the review; do **not** post comments, approve, or change
  the PR state on GitHub unless the user explicitly asks.
- **Cite, don't assert.** For every convention violation, name the principle, the context file
  + section that defines it, and the affected `file:line`.
- **Scope the read.** Load only the convention docs the change touches — not everything.
