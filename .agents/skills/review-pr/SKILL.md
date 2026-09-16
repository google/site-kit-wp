---
name: review-pr
description: >
  Review a Site Kit GitHub pull request end-to-end against the project's conventions and
  quality rubric. Use when the user asks to review, critique, or give feedback on a pull
  request by number (e.g. "review PR #12345", "review pull request 12345", "/review-pr 12345")
  in the google/site-kit-wp repo.
argument-hint: "[pr-number]"
allowed-tools: Bash, Read, Grep, Glob
---

# Review a pull request

Review pull request **#$ARGUMENTS** (if no number was given, ask for one) by following the
project's shared playbook. Do not reimplement the procedure here — read and follow the
playbook, which is the single source of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/review-pr.md` and follow every step: fetch the
   PR data, read the linked issue, load only the relevant `docs/context/{js,php}` convention
   docs (per the scope map), inspect the changed files, judge against the checklist, and produce
   the structured review.
2. **Fetch the PR**: run `gh pr view $ARGUMENTS --json number,title,body,author,baseRefName,headRefName,files,additions,deletions,commits`
   and `gh pr diff $ARGUMENTS` in parallel. Stop and ask the user if the PR is missing or the
   diff is empty.
3. **Read the linked issue**: the PR body (per `.github/PULL_REQUEST_TEMPLATE.md`) links it
   under "Addresses issue: - #<number>". Extract that number, run
   `gh issue view <number> --json title,body,labels`, and parse its Acceptance criteria,
   Implementation Brief, and Test Coverage — this is the spec the PR must satisfy. If no issue
   is linked, note it and review conventions + code quality only.
4. **Grade** the change against `docs/context/workflow/review-checklist.md` — requirements
   adherence (against the issue) first, then conventions, code quality, and verification —
   citing the context file + section for every deviation.
5. **Output** the review in the exact structure defined by the playbook (Summary → Requirements
   Adherence → Principles Compliance → Code Quality → Security → Performance → Test Coverage →
   Nits → Verdict).

## Important

- **Read-only**: produce the review only. Never post comments, approve, or change the PR state
  on GitHub unless the user explicitly asks.
- Load only the convention docs the change touches — read what the PR touches, not everything.
