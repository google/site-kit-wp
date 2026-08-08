---
name: write-issue
description: >
  Write the Feature Description and Acceptance criteria of a Site Kit issue from a design doc or
  from requirements given in the message. Use when the user asks to create, draft or write a
  GitHub issue or ticket from a design doc or requirements, to break an epic's design doc into
  issues, or to write/add acceptance criteria for an existing issue (e.g. "create an issue for
  the read_article event from this design doc", "write the remaining issues from design-doc.md",
  "add acceptance criteria to #12345") in the google/site-kit-wp repo.
argument-hint: "[design-doc-path, issue-number, or requirements]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Write an issue

Write the **Feature Description** and **Acceptance criteria** for **$ARGUMENTS** — a design doc
path, requirements stated in the user's message, or an existing issue that needs criteria. Do not
reimplement the procedure here — read and follow the playbook, which is the single source of
truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/write-issue.md` and follow every step.
2. **Establish the source and the mode.** New issue → write both sections. Existing issue that
   already has a Feature Description → write **only** the criteria and leave the description
   byte-for-byte alone. Ask the user if no source was given, the requirements are ambiguous, or
   a design doc covers an epic without saying which issue to write. Never invent a design-doc
   path or go hunting for a local issue file.
3. **Read the source material end to end** — the whole design doc (the rationale for one issue's
   decisions often sits in another's section), any spec it names as authoritative, and the
   sibling issues already written for the epic.
4. **Verify against the code** before naming anything: every class, method, hook, constant,
   handle and path, the shape of the base class or registry being extended, and who consumes the
   data the issue changes. Where the design doc and the code disagree, the code wins.
5. **Lay the issue out** per `.github/ISSUE_TEMPLATE/feature_request.md`, keeping the moderator
   notice and the placeholder comments for the sections you are not writing. The title names the
   deliverable; nothing sits between it and `## Feature Description`. A dependency on another
   issue is a clause inside the description, by real GitHub issue number.
6. **Write the Feature Description** — prose. The gap today, what this adds, the halves of the
   work, and the load-bearing decisions with their reasons. This is the only place rationale
   belongs.
7. **Write the Acceptance criteria** — a flat `*` list, one checkable outcome per bullet, nested
   only for enumerable cases, tables inlined for lookups. Name real symbols and give real values.
8. **Report separately** the decisions you had to make, code/design-doc discrepancies, anything
   added beyond scope, and any ordering constraint between the issues.

## Important

- **Outcomes only in the criteria.** No rationale, no technique notes, no negative parentheticals
  ("(not an `id`)"), no restating the event name, no "no X is needed", no out-of-scope or
  known-limitation lists. Keep negatives only when the negative is the asserted outcome.
- **No links or paths to local design docs or specs** in either section — they don't resolve on
  GitHub. Restate the constraint instead. External links are fine.
- **Never reference a sibling by its design-doc position** ("issue 5", "the next issue") — that
  numbering is not GitHub's. Use a real issue number, or the deliverable's name.
- **An existing Feature Description is untouchable** unless the user explicitly asks.
- **Don't publish.** No `gh issue create`, no `gh issue edit`, no comments, unless explicitly
  asked. Produce the file and let the user place it.
