---
name: create-design-doc
description: >
  Produce a Site Kit epic design doc from a PRD — analyze the codebase, interrogate the
  requirements, and write the design doc in the project's house style. Use when the user asks to
  create, write, or draft a design doc / technical design / epic design (e.g. "write a design doc
  for this PRD", "create a design doc for the X feature", "/create-design-doc") in the
  google/site-kit-wp repo.
argument-hint: "[path-to-PRD or feature name]"
allowed-tools: Bash, Read, Grep, Glob, Write, AskUserQuestion
---

# Create a design doc

Write an epic design doc for **$ARGUMENTS** (a PRD path, a pasted PRD, or a feature name) by
following the project's shared playbook. Do not reimplement the procedure here — read and follow
the playbook, which is the single source of truth shared with the other AI tools.

## Procedure

1. **Enter plan mode first.** This workflow is research-and-design only: no production code, no
   tests, no issues, no branches. The single artifact is the design doc, written at the very end
   once the user has approved both its content and its path.
2. **Read the playbook** `docs/context/workflow/create-design-doc.md` and follow every step: PRD
   intake, doc header, codebase analysis, the question loop, approach selection, work estimates,
   drafting, self-review, and saving.
3. **Get the PRD.** Accept a local file path or PRD text pasted into the conversation. If none was
   provided, **stop and ask** — the design doc cannot be written without the requirements. If the
   user gives only a Google Docs / Confluence URL, ask them to export or paste it (those are
   access-controlled), but keep the URL for the doc's `PRD:` metadata line.
4. **Analyze the codebase** for the infrastructure the epic will reuse, loading only the
   `docs/context/{js,php}` convention docs the epic touches (use the scope map in
   `implement-issue.md` Step 3). Read the closest shipped feature end to end, then decompose the new
   feature into the capabilities it needs and, for each, record by name the real symbol you intend
   to reuse and whether it needs extending. Verify every symbol in the codebase before citing it —
   never cite one from memory.
5. **Ask as many questions as it takes**, in themed batches, using the playbook's question bank as
   the minimum coverage (scope & phasing, UX & states, data & reporting, persistence, gating &
   visibility, access & dashboard sharing, measurement, launch, testing & QA, documentation &
   support). Keep going until nothing material is unresolved.
6. **Draft** against the playbook's § Document structure and § Style rules, which define the house
   style in full — follow them literally rather than improvising a format. Four rules govern the
   prose: describe the code and never your reading of it (no "checked", "verified", "found", "as we
   can see" — the audience knows this codebase completely); speak in the doc's own voice and never a
   document's (no "the PRD says", "as documented in …" — state the substance directly, with any link
   riding along only as a source); embed no images or image placeholders (a human adds mocks later —
   describe the surface in prose and link the Figma node); and draw any diagram as a fenced
   `mermaid` block, never ASCII art.
7. **Self-review** against playbook Step 8, then **ask the user for the output path** (default
   `docs/<feature-slug>-design-doc.md`) and write the file.

## Important

- **Plan mode only**: never write or modify production code, tests, stories, feature flags, or
  GitHub issues as part of this workflow.
- **Never invent requirements, answers, or code.** Unknowns go to the user; whatever is left
  unanswered becomes an `❓` entry under **Open questions**. Every selector/class/path cited as
  existing must have been verified in the codebase.
- **Keep every section** in the structure. A section that doesn't apply states so and why — it is
  never deleted.
- **Confirm the path before writing**, and never commit, push, or open a PR unless explicitly
  asked.
