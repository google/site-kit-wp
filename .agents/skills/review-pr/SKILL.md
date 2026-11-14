---
name: review-pr
description: >
  Review a Site Kit GitHub pull request end-to-end against the project's conventions and
  quality rubric. Use when the user asks to review, critique, or give feedback on a pull
  request by number (e.g. "review PR #12345", "review pull request 12345", "/review-pr 12345")
  in the google/site-kit-wp repo.
argument-hint: "[pr-number]"
allowed-tools: Read Grep Glob Bash(gh pr view *) Bash(gh pr diff *) Bash(gh pr checks *) Bash(gh issue view *) Bash(git fetch *) Bash(git show *) Bash(git grep *)
---

# Review a pull request

Review pull request **#$ARGUMENTS**. If no number was given, ask for one.

This skill tells you _what to do and in what order_. The conventions you judge against live in
`docs/context/js/` and `docs/context/php/`, and the rubric for grading them lives in
`review-checklist.md`, next to this file (`.agents/skills/review-pr/review-checklist.md`). Read
those, and don't duplicate them here.

---

## Step 1 — Fetch the PR data

Run these in parallel (substitute `<number>`):

- `gh pr view <number> --repo google/site-kit-wp --json number,title,body,author,baseRefName,headRefName,headRefOid,files,additions,deletions,commits`
- `gh pr diff <number> --repo google/site-kit-wp`

**Stop and ask the user** if the PR can't be found or the diff is empty.

## Step 2 — Identify and read the linked issue

Site Kit PRs use `.github/PULL_REQUEST_TEMPLATE.md`, whose **Summary** section links the issue
the PR implements:

```
## Summary
Addresses issue:

- #<number>
```

Extract that issue number from the PR body: the first `#<number>` under "Addresses issue:". There may be more than one. Then fetch the issue with `gh issue view <number> --repo google/site-kit-wp --json title,body,labels`. Parse it following the section map in `.agents/skills/implement-issue/SKILL.md` Step 1: **Feature Description**, **Acceptance criteria**, **Implementation Brief**, **Test Coverage**, **QA Brief**. This is the spec the PR must satisfy. The review is fundamentally a check of the diff **against the issue**, not just against conventions.

If the PR body has **no** linked issue (the `- #` line is empty), say so in the review, treat
requirements adherence as "not verifiable", and review conventions and code quality only. Do
not invent acceptance criteria.

## Step 3 — Load the relevant convention docs

Read **only** the convention docs that the changed files touch. Use the scope map in
`.agents/skills/implement-issue/SKILL.md` Step 3 to find them in `docs/context/js/` and
`docs/context/php/`.

The convention checklist in `review-checklist.md` (§2) maps each area to its authoritative doc.

## Step 4 — Inspect the changed files

For any non-trivial changed file (not auto-generated, not lock files), read the full file for context around the changed lines, as the PR has it. Your checkout holds your own branch, so fetch the PR with `git fetch origin pull/<number>/head`, and read each file with `git show <headRefOid>:<path>`. Focus on files where the diff alone is insufficient to judge whether the code is correct.

Read the code that calls each changed function too, and search for what still uses each thing the diff removes or renames, with `git grep -n -w -e '<name>' <headRefOid>`.

## Step 5 — Judge against the checklist

Grade the change against `review-checklist.md`:

- **Requirements adherence** (§1): the primary check. Walk each **Acceptance criterion** and each **Implementation Brief** checkbox from the linked issue (Step 2), and confirm the diff implements it. Call out anything missing or not fully done. Confirm every **Test Coverage** item exists as a real test, find the test behind each criterion, and call out a test that expects the opposite of one. Call out each change that no criterion or checkbox covers, as work the issue did not ask for. Skip only if no issue is linked.
  - **A checkbox built another way, or left out.** The acceptance criteria are the contract, and the brief is one route to them (`.agents/skills/implement-issue/SKILL.md` Step 1). Such a difference is a finding where it breaks a criterion, removes something the code relies on, or adds a risk. Any other difference is no finding where the PR's "Relevant technical choices" gives its reason. Where none gives one, ask the author for it.
- **Convention adherence** (§2) — check only the areas the change actually touches; cite the
  context file + section for every deviation.
- **Code quality** (§3) — correctness, security, performance, documentation, accessibility.
- **Verification** (§4): lint, tests run, build for non-trivial asset changes. Read the results from the PR's own checks, with `gh pr checks <number> --repo google/site-kit-wp`, because CI ran them on the code under review. Where CI did not run a check on the PR's last commit, say so in the review.

## Step 6 — Produce the review

Structure the output as below. Omit any section with nothing to report.

Report a finding only on one of three grounds. The code gives a wrong result, or the change misses a stated need such as an acceptance criterion, or it breaks a written team rule. Leave out a matter of taste. Report a fault the change did not bring in as pre-existing, apart from the blocking issues. Give a fault that repeats as one finding that names every place it shows.

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
Bugs, logic errors, edge cases, or any other wrong result the code gives, not covered above. Give each the input or the state that leads to the wrong result, and the `file:line` in the source that shows it. Leave out a finding that rests on a name alone, or on an input no caller sends.

#### Security Concerns
XSS, capability checks, nonce verification, direct SQL, or data-sanitization issues.

#### Performance
Unnecessary re-renders, missing memoization, expensive selectors, N+1 queries, large assets.

#### Test Coverage
Changed logic lacking test coverage, or existing tests not updated for new behavior.

#### Minor / Nits
Optional: style, naming, or documentation improvements that don't affect whether the code is correct. Give at most five, and the rest as a count.

---

#### Verdict

**APPROVE** / **REQUEST CHANGES** / **NEEDS DISCUSSION**

Brief justification. If requesting changes, list the blocking issues as a numbered checklist.

---

## Guardrails

- **Read-only by default.** Produce the review; do **not** post comments, approve, or change
  the PR state on GitHub unless the user explicitly asks.
- **Cite, don't assert.** For every convention violation, name the principle, the context file + section that defines it, and the affected `file:line`. For every finding about what the code does, give the input that leads to the wrong result and the `file:line` that shows it.
- **Scope the read.** Load only the convention docs the change touches — not everything.
