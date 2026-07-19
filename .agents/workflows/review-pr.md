---
title: Review a pull request
description: Review a Site Kit GitHub pull request end-to-end against the linked issue, the project's conventions, and the quality rubric.
---

# Review a pull request

Run with `/review-pr <pr-number>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/review-pr.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Fetch the PR** data and diff (`gh pr view <number> --json …` and `gh pr diff <number>`).
   Stop and ask if the PR is missing or the diff is empty.
2. **Read the linked issue** — the PR body (per `.github/PULL_REQUEST_TEMPLATE.md`) links it
   under "Addresses issue: - #<number>". Fetch and parse its Acceptance criteria,
   Implementation Brief, and Test Coverage; this is the spec the PR must satisfy. If no issue
   is linked, note it and review conventions + code quality only.
3. **Load only** the relevant `docs/context/{js,php}` convention docs (use the map in the
   playbook).
4. **Inspect** the non-trivial changed files for context the diff alone doesn't give.
5. **Judge** against `docs/context/workflow/review-checklist.md` — requirements adherence
   (against the issue) first, then conventions, code quality, and verification; cite the
   context file + section for every deviation.
6. **Produce** the structured review (Summary → Requirements Adherence → Principles Compliance
   → Code Quality → Security → Performance → Test Coverage → Nits → Verdict).

**Read-only** — produce the review only; do not post comments, approve, or change the PR state
unless explicitly asked.
