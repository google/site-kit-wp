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

1. **Establish the type** (feature request or bug report — ask the user if their message doesn't
   make it clear) and the **source and mode**: a new issue gets the description sections plus the
   criteria; an existing issue with a description already written gets only the criteria, and the
   description stays byte-for-byte untouched.
2. **Read the source material end to end** — the whole design doc, any spec it names as
   authoritative, sibling issues already written for the epic, and for a bug the full report plus
   whatever evidence it names.
3. **Verify against the code** before naming anything — every symbol, and for a bug that the wrong
   behavior is really what the code does today. Code wins over the design doc.
4. **Lay out the issue** by copying the right template, dropping its frontmatter, and putting the
   title in its place. Nothing sits between the title and the first heading.
5. **Write the description** — prose, the only place rationale belongs — then the **Acceptance
   criteria** as a flat list of checkable outcomes, naming real symbols and values, with the scope
   boundary written as the outcome at the edge rather than an "Out of scope" list.
6. **Report separately** the type you chose if you had to ask, decisions made, discrepancies
   found, and any cross-references you couldn't resolve.

**No local design-doc paths or indirect issue references** — every cross-reference is a real
GitHub number. Write only the authoring sections for the type, and don't create or edit a GitHub
issue unless explicitly asked.
