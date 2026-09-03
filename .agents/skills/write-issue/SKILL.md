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

Write the **description** and the **Acceptance criteria** for **$ARGUMENTS** — a design doc path,
a bug report, requirements stated in the user's message, or an existing issue that needs criteria.
Do not reimplement the procedure here — read and follow the playbook, which is the single source
of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/write-issue.md` and follow every step.
2. **Establish the issue type**, because it decides the template and the sections you write:
   - **Feature request** — `.github/ISSUE_TEMPLATE/feature_request.md`: the **Feature
     Description** and the **Acceptance criteria**.
   - **Bug report** — `.github/ISSUE_TEMPLATE/bug_report.md`: the **Bug Description**, the
     **Steps to reproduce** and the **Acceptance criteria**.

   **Ask the user which type they want whenever their message does not make it clear**, and wait
   for the answer before writing anything. Say how you read the request when you ask. An existing
   issue keeps the type it already has — never convert one into the other. A request to change
   behavior that works as designed is a feature request, even when the user calls it a fix.
3. **Establish the source and the mode.** New issue → write the description sections and the
   criteria. Existing issue whose description is already written → write **only** the criteria and
   leave the description byte-for-byte alone. Ask the user if no source was given, the
   requirements are ambiguous, or a design doc covers an epic without saying which issue to write.
   Never invent a design-doc path or go hunting for a local issue file.
4. **Read the source material end to end** — the whole design doc (the rationale for one issue's
   decisions often sits in another's section), any spec it names as authoritative, the sibling
   issues already written for the epic, and, for a bug, the whole report plus whatever evidence it
   names: a support thread, a linked issue, the pull request the user says introduced it.
5. **Verify against the code** before naming anything: every class, method, hook, constant,
   handle and path, the shape of the base class or registry being extended, and who consumes the
   data the issue changes. For a bug, confirm the wrong behavior is really what the code does
   today and find the lines that produce it. Where the design doc and the code disagree, the code
   wins.
6. **Lay the issue out** by copying the template file for the type — drop its YAML frontmatter,
   put the title in its place as a single `# ` heading, and keep everything else as the file has
   it, including the moderator notice and the placeholder comment in every section you are not
   writing. The two templates word their placeholders differently, so copy them from the file for
   the type you are writing rather than from the other one. On a bug report, Screenshots and
   Additional Context stay as the template gives them, filled in only with environment facts the
   user actually stated. The title names the deliverable, or for a bug the symptom and where it
   happens; nothing sits between it and the first description heading. A dependency on another
   issue is a clause inside the description, by real GitHub issue number.
7. **Write the description** — prose, and the only place rationale belongs. A **Feature
   Description** gives the gap today, what this adds, the halves of the work, and the load-bearing
   decisions with their reasons. A **Bug Description** gives the wrong behavior on the real
   surface with its values, what should happen instead, and the conditions it needs — plus the
   cause in one clause only when you verified it in the code, never the fix. **Steps to reproduce**
   are a numbered list starting from a state the tester can reach, one action per step with real
   values, ending in what the tester sees and what they should have seen.
8. **Write the Acceptance criteria** — a flat `*` list, one checkable outcome per bullet, nested
   only for enumerable cases, tables inlined for lookups. Name real symbols and give real values.
   On a bug, write the corrected behavior as the outcome it produces, plus the cases that must
   keep working — never "no longer broken".
9. **Report separately** the type you wrote when you had to ask, the decisions you had to make,
   code/design-doc discrepancies, the cause you found with its `file:line`, anything in a report
   you could not confirm, anything added beyond scope, and any ordering constraint between issues.

## Important

- **Ask which type of issue it is** when the request does not make it clear. The wrong template
  means the wrong sections and a rewrite.
- **Outcomes only in the criteria.** No rationale, no technique notes, no cause or fix, no
  negative parentheticals ("(not an `id`)"), no restating the event name, no "no X is needed", no
  "Out of scope" or "Known limitations" lists. Keep negatives only when the negative is the
  asserted outcome.
- **The scope boundary lives in the criteria**, because that is what the PR is graded against — as
  the outcome at the edge ("the cart and checkout pages render nothing"), never as a list of what
  isn't built and never as a clause in the description.
- **No links or paths to local design docs or specs** in any section you write — they don't
  resolve on GitHub. Restate the constraint instead. External links are fine.
- **Never reference a sibling by its design-doc position** ("issue 5", "the next issue") — that
  numbering is not GitHub's. Use a real issue number, or the deliverable's name.
- **An existing description is untouchable** unless the user explicitly asks — a Feature
  Description, or a Bug Description with its Steps to reproduce.
- **Don't publish.** No `gh issue create`, no `gh issue edit`, no comments, unless explicitly
  asked. Produce the file and let the user place it.
