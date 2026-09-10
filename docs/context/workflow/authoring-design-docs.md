# Authoring and Editing a Design Doc — Playbook

This is the **single source of truth** for the conventions used when authoring or editing a
design doc in Site Kit by Google. Every AI tool (Gemini CLI, Antigravity, Claude Code)
points at this file through a thin per-tool adapter, so the conventions stay identical
everywhere. When you change a convention, change it **here** — not in the adapters.

This playbook covers the cross-cutting conventions — assets, links, structure, and style —
that apply throughout a design doc regardless of which section you are writing. It does
**not** cover the requirements of any specific feature or design doc; those live with that
doc (its PRD, template, and preparation notes).

When starting a design doc, also read its template (`design-doc/design-doc-template.md`)
and study the examples (`design-doc/examples/`) for structure and depth.

---

## Screenshots

Screenshots (e.g. exported from Figma) should be:

- Saved to a `screenshots` subdirectory of the document's output directory.
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

- Use diagrams **sparingly** — only where a diagram communicates something prose cannot.
- Rendered PNGs live in a `diagrams` subdirectory, generated from the inline fences by
  `design-doc/scripts/markdown-mermaid-to-png.js` (see [Preparing the doc for Google
  Docs](#preparing-the-doc-for-google-docs)). They are named by document order
  (`01-diagram.png`, `02-diagram.png`, …). Regenerate them from the doc rather than editing
  the PNGs or hand-maintaining separate `.mermaid` source files, which drift out of sync.
- **Render and validate every diagram before relying on it** — `mmdc` is finicky, state
  diagrams especially.

Avoid these Mermaid pitfalls, which break the parse or render literally:

- No semicolons inside sequence-diagram message text — they terminate the statement. Use
  commas.
- No `<br/>` inside state-diagram edge/transition labels — keep those labels single-line.
- No HTML entities (e.g. `&rarr;`) in labels — `mmdc` prints them literally. Use plain words.

## Intra-document links

Design docs are typically pasted from Markdown into Google Docs. To ensure internal links
still resolve there, give every link target section an explicit anchor and link to it by
anchor.

The anchor format is `{#anchor-name}`, appended to the target heading. For example:

```markdown
This link resolves to the "Feature flags" section: [Feature flags](#feature-flags)

# Feature flags {#feature-flags}

This is the "Feature flags" section.
```

- **Say it once.** Specify each concept or mechanic in exactly one home section and
  cross-reference it elsewhere by anchor. Don't re-explain the same behaviour in several
  places — table cells especially should *identify* a thing and link to its owning section,
  not restate its behaviour.
- **Prefer anchor links over positional references.** "See the section above/below" breaks
  silently when sections are reordered; use a `{#anchor}` link and keep the scheme
  consistent throughout the doc.

## Preparing the doc for Google Docs {#preparing-the-doc-for-google-docs}

Design docs are reviewed in Google Docs, which can't render fenced ```mermaid blocks and
won't follow relative image paths. Bake a self-contained companion of the source doc:

1. **Render diagrams to PNG**: `node design-doc/scripts/markdown-mermaid-to-png.js <doc>.md`
   replaces each inline ```mermaid fence with a rendered PNG under `diagrams/`, writing
   `<doc>-rendered.md`.
2. **Embed images**: `node design-doc/scripts/markdown-convert-embedded-images.js embed
   <doc>-rendered.md` inlines every `![](…)` image as a base64 data URI, writing
   `<doc>-embedded.md` — a single file that survives a paste into Google Docs. (`extract`
   reverses this.)

The hand-written source `.md` is canonical; regenerate the rendered/embedded copies from it
rather than editing them. Pasting back from Google Docs leaves Markdown specials
backslash-escaped (`\+`, `\!`, `\#`, `\[`) — expect and preserve these when syncing edits
into the source.

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

## Tables

- Inventory components and surfaces as tables (e.g. `Name | Path | Role`, or
  `Surface | key | predicate`), not prose paragraphs.
- Keep an identity/"Role" cell to one line that *names* the thing and links to its owning
  section — don't re-specify behaviour there.
- Escape literal pipes as `\|` inside cells (e.g. type unions like `'a' \| 'b'`).

## Work estimates

- Columns: Issue # / Title / Story points / Description / Dependencies. Lead each Description
  with `JS.`/`PHP.` and cross-reference sections by anchor.
- When splitting or merging issues, **preserve the total story points**, renumber
  sequentially with no gaps, and update every Dependencies entry and inline `#N` reference so
  each resolves to a valid, earlier issue.
- Keep the `TOTAL: XXX STORY POINTS` line as a placeholder.

## Revision history

Maintain a revision-history table (`Date | Author(s) | Description`), newest entry on top,
the author as a `mailto:` link, and dates as `DD Mon YYYY`. Add a row whenever the doc
changes significantly.

## Style guide

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
