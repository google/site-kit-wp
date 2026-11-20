# write-design-doc

An AI agent skill for writing and editing Site Kit design docs. It follows the house conventions
for structure, screenshots, Mermaid diagrams, tables, work estimates and style, and it gets the
finished doc ready to paste into Google Docs for review.

This README is for people. The agent reads [SKILL.md](SKILL.md), which links to
[workflow.md](workflow.md) and [reference.md](reference.md) when it needs them.

## Using it

Ask your agent in plain language. The skill runs when the request is about a design doc, for
example:

-   "Write the introduction for the date picker design doc."
-   "Run P2 for the date picker: define the architecture."
-   "Write the overview and detailed design (A1) for the date picker."
-   "Refine the Detailed design section."
-   "Prepare the date picker design doc for Google Docs."

In Claude Code you can also run `/write-design-doc [design doc path or section]`.

Before it writes anything, the agent asks for whatever is missing, such as the feature name,
links to example design docs, or a feature introduction.

## Workspace

Nothing from design-doc work is committed to Site Kit. All output goes in
`design-doc/workspace/`, which:

-   is ignored by Site Kit, both in `.gitignore` and in `.git/info/exclude`, so it stays ignored
    when you switch to a branch that doesn't have this skill;
-   is its own local-only git repository, with no remote and a `pre-push` hook that blocks every
    push.

The agent sets the workspace up the first time it's needed and tells you if it adds entries to
`.git/info/exclude`.

```
design-doc/
├── scripts/                      # Shared tooling, tracked by Site Kit
├── puppeteer-config.json         # Optional and git-ignored: per-machine Chrome settings
└── workspace/                    # Local-only git repo
    ├── sources/
    │   ├── design-doc-template.md   # Fetched from the canonical Google Doc
    │   └── examples/                # Example design docs you supply
    └── <feature>/                   # e.g. date-picker
        ├── introduction.md          # Feature, resources, scope: every stage reads this
        ├── sources/                 # Local copies of the PRD, review docs, etc.
        ├── preparation/             # P1–P4 working notes
        ├── design-doc.md            # The design doc
        ├── screenshots/
        └── diagrams/                # Rendered Mermaid PNGs
```

The agent never commits to the workspace unless you ask. At the end of each pass it suggests a
`git -C design-doc/workspace …` commit command, and it checks before overwriting a file that
has uncommitted changes.

## Stages

You can write a doc in one pass. For a large feature it usually works better to build it in
stages, one request per stage. Every stage is optional.

| Stage                                         | Output                        |
| --------------------------------------------- | ----------------------------- |
| P1. Understand requirements                   | `preparation/overview.md`     |
| P2. Define architecture                       | `preparation/architecture.md` |
| P3. List components                           | `preparation/components.md`   |
| P4. Outline the detailed design               | `preparation/outline.md`      |
| A1. Overview and detailed design              | `design-doc.md`               |
| A2. Refine the overview and detailed design   | `design-doc.md`               |
| A3. Remaining sections, except work estimates | `design-doc.md`               |
| A4. Work estimates                            | `design-doc.md`               |
| A5. Refine the whole doc                      | `design-doc.md`               |

To have a stage written again from scratch rather than edited, ask for a fresh version. The
agent then won't read the old draft, so the new one doesn't repeat its mistakes.

## Scripts

Both scripts are in `design-doc/scripts/` and run from the plugin root. They're written in
TypeScript and run directly with `node`, so you need a Node version that can strip types
(22.18+ or 23.6+).

| Script                                                  | Purpose                                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown-mermaid-to-png.ts [--check] <doc>.md`         | Renders each ` ```mermaid ` block to `diagrams/<doc>-NN.png` and writes `<doc>-rendered.md`. With `--check`, it only checks that the diagrams render. |
| `markdown-convert-embedded-images.ts embed <file>.md`   | Inlines images as base64 and writes `<file>-embedded.md`, a single file you can paste into Google Docs.                                               |
| `markdown-convert-embedded-images.ts extract <file>.md` | Does the reverse for a Google Docs Markdown export: it saves the images as files and writes `<file>-extracted.md`.                                    |

`markdown-mermaid-to-png.ts` uses `mmdc` if it's installed. Otherwise it runs a pinned version
through `npx`.

On Linux, if rendering fails with Chrome's "No usable sandbox" error, create
`design-doc/puppeteer-config.json` with:

```json
{ "executablePath": "/opt/google/chrome/chrome" }
```

If Chrome isn't installed, use `{ "args": [ "--no-sandbox" ] }` instead.

## Reviewing in Google Docs

1. Ask the agent to prepare the doc for Google Docs. It runs both scripts and produces
   `design-doc-embedded.md`.
2. Copy the contents of that file and paste them into Google Docs with **Paste from Markdown**
   (Edit menu or right-click). If it isn't there, turn on **Tools → Preferences → Enable
   Markdown**.
3. To bring review edits back, ask the agent to sync them into `design-doc.md`, which is the
   canonical source. Never edit the `-rendered.md` or `-embedded.md` copies: they're
   regenerated on every export.

## Prerequisites

-   A Google Drive connector, so the agent can fetch the template, the examples and feature
    documents. Without one, the agent asks you to download each doc with
    **File → Download → Markdown (.md)**.
-   Node.js, as described under [Scripts](#scripts).
