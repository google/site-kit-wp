---
name: write-design-doc
description: >
  Author or edit a Site Kit design doc under `design-doc/`: the optional staged workflow
  (preparation notes, drafting, work estimates, refinement) and where its outputs live, and
  the house conventions for screenshots, Mermaid diagrams, anchors, structure, tables, work
  estimates, Google Docs export and style. Use when the user asks to prepare for, write,
  draft, refine, or edit a design doc or one of its sections.
argument-hint: "[design doc path or section]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Author or edit a design doc

The conventions below apply throughout a design doc, whichever section you are writing. What
a specific feature requires lives in that feature's introduction and the sources it names, not
in this skill. Two companion files next to this one (in `.agents/skills/write-design-doc/`)
hold material needed only for some tasks:

- [workflow.md](workflow.md) — the feature layout and introduction, the optional preparation
  and authoring stages, and managing the workspace history. Read it when starting or advancing
  a stage, or when the feature has no introduction yet.
- [reference.md](reference.md) — fetching the template and examples, self-check commands, and
  Google Docs export. Read it when the template or examples are missing, when finishing a pass,
  or when preparing the doc for review.

## Workspace {#workspace}

Design-doc work is kept out of the Site Kit repository. Everything written for a feature goes in
`design-doc/workspace/<feature>/`, where `<feature>` is a kebab-case slug of the feature name
(e.g. `date-picker`). `design-doc/workspace/` is ignored by the Site Kit repo and is its own
local-only git repository, with no remote and a `pre-push` hook that refuses every push.

- If `design-doc/workspace/` doesn't exist, or isn't a git repository, [set it
  up](reference.md#setting-up-the-workspace) before writing anything.
- Never write design-doc output anywhere else in the Site Kit repo, and never add a remote to
  the workspace repository.
- Commit in the workspace repository only when the user asks, but help them keep its history
  (see [Managing the workspace history](workflow.md#managing-the-workspace-history)). Never
  commit design-doc files to the Site Kit repository.

Only `design-doc/scripts/` (shared tooling) is tracked by Site Kit; `design-doc/sources/`
(fetched template and examples) is ignored and shared by every feature. A feature's own
documents (PRD, review docs) are [copied](reference.md#fetching-feature-documents) into
`design-doc/workspace/<feature>/sources/`, so they are versioned with its work.

## Procedure

1. **Read the context** before writing:
   - the feature introduction (`design-doc/workspace/<feature>/introduction.md`), and every
     resource it and the request point to;
   - the template (`design-doc/sources/design-doc-template.md`;
     [fetch it](reference.md#fetching-the-template) first if it doesn't exist) and, for
     structure and depth, the example design docs in `design-doc/sources/examples/`
     ([fetch them](reference.md#fetching-the-examples) first if there are none);
   - the target document, if one already exists and you are editing it (not when [redoing a
     stage from scratch](workflow.md#authoring)).
2. **Author or edit** the requested stage or section(s), applying every convention below.
3. **Self-check** with the [checklist](reference.md#self-check) before finishing.

## Template

- **Keep the template's formatting**: its bold headings (`# **Context**`), header table and
  italic metadata block paste cleanly into Google Docs. Add `{#anchor}`s to headings as
  [needed](#intra-document-links).
- **Replace the italic prompt text** under each heading with content; don't leave it in.
- **Answer every Common considerations subsection** (Dashboard sharing, Tester plugin, Site
  Health, Feature Discovery, Internal Measurement). When the feature needs nothing there, say
  so in one sentence — reviewers check each one, so don't delete the subsection.
- **Keep the revision history current**: newest row on top, the author as a `mailto:` link,
  dates as `DD Mon YYYY`. Add a row whenever the doc changes significantly.
- **Leave "Changes during engineering" with its empty table.** The epic lead maintains it
  once engineering starts; it is not written at design time.

## Screenshots {#screenshots}

Screenshots (e.g. exported from Figma) should be:

- Saved to the `screenshots/` directory next to the document that uses them: the feature's
  `screenshots/` for the design doc, `preparation/screenshots/` for preparation notes. When the
  design doc uses a screenshot taken for a preparation note, copy it into the feature's
  `screenshots/` rather than linking across directories, so the doc stays self-contained.
- Named according to the feature or section they represent, with a numeric prefix, e.g.
  `01-overall-structure.png`, `02-entry-points.png`.
- Referenced in the document with standard Markdown image syntax pointing at that
  subdirectory:

  ```markdown
  ![Screenshot name](screenshots/screenshot-name.png)
  ```

Capturing them well:

- **Composite onto an opaque (white) background**, with a little padding. A transparent
  background makes dark text invisible when the doc is viewed in dark mode.
- **Keep text legible.** A tall frame scaled to page width becomes unreadable — capture it
  at full resolution, or split it into readable sections.
- **Take exact UI copy from Figma's text nodes (metadata), not by transcribing a scaled
  image** — but confirm it visually, since metadata also includes hidden/overlapping layers.
- **Render the specific inner node in isolation** to avoid the spotlight/overlay dimming a
  surrounding frame applies.
- **No orphans.** Every saved screenshot must be referenced in the doc; delete any that end
  up unreferenced so the folder matches the document.

## Diagrams

Author diagrams in [Mermaid](https://mermaid.js.org/). The inlined ```mermaid fence in the
document is the **authoritative source** for each diagram.

- Inline each diagram in a fenced ```` ```mermaid ```` block:

  ````markdown
  ```mermaid
  Mermaid code here
  ```
  ````

- Rendered PNGs live in the `diagrams/` directory next to the document, generated from the inline fences by
  `design-doc/scripts/markdown-mermaid-to-png.ts` (see [Preparing the doc for Google
  Docs](reference.md#preparing-the-doc-for-google-docs)). They are named by document order
  (`01-diagram.png`, `02-diagram.png`, …) and replaced on every render. Regenerate them from
  the doc rather than editing the PNGs or hand-maintaining separate `.mermaid` source files,
  which drift out of sync.
- **Validate every diagram before relying on it** with the script's `--check` mode (see the
  [self-check](reference.md#self-check)) — `mmdc` is finicky, state diagrams especially.

Avoid these Mermaid pitfalls, which break the parse or render literally:

- No semicolons inside sequence-diagram message text — they terminate the statement. Use
  commas.
- No `<br/>` inside state-diagram edge/transition labels — keep those labels single-line.
- No HTML entities (e.g. `&rarr;`) in labels — `mmdc` prints them literally. Use plain words.

## Intra-document links {#intra-document-links}

Design docs are typically pasted from Markdown into Google Docs. To ensure internal links
still resolve there, give every link target section an explicit anchor and link to it by
anchor.

Append the anchor to the target heading as `{#anchor-name}` and link to it as
`[text](#anchor-name)`.

- **Say it once.** Specify each concept or mechanic in exactly one home section and
  cross-reference it elsewhere by anchor. Don't re-explain the same behaviour in several
  places — table cells especially should *identify* a thing and link to its owning section,
  not restate its behaviour.
- **Prefer anchor links over positional references.** "See the section above/below" breaks
  silently when sections are reordered; use a `{#anchor}` link and keep the scheme
  consistent throughout the doc.

## Document structure

- **Structure around the reader's mental model, not discovery order.** Give each major UI
  surface (tab/view) its own section; don't leave orphan sub-sections stranded between
  unrelated parents.
- **Keep the Overview high-altitude and skimmable** — a new engineer should grasp the shape
  in a minute. Push implementation-grade detail down to its owning section (which also
  avoids a second copy to keep in sync).
- **Define the model before the API.** Describe the conceptual/data/state model first, then
  the selectors/actions that implement it, so nothing forward-references undefined semantics.
- **Include a traceability table** enumerating every item the doc must cover (e.g. each
  catalogue entry → type → handling). It's the artifact reviewers check row by row, and it
  forces you to place every case, not just the tidy ones.
- **For a dense concept**, separate intent from mechanism: state the rules as a short named
  list, each with a one-line "why"; add a concrete worked example; and define any notation
  explicitly rather than glossing it inline.

## Tables {#tables}

- Inventory components and surfaces as tables (e.g. `Name | Path | Role`, or
  `Surface | key | predicate`), not prose paragraphs.
- Keep an identity/"Role" cell to one line that *names* the thing and links to its owning
  section — don't re-specify behaviour there.
- Escape literal pipes as `\|` inside cells (e.g. type unions like `'a' \| 'b'`).

## Work estimates {#work-estimates}

- Columns: Issue # / Title / Story points / Description / Dependencies. Lead each Description
  with `JS.`/`PHP.` and cross-reference sections by anchor.
- When splitting or merging issues, **preserve the total story points**, renumber
  sequentially with no gaps, and update every Dependencies entry and inline `#N` reference so
  each resolves to a valid, earlier issue.
- Keep the `TOTAL: XXX STORY POINTS` line as a placeholder.

## Style guide {#style-guide}

- **Be concise, but use human-friendly language.** Favour clear prose over terse notes.
- **Use diagrams sparingly.** Reach for one only when it carries information that prose
  would carry less well.
- **Don't explain the obvious.** The audience is technical, experienced Site Kit developers
  who already know the codebase and its existing features and concepts. Write for them.
- **Keep the doc self-contained.** Don't send readers to internal preparation or working
  files; linking canonical external sources (PRD, Figma, features list) is fine.
- **Verify before you cite.** Check every code reference (selector, action, component, path,
  API name) against the actual codebase; ground approaches in real, confirmed APIs, never
  plausible-sounding invented ones.
- **Decide, or defer explicitly.** Resolve open points, or move them to an "Open questions"
  section — never leave half-decided "can…" statements that read as decided-ish.
- **Reserve bold** for terms being defined and for decisions. Bolding several phrases per
  paragraph drains emphasis of its signal.
- **Use US English** (color, behavior, catalog), to match the codebase style guide.
- **Avoid vague magic constants.** Give a concrete value, or explicitly defer it to UX polish.
- **Edit cleanly, leaving no trace of the edit.** When editing the document in response to a
  prompt, write the updated content as if the document had always been written that way.
  Don't leave editing artefacts in the document — no "Previously…", "This has been updated
  to…", "Note: this replaces…", or wording that justifies or explains the change. Any
  explanation of what changed belongs in your reply to the user, not in the document.
  Likewise, don't pad the edited section with background or context that isn't needed to
  understand it on its own. In particular:
  - Don't justify what the design omits ("we don't need X because…"), and don't narrate
    rejected or prior approaches inline — confine rejected-alternative rationale to a
    dedicated "Alternatives considered" section.
  - When a decision changes, propagate it through every affected section, table, and diagram
    (grep for stale references) so the doc never contradicts itself.
  - Reviewer feedback arrives as inline `[COMMENT: …]` markers: apply the change and delete
    the marker.
