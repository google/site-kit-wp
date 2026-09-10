---
title: Author or edit a design doc
description: Apply Site Kit's design-doc conventions — screenshots, Mermaid diagrams, intra-document links, and house style — when authoring or editing a design doc, following the project's shared playbook.
---

# Author or edit a design doc

Run with `/authoring-design-docs [design doc path or section]` in the Agent chat.

The conventions are the shared, tool-agnostic playbook
**`docs/context/workflow/authoring-design-docs.md`** (the single source of truth used by all
of this project's AI tools). Follow it exactly. Summary of what it covers:

1. **Screenshots** — save to a `screenshots/` subdirectory with a numeric-prefixed name,
   reference with `![Name](screenshots/name.png)`, and keep them legible (opaque background,
   full-resolution or split for tall frames, exact copy from Figma metadata).
2. **Diagrams** — author in Mermaid; the inline ```` ```mermaid ```` fence is authoritative,
   rendered PNGs are generated into `diagrams/`. Use diagrams sparingly and avoid the
   documented Mermaid rendering pitfalls.
3. **Intra-document links** — give every target heading a `{#anchor-name}` anchor and link
   by anchor; say each thing once and cross-reference the rest.
4. **Preparing for Google Docs** — render diagrams to PNG and embed images (via the
   `design-doc/scripts/` helpers) to produce a self-contained file that survives a paste.
5. **Document structure, tables, and work estimates** — reader-model structure, inventory
   tables, and the work-estimates table conventions.
6. **Style guide** — concise but human-friendly; self-contained; verify code references;
   decide or defer open points; US English; and edit cleanly, leaving no trace of the edit.

Before writing, read the target document, its template
(`design-doc/design-doc-template.md`), and the examples in `design-doc/examples/`.
Feature-specific requirements live with the doc, not in this workflow.
