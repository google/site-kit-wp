---
title: Write an implementation brief
description: Write the Implementation Brief and Test Coverage sections of a Site Kit issue from its acceptance criteria, verified against the codebase.
---

# Write an implementation brief

Run with `/write-implementation-brief <issue-number-or-path>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/write-implementation-brief.md`** (the single source of truth used by all
of this project's AI tools). Follow it exactly. Summary of the steps:

1. **Read the issue** — from GitHub when given a number
   (`gh issue view <number> --json title,body,labels`), or from the path the user supplies for a
   local issue file. Ask for one if you were given neither; never go looking for the file. The
   Acceptance criteria are the contract — stop and ask if they are missing, ambiguous, or
   contradictory.
2. **Read the source material** — the design doc, plus the sibling issues that bound this issue's
   scope and supply the numbers to cross-reference. Use the design doc the issue links or the
   user gives you a path to; otherwise ask for it, bundling the question with the Step 1 ask.
   Many issues have none — if there isn't one, say so and work from the acceptance criteria and
   the code rather than stalling.
3. **Verify against the code** — open every file the brief will touch and confirm each class,
   method, hook, handle and path. Where the design doc and the code disagree, the code wins.
4. **Load only** the relevant `docs/context/{js,php}` convention docs (use the map in
   `implement-issue.md` Step 3).
5. **Write the Implementation Brief** — grouped by path, one instruction per bullet. Name real
   symbols, selectors, components, class names and user-facing strings; point at an existing
   exemplar rather than describing one; cross-reference sibling issues inline; fence the scope
   in one line. No rationale, no unneeded work, no routine commands, no local design-doc links.
6. **Write the Test Coverage** — short. One bullet per test file or area, cases nested and
   phrased as behaviors, negative cases included, Storybook stories listed here (not in the
   brief), plus any existing tests the change will break.
7. **Report separately** the discrepancies, unanticipated consequences, and assumptions that did
   not belong in the brief.

**Two sections only** — leave Feature Description, Acceptance criteria, QA Brief and Changelog
entry untouched, and do not edit the GitHub issue or post a comment unless explicitly asked.
