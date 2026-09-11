# Design doc process

A staged, AI-assisted process for taking a feature from its requirements to a reviewed design
doc, and from there to the GitHub issues that implement it — each with acceptance criteria and
an Implementation Brief.

Each stage is a prompt file. You run one stage at a time, review what came back, and move on.
The stages are deliberately separate so a human reads every artifact before it becomes the
input to the next one.

The **conventions** the documents themselves follow — screenshots, Mermaid diagrams,
intra-document links, structure, tables, work estimates, house style — live in the playbook
**`docs/context/workflow/authoring-design-docs.md`**, not here. This file covers the *process*.

## Getting started

1. Copy `templates/feature-brief.md` to `input/feature-brief.md` and fill it in. Every stage
   reads it, and it's the only place feature-specific detail belongs.
2. Add the rest of the inputs to `input/`. The required-inputs table in
   `preparation/00-introduction.md` lists what each stage needs and where it goes.
3. Run the stages in order (see below), starting either with the preparation stages or —
   for a small, well-specified feature — straight in at stage 1.

`input/` is gitignored, so the PRD, the design-doc template and the example docs stay out of
the repository. A stage that's missing an input will stop and ask you for it rather than
invent one.

## The stages

Stages 1–7 produce the design doc and then the issues. The four **preparation** stages that
come before them are optional: they break a large or unfamiliar feature into reviewable pieces
before any of the doc is written. For a small, well-specified feature, fill in the brief and
start at stage 1 — mark the preparation rows of the brief's *Current inputs* table
_(not used)_ and the later stages work from the PRD and the design instead.

Skip them selectively too. An architecture document earns its place on a feature that spans
several surfaces or adds backend work; a component list earns its place when there are enough
components that naming them is a real decision.

| Stage | Prompt file | Produces |
| --- | --- | --- |
| Prep 1 *(optional)* | `preparation/01-understand-requirements.md` | `preparation/output/overview-NN/` — an overview of the requirements, plus screenshots |
| Prep 2 *(optional)* | `preparation/02-define-architecture.md` | `preparation/output/architecture-NN/` — the core architecture |
| Prep 3 *(optional)* | `preparation/03-create-component-list.md` | `preparation/output/components-NN/` — the React component list |
| Prep 4 *(optional)* | `preparation/04-create-detailed-design-outline.md` | `preparation/output/outline-NN/` — a skeleton of the detailed design section |
| 1 | `01-overview-and-detailed-design.md` | `output/iteration-NN/design-doc.md` — every section up to and including the detailed design |
| 2 | `02-overview-and-detailed-design-refinement.md` | refines those sections in place |
| 3 | `03-remaining-sections-barring-work-estimates.md` | adds the remaining sections, bar work estimates |
| 4 | `04-work-estimates.md` | adds the work estimates section |
| 5 | `05-design-doc-refinement.md` | refines the whole doc |
| 6 | `06-create-issues.md` | `issues/acceptance-criteria/output/iteration-NN/` — one file per issue, with its Feature Description and acceptance criteria |
| 7 | `07-write-implementation-briefs.md` | `issues/implementation-brief/output/iteration-NN/` — the same issues, with Implementation Briefs |

## Running a stage

Give the agent the stage's prompt file — as
`/authoring-design-docs design-doc/04-work-estimates.md` where your tool exposes that command,
or by pasting the file's contents. The prompt files are self-contained and tool-agnostic.

Then review the output and, if the stage produced a new artifact, point the brief's
**Current inputs** table at it.

## Iterations

A stage that produces a new artifact writes it to a new `<name>-NN` directory, numbered
sequentially, and copies its own prompt file and the brief in alongside it — so the artifact
records the instructions that produced it. Stages 2–5 refine the design doc in place, so an
`iteration-NN` directory records the prompt that created the doc, not every prompt that
touched it.

Earlier iterations are kept for reference but are **not** inputs: every stage is told not to
read them, because a superseded iteration is usually wrong rather than merely old. Later stages
read only what the brief's *Current inputs* table points at, which is why you pin that
yourself instead of it defaulting to the highest number — a newer iteration may be an
experiment you decided against. A row marked _(not used)_ means that stage was skipped.

## Scripts

`scripts/` holds helpers used around the process. The GitHub ones need the
[GitHub CLI](https://cli.github.com) authenticated (`gh auth login` or `GH_TOKEN`); the diagram
renderer needs `mmdc` from [`@mermaid-js/mermaid-cli`](https://github.com/mermaid-js/mermaid-cli).
The three below that take options also take `--help`; the two markdown converters print their
usage when called with no arguments.

| Script | What it does |
| --- | --- |
| `markdown-mermaid-to-png.js <doc>.md` | Renders each inline ```` ```mermaid ```` fence to `diagrams/NN-diagram.png` and writes `<doc>-rendered.md` referencing them. The input is untouched. Only fences flush with the left margin are matched — an indented one is skipped silently. |
| `markdown-convert-embedded-images.js embed <doc>.md` | Inlines every image as a base64 data URI, writing `<doc>-embedded.md` — one self-contained file that survives a paste into Google Docs. `extract` reverses it. |
| `github-fetch-sub-issues.js <parent-issue>` | Writes every sub-issue of the parent to `issues/<parent-issue>/`. |
| `markdown-trim-sections.js <dir\|file…>` | Trims issue markdown to named sections — by default the Feature Description and acceptance criteria, which is what stage 7 reads from `pending/`. |
| `github-create-sub-issues.js <parent-issue>` | Creates a GitHub issue per markdown file in a batch directory and attaches each to the parent as a sub-issue. Point `-o` at the issue tree's `output/` (its default doesn't match this layout) and it takes the newest `iteration-NN`, or name one with `-d`. `--dry-run` first; re-runs skip files that already have an issue, and `--update` pushes later edits. |

See [Preparing the doc for Google Docs](../docs/context/workflow/authoring-design-docs.md#preparing-the-doc-for-google-docs)
in the playbook for how the first two fit together.

## What's committed

Committed: this README, the stage prompt files, `templates/` and `scripts/`.

Gitignored: `input/` (what you supply) and the artifacts the process produces — `output/`,
`preparation/output/` and `issues/`.
