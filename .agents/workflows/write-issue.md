---
title: Write an issue
description: Write the description and Acceptance criteria of a Site Kit issue — a feature request or a bug report — from a design doc, a bug report or requirements, verified against the codebase.
---

# Write an issue

Run with `/write-issue <design-doc-path | issue-number | bug report | requirements>` in the Agent
chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/write-issue.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Establish the issue type**, which decides the template and the sections you write. A
   **feature request** (`.github/ISSUE_TEMPLATE/feature_request.md`) gets the **Feature
   Description** and the **Acceptance criteria**; a **bug report**
   (`.github/ISSUE_TEMPLATE/bug_report.md`) gets the **Bug Description**, the **Steps to
   reproduce** and the **Acceptance criteria**. **Ask the user which type they want whenever their
   message does not make it clear**, and wait for the answer before writing anything — say how you
   read the request when you ask. An existing issue keeps the type it already has; never convert
   one into the other. A request to change behavior that works as designed is a feature request,
   even when the user calls it a fix.
2. **Establish the source and the mode** — a design doc, a bug report or requirements in the
   user's message, or an existing issue (`gh issue view <number> --json title,body`, or a path the
   user supplies). A **new** issue gets the description sections and the criteria; an **existing**
   issue whose description is already written gets **only** the Acceptance criteria, with the
   description left byte-for-byte alone. Ask when nothing was given, the requirements are
   ambiguous, or a design doc covers an epic without saying which issue to write. A design doc's
   work-estimate table *is* the breakdown — one issue per row; do not re-slice it.
3. **Read the source material end to end** — the whole design doc, not just this issue's section;
   any spec the design doc names as authoritative; the sibling issues already written for the
   epic, which show where this issue's scope stops; and, for a bug, the whole report as the user
   gave it plus whatever evidence it names — a support thread, a linked issue, the pull request
   the user says introduced the problem.
4. **Verify against the code** — every class, method, hook, constant, handle and path; the shape
   of the base class or registry being extended; and who consumes the data the issue changes,
   which is what makes a "must stay unchanged" criterion real. For a bug, confirm that the wrong
   behavior is really what the code does today, find the lines that produce it, and check which
   cases served by the same code still work. Where the design doc and the code disagree, the code
   wins.
5. **Lay the issue out** by copying the template file for the type. Drop its YAML frontmatter and
   put the title in its place as a single `# ` heading; everything else stays as the file has it —
   moderator notice intact, the template's own placeholder comments left in the sections you are
   not writing (the two templates word them differently, so copy from the right file), and on a
   bug report Screenshots and
   Additional Context left as the template gives them, filled in only with environment facts the
   user actually stated. The title names the deliverable, or for a bug the symptom and where it
   happens, and nothing sits between it and the first description heading — no epic name, no point
   estimate, no dependency line. Where the issue depends on another, that dependency is a clause
   inside the description, by real GitHub issue number.
6. **Write the description** — prose only, and the only place rationale belongs. A **Feature
   Description**: the gap today and where it falls short, what this issue adds, the halves of the
   work as bold run-in headings, and the load-bearing decisions with their reasons. A **Bug
   Description**: the wrong behavior on the real surface with its values, what should happen
   instead, and the conditions it needs — plus the cause in one clause, only when you verified it
   in the code, and never the fix. **Steps to reproduce**: a numbered list that starts from a
   state the tester can reach, one action per step with the real values to click or paste, ending
   in what the tester sees and what they should have seen.
7. **Write the Acceptance criteria** — a flat `*` list, one checkable outcome per bullet, nested
   one level for enumerable cases, tables inlined for lookups. Name real symbols, give real
   values, state cardinality, and say what must stay unchanged. On a bug, write the corrected
   behavior as the outcome it produces ("the tile shows the audience's 412 users"), never "no
   longer broken", and add the cases that must keep working. The criteria are also where the
   **scope boundary** lives, since they are what the PR is graded against — as the outcome at the
   edge ("the cart and checkout pages render nothing"), never as an "Out of scope" list and never
   as a clause in the description. Cut rationale, technique notes, the cause and the fix, negative
   parentheticals, restated event names, and work that isn't being done.
8. **Report separately** the type you wrote when you had to ask, the decisions you had to make,
   discrepancies against the code with `file:line`, the cause you found for a bug, anything in the
   report you could not confirm, anything added beyond the design doc's scope, and any ordering
   constraint between the issues.

**No local design-doc paths or links, and no sibling references by design-doc position** ("issue
5", "the next issue") — that numbering is not GitHub's. Use a real issue number or the
deliverable's name.

**The authoring sections only** — leave Implementation Brief, Test Coverage, QA Brief and
Changelog entry as placeholder comments, and do not create or edit a GitHub issue unless
explicitly asked.
