---
name: write-implementation-brief
description: >
  Write the Implementation Brief and Test Coverage sections of a Site Kit issue from its
  acceptance criteria. Use when the user asks to write, draft, fill in, or groom an
  implementation brief and/or test coverage for an issue (e.g. "write the implementation brief
  for #12345", "fill in the brief and test coverage for this issue", "groom issue 12345") in the
  google/site-kit-wp repo.
argument-hint: "[issue-number-or-path]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Write an implementation brief

Write the **Implementation Brief** and **Test Coverage** for **$ARGUMENTS** — a GitHub issue
number, or a path to a local issue file. Ask for one if given neither; never go looking for the
file yourself. Do not reimplement the procedure here — read and follow
`docs/context/workflow/write-implementation-brief.md`, the single source of truth shared with the
other AI tools.

## Procedure

1. **Read the playbook** and follow every step.
2. **Read the issue** (`gh issue view $ARGUMENTS --json title,body,labels`, or the given path) and
   its design doc, if one exists. Ask if the acceptance criteria are missing, ambiguous, or
   contradictory — writing criteria is `write-issue.md`'s job, not this one's.
3. **Verify every symbol against the code**, and load only the relevant `docs/context/{js,php}`
   convention docs the issue touches.
4. **Write the two sections** — the brief grouped by path, naming real symbols and exemplars; Test
   Coverage as short, behavior-phrased bullets covering every criterion.
5. **Report separately** the discrepancies and assumptions that didn't belong in the brief.

## Important

- **Instructions only.** No rationale, no restated acceptance criteria, no routine commands, no
  links to local design docs.
- **New frontend files are TypeScript**; every invented name is spelled out in full.
- **No plain-text line numbers** — GitHub permalinks pinned to a commit SHA only.
- **Only the two sections.** Don't edit the GitHub issue or post a comment unless explicitly asked.
