---
name: write-issue
description: >
  Write the description and Acceptance criteria of a Site Kit issue — a feature request or a bug
  report — from a design doc, from a bug report, or from requirements given in the message. Use
  when the user asks to create, draft or write a GitHub issue or ticket, to file a bug, to break
  an epic's design doc into issues, or to write/add acceptance criteria for an existing issue
  (e.g. "create an issue for the read_article event from this design doc", "write a bug report
  for the audience tile showing no data", "write the remaining issues from design-doc.md", "add
  acceptance criteria to #12345") in the google/site-kit-wp repo.
argument-hint: "[design-doc-path, issue-number, bug report, or requirements]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Write an issue

Write the **description** and **Acceptance criteria** for **$ARGUMENTS** — a design doc path, a
bug report, requirements in the user's message, or an existing issue that needs criteria. Do not
reimplement the procedure here — read and follow `docs/context/workflow/write-issue.md`, the
single source of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** and follow every step.
2. **Establish the type** (feature request or bug report) — asking the user whenever their
   message doesn't make it clear — and the **source and mode**: a new issue gets the description
   sections and the criteria; an existing issue with a description already written gets only the
   criteria, with the description left byte-for-byte alone.
3. **Read the source material end to end**, then **verify every symbol against the code** before
   writing anything. Code wins where it disagrees with the design doc.
4. **Lay out the issue** by copying the right template, then write its description sections and
   the Acceptance criteria as a flat list of checkable outcomes.
5. **Report separately** — in your reply, not the issue — the type you chose if you had to ask,
   decisions made, discrepancies found, and any cross-references you couldn't resolve.

## Important

- **Ask which type of issue it is** when unclear, and wait for the answer.
- **Criteria are outcomes only** — no rationale, mechanism, cause/fix, negative parentheticals, or
  "Out of scope" lists. The scope boundary is itself a criterion, written as the outcome at the
  edge.
- **No local design-doc links or indirect issue references** — always a real GitHub number.
- **An existing description is untouchable** unless the user explicitly asks otherwise.
- **Don't publish.** No `gh issue create`/`edit`, no comments, unless explicitly asked.
