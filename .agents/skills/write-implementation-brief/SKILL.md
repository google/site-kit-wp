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

Write the **Implementation Brief** and **Test Coverage** sections for **$ARGUMENTS** — either a
GitHub issue number, or a path the user supplied to a local issue file. If you were given
neither, ask for one before doing anything else; never go looking for the file yourself. Do not
reimplement the procedure here — read and follow the playbook, which is the single source of
truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/write-implementation-brief.md` and follow every
   step: read the issue, read the design doc and sibling issues, verify every symbol against the
   code, load only the relevant `docs/context/{js,php}` convention docs, write the two sections,
   and report what you left out.
2. **Read the issue**: `gh issue view $ARGUMENTS --json title,body,labels` for an issue number, or
   read the path the user supplied. Stop and ask the user if the acceptance criteria are missing,
   ambiguous, or contradictory.
3. **Read the design doc**: use the one the issue links or the path the user gives you; otherwise
   ask for it, bundling the question with any ask from step 2. Many issues have none — if there
   isn't one, say so and work from the acceptance criteria and the code rather than stalling.
4. **Verify against the code** before naming anything. Open every file the brief will touch and
   confirm each class, method, hook, handle and path exists as you describe it. Where the design
   doc and the code disagree, the code wins.
5. **Write the two sections** in place. The brief is grouped by path, one instruction per bullet,
   naming real symbols/components/strings and pointing at existing exemplars. Test Coverage is
   short: one bullet per test file or area, cases nested and phrased as behaviors, Storybook
   stories listed there rather than in the brief.
6. **Report separately** the discrepancies, unanticipated consequences, and assumptions that did
   not belong in the brief.

## Important

- **Instructions only.** No rationale, no trade-off discussion, no restated acceptance criteria,
  no background on how the existing system works.
- **Omit what isn't needed.** Never write "no Storybook changes required" or similar — silence
  says it.
- **No routine commands.** Lint, build, test and VRT invocations belong to
  `docs/context/workflow/implement-issue.md`, not the brief.
- **No links to local design docs** — the brief is read on GitHub where those paths don't
  resolve.
- **Only the two sections.** Leave Feature Description, Acceptance criteria, QA Brief and
  Changelog entry untouched, and do not edit the GitHub issue or post a comment unless the user
  explicitly asks.
