---
title: Write an implementation brief
description: Write the Implementation Brief and Test Coverage sections of a Site Kit issue from its acceptance criteria, verified against the codebase.
---

# Write an implementation brief

Run with `/write-implementation-brief <issue-number-or-path>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/write-implementation-brief.md`** (the single source of truth used by all
of this project's AI tools). Follow it exactly. Summary of the steps:

1. **Read the issue** — from GitHub when given a number, or from the path the user supplies for a
   local file. Ask for one if given neither. Stop and ask if the acceptance criteria are missing,
   ambiguous, or contradictory.
2. **Read the design doc**, if one exists — the one the issue links or a path the user gives you;
   otherwise ask, bundled with the Step 1 ask. Many issues have none — work from the criteria and
   the code instead of stalling.
3. **Verify against the code** before naming anything, then **load only** the relevant
   `docs/context/{js,php}` convention docs the issue touches.
4. **Write the Implementation Brief** — grouped by path, one instruction per bullet, naming real
   symbols and exemplars, cross-referencing siblings inline, with no rationale or routine commands.
5. **Write the Test Coverage** — short, behavior-phrased cases including negatives, Storybook
   stories listed here rather than in the brief, plus any existing tests the change will break.
6. **Report separately** the discrepancies and assumptions that didn't belong in the brief.

**Two sections only** — leave Feature Description, Acceptance criteria, QA Brief and Changelog
entry untouched, and don't edit the GitHub issue or post a comment unless explicitly asked.
