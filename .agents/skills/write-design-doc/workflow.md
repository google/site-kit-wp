# Design-doc workflow

The optional staged workflow for producing a design doc, and where its outputs are kept. Read
this when starting or advancing a stage, or when a feature has no introduction yet. The
conventions in [SKILL.md](SKILL.md) apply to every stage.

## Feature layout {#feature-layout}

Each output has one fixed location under the feature's [workspace](SKILL.md#workspace)
directory, `design-doc/workspace/<feature>/`:

```
introduction.md          # the feature introduction
sources/                 # local copies of the PRD, review docs, etc.
preparation/
  overview.md            # P1
  architecture.md        # P2
  components.md          # P3
  outline.md             # P4
  screenshots/
  diagrams/
design-doc.md            # the design doc
screenshots/
diagrams/
```

Each stage writes to its location, editing the file in place or rewriting it. Earlier versions
are kept in the workspace repository's git history, which the user manages; see
[Managing the workspace history](#managing-the-workspace-history).

## Feature introduction {#feature-introduction}

Each feature has one introduction, `introduction.md`, which is the only feature-specific input
every stage reads. If it is missing, write it first (or ask for what it needs). It contains:

- **Feature** — its name, and a sentence on what it is and which product it belongs to.
- **Resources** — the PRD, Figma file, and any notes or review documents, each with its link
  and, for documents, the path of its [local copy](reference.md#fetching-feature-documents) in
  the feature's `sources/` directory. Stages read the local copy, not the original. Also note
  where extra context lives (e.g. comments on a Google Doc).
- **Template and examples** — `design-doc/workspace/sources/design-doc-template.md` (fetched
  if missing; see [Fetching the template](reference.md#fetching-the-template)) and
  `design-doc/workspace/sources/examples/` (fetched if missing; see [Fetching the
  examples](reference.md#fetching-the-examples)).
- **Scope** — the phase being designed, what is in scope, and what is deferred to a later
  phase.

## Stages

A full doc can be written in one pass, but for a large feature it is usually better to build
it in the stages below, one request per stage. Each stage is optional and can be run on its
own — run only the ones the request asks for.

### Preparation {#preparation}

Working notes that feed the doc, in the feature's `preparation/` directory.

| Stage | Output | Uses | Content |
| --- | --- | --- | --- |
| P1. Understand requirements | `overview.md` | PRD, Figma | An overview of the feature, with Figma screenshots following the [screenshot conventions](SKILL.md#screenshots). |
| P2. Define architecture | `architecture.md` | P1 | The core architecture: data flow, datastores, REST and settings changes, grounded in real, [verified](SKILL.md#style-guide) APIs. |
| P3. List components | `components.md` | P1, P2 | The new React components as a [hierarchy](SKILL.md#tables), and anything worth flagging that isn't an implementation detail. |
| P4. Outline the detailed design | `outline.md` | P1–P3 | A skeleton of the detailed design section: sub-section headings, each with a very brief description. |

### Authoring {#authoring}

All authoring stages work on `design-doc.md`.

| Stage | Content |
| --- | --- |
| A1. Overview and detailed design | Write every template section up to and including the detailed design. Follow the P4 outline, if there is one. |
| A2. Refine the overview and detailed design | Revise those sections in place. |
| A3. Remaining sections, barring work estimates | Add every other template section except the work estimates. |
| A4. Work estimates | Add the [work estimates](SKILL.md#work-estimates) section, once the rest of the design is settled. |
| A5. Refine the whole doc | Revise all sections together for consistency, accuracy and the [style guide](SKILL.md#style-guide). |

The preparation notes are working material: carry their decisions into the doc, and leave
detail that an implementation brief would specify. Ground A2–A5 in the requirements and
preparation notes, not only the existing draft — the draft may have drifted from them.

**Redoing a stage from scratch** (when the request asks for a fresh version rather than an
edit): write it from the introduction, sources and preparation notes without reading the
existing output, then overwrite it. Reading a draft you are replacing anchors the new one on
its mistakes.

## Managing the workspace history {#managing-the-workspace-history}

The user decides when to commit; never commit unless asked. Keep the history easy for them to
manage:

- **Before overwriting a file wholesale**, run `git -C design-doc/workspace status --short` on
  it. If it has uncommitted changes, stop, tell the user, and offer to commit them first, so a
  draft is never silently lost.
- **Keep `diagrams/` in step with the doc.** The rendered PNGs are tracked, so when a pass
  changed a ```` ```mermaid ```` fence, re-render the changed document with
  `node design-doc/scripts/markdown-mermaid-to-png.ts <doc>.md` (see [Preparing the doc for
  Google Docs](reference.md#preparing-the-doc-for-google-docs)) before suggesting a commit.
  The `-rendered.md` and `-embedded.md` copies are regenerated on each export and ignored by
  the workspace's `.gitignore`.
- **When a stage or edit pass is done**, end the reply with a suggested commit command for the
  files it changed, including `diagrams/`, e.g.
  `git -C design-doc/workspace add date-picker && git -C design-doc/workspace commit -m "P2: define architecture."`.
  Don't run it unless asked.
