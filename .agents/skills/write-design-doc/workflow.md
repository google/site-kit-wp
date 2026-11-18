# Design-doc workflow

The optional staged workflow for producing a design doc, and how its outputs are kept. Read this
when starting or advancing a stage, or when a feature has no introduction yet. The conventions
in [SKILL.md](SKILL.md) apply to every stage.

## Feature introduction {#feature-introduction}

Each feature has one introduction,
`design-doc/workspace/<feature>/preparation/00-introduction.md`, which is the only
feature-specific input every stage reads. If it is missing, write it first (or ask for what it
needs). It contains:

- **Feature** — its name, and a sentence on what it is and which product it belongs to.
- **Resources** — the PRD, Figma file, and any notes or review documents, with links, plus a
  note on where extra context lives (e.g. comments on a Google Doc).
- **Template and examples** — `design-doc/sources/design-doc-template.md` (fetched if missing; see
  [Fetching the template](reference.md#fetching-the-template)) and `design-doc/sources/examples/`
  (fetched if missing; see [Fetching the examples](reference.md#fetching-the-examples)).
- **Scope** — the phase being designed, what is in scope, and what is deferred to a later
  phase.
- **Current inputs** — which [preparation](#preparation) iteration of each kind is current,
  so later stages read the right one.
- **Conventions** — a pointer to the `write-design-doc` skill.

## Stages

A full doc can be written in one pass, but for a large feature it is usually better to build
it in the stages below, one request per stage. Each stage is optional and can be run on its
own — run only the ones the request asks for, against the iterations it names.

### Preparation {#preparation}

Working notes that feed the doc. Each goes in its own [iteration](#iterations) under
`design-doc/workspace/<feature>/preparation/output/<kind>-XX/`.

| Stage | Output | Uses | Content |
| --- | --- | --- | --- |
| P1. Understand requirements | `overview-XX/overview.md` | PRD, Figma | An overview of the feature, with Figma screenshots following the [screenshot conventions](SKILL.md#screenshots). |
| P2. Define architecture | `architecture-XX/architecture.md` | P1 | The core architecture: data flow, datastores, REST and settings changes, grounded in real, [verified](SKILL.md#style-guide) APIs. |
| P3. List components | `components-XX/components.md` | P1, P2 | The React components the feature needs, as a `Name \| Path \| Role` [table](SKILL.md#tables), marking which are new and which are modified. |
| P4. Outline the detailed design | `outline-XX/outline.md` | P1–P3 | A skeleton of the detailed design section: sub-section headings, each with a very brief description. |

### Authoring

1. **Overview and detailed design.** Write every template section up to and including the
   detailed design, in a new iteration. Follow the P4 outline, if there is one.
2. **Refine the overview and detailed design.** Revise those sections in place.
3. **Remaining sections, barring work estimates.** Add every other template section except the
   work estimates.
4. **Work estimates.** Add the [work estimates](SKILL.md#work-estimates) section, once the rest
   of the design is settled.
5. **Refine the whole doc.** Revise all sections together for consistency, accuracy and the
   [style guide](SKILL.md#style-guide).

Ground stages 2–5 in the requirements and preparation outputs, not only the existing draft —
the draft may have drifted from them.

## Iterations {#iterations}

- Each new output goes in a new iteration directory, numbered one after the latest (`01`,
  `02`, …): a preparation note in `preparation/output/<kind>-XX/`, a doc draft in
  `output/iteration-XX/design-doc.md` (both under the feature's
  [workspace](SKILL.md#workspace) directory), each with its `screenshots/` and `diagrams/`
  alongside.
- Record how the iteration was made: copy the feature introduction into it, and save the
  request that produced it as `prompt.md`.
- Later stages edit the iteration named in the request in place, unless asked to start a new
  one.
- **Don't read previous iterations' output** other than the ones named in the request or the
  introduction — earlier iterations may be wrong and would anchor the new content on their
  mistakes.
