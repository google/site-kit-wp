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
printf '# Regenerated on every Google Docs export.\n*-rendered.md\n*-embedded.md\n' \
  > design-doc/workspace/.gitignore
```

If the workspace already exists without that `.gitignore`, add it.

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
3. [Extract its embedded images](#extracting-embedded-images), if it has any.

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
4. [Extract each one's embedded images](#extracting-embedded-images), if it has any.

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
3. [Extract its embedded images](#extracting-embedded-images), if it has any.

The Markdown export leaves out comments. When the introduction says context lives in a doc's
comments, read them from the original (or ask the user to paste them) and save them alongside
as `<doc>-comments.md`.

Figma files stay remote: screenshots taken from them go in the `screenshots/` directory next to
the document that uses them, as in the [screenshot conventions](SKILL.md#screenshots).

If a local copy exists, use it as is; re-fetch it only when the user says the original has
changed.

## Extracting embedded images {#extracting-embedded-images}

Google Docs' Markdown export embeds each image as a base64 data URI, in reference-style
definitions at the end of the file (`[image1]: <data:image/png;base64,…>`). Reading such a file
pulls megabytes of base64 into context, so after saving an export, check for them and extract
them (from the plugin root):

```sh
F=path/to/export.md
grep -q '^\[[^]]*\]: *<data:image/' "$F" \
  && node design-doc/scripts/markdown-convert-embedded-images.ts extract "$F"
```

This writes `<name>-extracted.md`, with the images saved as files in a `<name>/` directory
alongside, and leaves the original unchanged. From then on, read the `-extracted.md` copy
instead of the original, and view an extracted image only when it matters. If the grep finds nothing, the file has no
embedded images: read it directly.

## Self-check {#self-check}

Before finishing, run these from the plugin root against the doc
(`DOC=design-doc/workspace/<feature>/design-doc.md`, or a preparation note) and fix anything
they report:

- **Every anchor link resolves**:

  ```sh
  comm -23 <(grep -o '](#[^)]*)' "$DOC" | sed 's/](#\(.*\))/\1/' | sort -u) \
           <(grep -o '{#[^}]*}' "$DOC" | sed 's/{#\(.*\)}/\1/' | sort -u)
  ```

- **No orphan screenshots, and no broken image links** (run in bash, since zsh errors on an
  empty glob):

  ```sh
  bash -c 'cd "$(dirname "$1")" && D=$(basename "$1")
    for f in screenshots/*; do [ -e "$f" ] && ! grep -qF "$f" --exclude="*-rendered.md" --exclude="*-embedded.md" -- *.md && echo "orphan: $f"; done
    grep -oE "!\[[^]]*\]\([^)\" ]+" "$D" | sed "s/.*(//" | grep -vE "^[a-z]+:" |
      while read -r f; do [ -e "$f" ] || echo "missing: $f"; done' _ "$DOC"
  ```

  A screenshot counts as used if any source `.md` file in the doc's directory references it,
  since the preparation notes share `preparation/screenshots/`; the rendered and embedded
  copies don't count. `diagrams/` PNGs are referenced
  only by the rendered copies, so they aren't checked here.
- **Every diagram renders**: `node design-doc/scripts/markdown-mermaid-to-png.ts --check "$DOC"`
  exits without errors. `--check` renders to a temporary directory and writes nothing next to
  the doc.
- **No leftovers**: these find no review markers, template placeholders or template prompt
  text. The second matches the template's own prompt lines exactly, except the Revision
  history and Changes during engineering prompts, which stay:

  ```sh
  TPL=design-doc/sources/design-doc-template.md
  grep -nE '\[COMMENT:|\\<Feature Name\\>|PersonPerson|question \\#[12]\*\*|Do xyz|Added x, y, z' "$DOC"
  grep -nFxf <(grep -E '^\*[A-Z]' "$TPL" | grep -vE '^\*(While Google Docs|This section is intended)') "$DOC"
  ```

  Skip the second for a preparation note, which doesn't follow the template.
- **Style**: reread against the [style guide](SKILL.md#style-guide) — concise, diagrams
  sparing, nothing obvious over-explained, no editing artefacts, US English.

## Preparing the doc for Google Docs {#preparing-the-doc-for-google-docs}

Design docs are reviewed in Google Docs, which can't render fenced ```mermaid blocks and
won't follow relative image paths. Bake a self-contained companion of the source doc:

Run both from the plugin root.

1. **Render diagrams to PNG**: `node design-doc/scripts/markdown-mermaid-to-png.ts <doc>.md`
   replaces each inline ```mermaid fence with a rendered PNG (on a white background) at
   `diagrams/<doc>-NN.png`, writing `<doc>-rendered.md`. The doc's old PNGs are deleted first,
   so they always match it. The script uses `mmdc` if it is installed, and otherwise runs the
   version pinned in the script with `npx`, which downloads it on first use.

   On Linux, if every diagram fails with Chrome's "No usable sandbox" error, stop and tell
   the user. The fix is theirs to make: a git-ignored `design-doc/puppeteer-config.json`,
   which the script uses automatically, containing
   `{ "executablePath": "/opt/google/chrome/chrome" }` (or `{ "args": [ "--no-sandbox" ] }`
   without an installed Chrome).
2. **Embed images**: `node design-doc/scripts/markdown-convert-embedded-images.ts embed
   <doc>-rendered.md` inlines every `![](…)` image as a base64 data URI, writing
   `<doc>-embedded.md` — a single file that survives a paste into Google Docs. (`extract`
   reverses this.)

The hand-written source `.md` is canonical; regenerate the rendered/embedded copies from it
rather than editing them. Pasting back from Google Docs leaves Markdown specials
backslash-escaped (`\+`, `\!`, `\#`, `\[`) — expect and preserve these when syncing edits
into the source.
