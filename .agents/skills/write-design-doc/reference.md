# Design-doc tooling reference

How to set up the workspace, fetch the template, examples and feature documents, and commands
for checking a design doc and exporting it to Google Docs. Read this when the workspace,
template, examples or a feature's documents are missing, when finishing a pass over a doc, or
when preparing it for review.

## Setting up the workspace {#setting-up-the-workspace}

The [workspace](SKILL.md#workspace) is a local-only git repository at `design-doc/workspace/`,
ignored by the Site Kit repo (`/design-doc/workspace/` in `.gitignore`). Create it from the
plugin root:

```sh
git init design-doc/workspace
printf '#!/bin/sh\necho "design-doc/workspace is local-only: pushing is disabled." >&2\nexit 1\n' \
  > design-doc/workspace/.git/hooks/pre-push
chmod +x design-doc/workspace/.git/hooks/pre-push
```

Then confirm the Site Kit repo ignores it: `git check-ignore design-doc/workspace` must print
the path. If it prints nothing, stop and tell the user rather than writing into it — the
workspace would otherwise show up as an embedded repository in Site Kit's `git status`.

## Fetching the template {#fetching-the-template}

The canonical template is the Google Doc
<https://docs.google.com/document/d/1ZW8HLsdqepJJBseMeLGTiHcF05ZLsqCiZVzNJxsA7jM/edit>. If the
local copy at `design-doc/sources/design-doc-template.md` doesn't exist, fetch it before reading
the context:

1. Export the doc as Markdown with the Google Drive connector (read or download file ID
   `1ZW8HLsdqepJJBseMeLGTiHcF05ZLsqCiZVzNJxsA7jM` as `text/markdown`). Without a connector, ask
   the user to download it via **File → Download → Markdown (.md)**.
2. Save it to `design-doc/sources/design-doc-template.md` unchanged.

If the file already exists, use it as is; don't re-fetch it unless the user asks.

## Fetching the examples {#fetching-the-examples}

Example design docs live in `design-doc/sources/examples/`. If the directory is missing or
contains no examples, fetch some before reading the context:

1. Ask the user for the Google Doc links of one or more existing design docs to use as
   examples. Don't guess or search Drive for them.
2. Export each doc as Markdown with the Google Drive connector (read or download its file ID —
   the part of the URL after `/d/` — as `text/markdown`). Without a connector, ask the user to
   download each via **File → Download → Markdown (.md)**.
3. Save each one unchanged to `design-doc/sources/examples/`, named after the doc in kebab-case
   (e.g. `key-metrics-design-doc.md`).

If examples already exist, use them as they are; don't re-fetch them or ask for more unless the
user asks.

## Fetching feature documents {#fetching-feature-documents}

A feature's PRD, review documents and other written resources are kept as local copies in
`design-doc/workspace/<feature>/sources/`, so every stage reads the same version without a
round trip to Drive. When the [feature introduction](workflow.md#feature-introduction) lists a
document with no local copy:

1. Export it as Markdown with the Google Drive connector (read or download its file ID as
   `text/markdown`). Without a connector, ask the user to download it via **File → Download →
   Markdown (.md)**.
2. Save it unchanged to the feature's `sources/` directory, named after the doc in kebab-case
   (e.g. `prd.md`, `ux-review.md`), and record the path next to its link in the introduction.

The Markdown export leaves out comments. When the introduction says context lives in a doc's
comments, read them from the original (or ask the user to paste them) and save them alongside
as `<doc>-comments.md`.

Figma files stay remote: screenshots taken from them go in each iteration's `screenshots/`
directory, as in the [screenshot conventions](SKILL.md#screenshots).

If a local copy exists, use it as is; re-fetch it only when the user says the original has
changed.

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
