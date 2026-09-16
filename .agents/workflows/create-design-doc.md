---
title: Create a design doc
description: Produce a Site Kit epic design doc from a PRD — analyze the codebase, interrogate the requirements, and write the doc in the project's house style, following the shared playbook.
---

# Create a design doc

Run with `/create-design-doc <path-to-PRD or feature name>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/create-design-doc.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Stay in plan mode** for the whole workflow — research, question, and design only. No
   production code, tests, stories, feature flags, or GitHub issues. The design doc is the sole
   artifact, written at the end.
2. **Intake the PRD** — a local file path or PRD text pasted into the chat. **Stop and ask** if
   none was provided; the doc cannot be written without the requirements. A Google Docs /
   Confluence URL alone is not enough (they're access-controlled) — ask for an export or paste, and
   keep the URL for the doc's `PRD:` metadata line.
3. **Establish the doc header** — title (`[SK] <Feature> Design`), authors, reviewers, Figma link,
   feature-flag name. Ask; don't guess.
4. **Analyze the codebase** — read the closest shipped feature end to end, then decompose the new
   feature into the capabilities it needs and, for each, record by name the existing symbol you
   intend to reuse and whether it needs extending. Verify every symbol in the codebase before citing
   it; never cite one from memory. Load only the `docs/context/{js,php}` convention docs the epic
   touches — use the scope map in `implement-issue.md` Step 3.
5. **Ask as many questions as it takes**, in themed batches, using the playbook's question bank as
   the minimum coverage: scope & phasing, UX & states, data & reporting, persistence, gating &
   visibility, access & dashboard sharing, measurement, launch, testing & QA, documentation &
   support.
6. **Choose the approach** and record every rejected option under **Alternatives considered**, with
   a link to the discussion that settled it.
7. **Break the work into estimated issues** (story-point scale 3/7/11/15/19) and total them in the
   **Work estimates** table.
8. **Draft** against the playbook's § Document structure and § Style rules, which define the house
   style in full — follow them literally rather than improvising a format. Four rules govern the
   prose: describe the code and never your reading of it (no "checked", "verified", "found", "as we
   can see" — the audience knows this codebase completely); speak in the doc's own voice and never a
   document's (no "the PRD says", "as documented in …" — state the substance directly, with any link
   riding along only as a source); embed no images or image placeholders (a human adds mocks later —
   describe the surface in prose and link the Figma node); and draw any diagram as a fenced
   `mermaid` block, never ASCII art.
9. **Self-review** (no placeholders, every claim anchored to real code, cross-references resolve,
   design-doc altitude), then **ask the user for the output path** — default
   `docs/<feature-slug>-design-doc.md` — and save.

**Never invent requirements, answers, or code.** Unresolved items become `❓` entries under **Open
questions**. **Local only** — do not commit, push, or open a PR unless explicitly asked.
