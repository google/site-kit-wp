---
title: Write an issue
description: Write the Feature Description and Acceptance criteria of a Site Kit issue from a design doc or from requirements, verified against the codebase.
---

# Write an issue

Run with `/write-issue <design-doc-path | issue-number | requirements>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/write-issue.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Establish the source and the mode** — a design doc, requirements in the user's message, or
   an existing issue (`gh issue view <number> --json title,body`, or a path the user supplies).
   A **new** issue gets both sections; an **existing** issue that already has a Feature
   Description gets **only** the Acceptance criteria, with the description left byte-for-byte
   alone. Ask when nothing was given, the requirements are ambiguous, or a design doc covers an
   epic without saying which issue to write. A design doc's work-estimate table *is* the
   breakdown — one issue per row; do not re-slice it.
2. **Read the source material end to end** — the whole design doc, not just this issue's section;
   any spec the design doc names as authoritative; and the sibling issues already written for the
   epic, which show where this issue's scope stops.
3. **Verify against the code** — every class, method, hook, constant, handle and path; the shape
   of the base class or registry being extended; and who consumes the data the issue changes,
   which is what makes a "must stay unchanged" criterion real. Where the design doc and the code
   disagree, the code wins.
4. **Lay the issue out** per `.github/ISSUE_TEMPLATE/feature_request.md` — moderator notice
   intact, placeholder comments left in the sections you are not writing. The title names the
   deliverable, and nothing sits between it and `## Feature Description` — no epic name, no
   point estimate, no dependency line. A dependency on another issue is a clause inside the
   description, by real GitHub issue number.
5. **Write the Feature Description** — prose only. The gap today and where it falls short, what
   this issue adds, the halves of the work as bold run-in headings, and the load-bearing
   decisions with their reasons. This is the only section where rationale belongs.
6. **Write the Acceptance criteria** — a flat `*` list, one checkable outcome per bullet, nested
   one level for enumerable cases, tables inlined for lookups. Name real symbols, give real
   values, state cardinality, and say what must stay unchanged. Cut rationale, technique notes,
   negative parentheticals, restated event names, work that isn't being done, and out-of-scope
   or known-limitation lists.
7. **Report separately** the decisions you had to make, discrepancies against the code with
   `file:line`, anything added beyond the design doc's scope, and any ordering constraint between
   the issues.

**No local design-doc paths or links, and no sibling references by design-doc position** ("issue
5", "the next issue") — that numbering is not GitHub's. Use a real issue number or the
deliverable's name.

**Two sections only** — leave Implementation Brief, Test Coverage, QA Brief and Changelog entry
as placeholder comments, and do not create or edit a GitHub issue unless explicitly asked.
