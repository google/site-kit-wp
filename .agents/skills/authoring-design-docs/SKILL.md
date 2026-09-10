---
name: authoring-design-docs
description: >
  Apply Site Kit's design-doc conventions when authoring or editing a design doc — how to
  handle screenshots, Mermaid diagrams, intra-document links, document structure, tables,
  work estimates, exporting to Google Docs, and the house style. Also use it to run a stage
  of the staged design-doc process. Use when the user asks to write, draft, refine, or edit
  a design doc (or one of its sections) under `design-doc/`, to run one of the numbered
  `design-doc/` stage prompts, or otherwise works on design-doc content in this repo.
argument-hint: "[design doc path, stage prompt file, or section]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Author or edit a design doc

Write or edit design-doc content following the project's shared conventions. Do not
reimplement the conventions here — read and follow the playbook, which is the single source
of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/authoring-design-docs.md` and apply every
   convention it defines: assets (screenshots, diagrams), intra-document links, Google Docs
   export, document structure, tables, work estimates, and the style guide.
2. **Work out which stage you're in.** If `$ARGUMENTS` names one of the numbered stage
   prompts under `design-doc/` (or `design-doc/preparation/`), follow that file — it defines
   the task, its inputs and where its output goes. `design-doc/README.md` describes the
   process as a whole. Its four preparation stages are optional: where the brief's "Current
   inputs" table marks an artifact _(not used)_, work from the PRD and the design instead of
   asking for it or producing it yourself.
3. **Read the doc's own context** before writing: the feature brief
   (`design-doc/input/feature-brief.md`), the target document, its template
   (`design-doc/input/design-doc-template.md`), and — for structure and depth — the examples
   in `design-doc/input/examples/`. Requirements for a specific feature live in the brief and
   the resources it names, not in this skill.
4. **Verify your inputs, and stop and ask the user** for any that are missing.
   `design-doc/input/` is gitignored and user-supplied, so the brief, template, examples or
   PRD may simply not be there. Do not guess at requirements, invent a template or a scope,
   or proceed without the examples.
5. **Author or edit** the requested section(s), saving screenshots to `screenshots/` and
   Mermaid diagrams to `diagrams/` under the document's output directory and inlining both
   per the playbook's syntax.
6. **Self-check** against the playbook's style guide before finishing — concise, diagrams
   used sparingly, nothing obvious over-explained.

## Important

- **Edit cleanly**: when changing existing content, write it as if the document had always
  read that way. Never leave editing artefacts ("Previously…", "This replaces…", etc.) in
  the document — explanation of what changed belongs in your reply to the user, not the doc.
- Keep feature-specific material (scope, resources, requirements) out of this skill and out
  of the playbook; it belongs in `design-doc/input/feature-brief.md`.
