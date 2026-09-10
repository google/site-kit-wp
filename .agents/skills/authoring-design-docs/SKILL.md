---
name: authoring-design-docs
description: >
  Apply Site Kit's design-doc conventions when authoring or editing a design doc — how to
  handle screenshots, Mermaid diagrams, intra-document links, document structure, tables,
  work estimates, exporting to Google Docs, and the house style. Use when the user asks to
  write, draft, refine, or edit a design doc (or one of its sections) under `design-doc/`, or
  otherwise works on design-doc content in this repo.
argument-hint: "[design doc path or section]"
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
2. **Read the doc's own context** before writing: the target document, its template
   (`design-doc/design-doc-template.md`), and — for structure and depth — the examples in
   `design-doc/examples/`. Requirements for a specific feature live with that doc (its PRD
   and preparation notes), not in this skill.
3. **Author or edit** the requested section(s), saving screenshots to `screenshots/` and
   Mermaid diagrams to `diagrams/` under the document's output directory and inlining both
   per the playbook's syntax.
4. **Self-check** against the playbook's style guide before finishing — concise, diagrams
   used sparingly, nothing obvious over-explained.

## Important

- **Edit cleanly**: when changing existing content, write it as if the document had always
  read that way. Never leave editing artefacts ("Previously…", "This replaces…", etc.) in
  the document — explanation of what changed belongs in your reply to the user, not the doc.
- Keep the FDH- or feature-specific material (scope, resources, requirements) out of this
  skill; it captures only the reusable conventions.
