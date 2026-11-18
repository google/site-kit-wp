# Design-doc tooling reference

Commands for checking a design doc and exporting it to Google Docs. Read this when finishing a
pass over a doc, or when preparing it for review.

## Self-check {#self-check}

Before finishing, run these against the doc (`DOC=path/to/design-doc.md`, from its directory
for the file checks) and fix anything they report:

- **Every anchor link resolves**:

  ```sh
  comm -23 <(grep -o '](#[^)]*)' "$DOC" | sed 's/](#\(.*\))/\1/' | sort -u) \
           <(grep -o '{#[^}]*}' "$DOC" | sed 's/{#\(.*\)}/\1/' | sort -u)
  ```

- **No orphan screenshots**:
  `for f in screenshots/*; do grep -q "$f" "$DOC" || echo "$f"; done`
- **Every diagram renders**: `node design-doc/scripts/markdown-mermaid-to-png.js "$DOC"`
  completes without errors (delete the `-rendered.md` output if it isn't wanted).
- **No leftovers**: `grep -nE '\[COMMENT:|^\*[A-Z][^*]*\*\s*$' "$DOC"` finds no review markers
  or template prompt text.
- **Style**: reread against the [style guide](SKILL.md#style-guide) — concise, diagrams
  sparing, nothing obvious over-explained, no editing artefacts, US English.

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
