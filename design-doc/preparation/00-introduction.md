# Writing a design doc

## Introduction

You're going to help create a design doc for a feature in Google's Site Kit plugin for
WordPress, working through one stage of the process described in ./design-doc/README.md.

This file is the generic introduction, shared by every stage. The feature-specific brief —
what the feature is, where its requirements live, and what is in and out of scope — is
./design-doc/input/feature-brief.md.

Your working directory contains the Site Kit codebase.

## Before you start

Read ./design-doc/input/feature-brief.md, then check that the inputs your stage needs are
actually present:

| Input               | Path                                                     | Needed by |
| ------------------- | -------------------------------------------------------- | --------- |
| Feature brief       | `design-doc/input/feature-brief.md`                      | every stage |
| PRD                 | as named in the brief's "Resources"                      | preparation 01 |
| Design              | as named in the brief's "Resources"                      | preparation 01, and any stage adding screenshots |
| Design doc template | `design-doc/input/design-doc-template.md`                | 01 |
| Example design docs | `design-doc/input/examples/`                             | 01 |
| Issue template      | `.github/ISSUE_TEMPLATE/feature_request.md`              | 06 |
| Example issues (AC) | `design-doc/input/issues/acceptance-criteria-examples/`  | 06 |
| Example issues (IB) | `design-doc/input/issues/implementation-brief-examples/` | 07 |

`design-doc/input/` is gitignored and is supplied by the user, so its entries above may not be
there (the issue template is part of the repository). **Stop and ask the user** for anything
that's missing. Do not guess at requirements, invent a template or a scope, or carry on
without the examples — a design doc built on assumed requirements is worse than no design doc.

If the brief itself is absent, create it from `design-doc/templates/feature-brief.md` and ask
the user to fill it in — or fill it in from what they tell you, and have them confirm it —
before going any further.

## Conventions

Follow the shared conventions for design-doc screenshots, diagrams, intra-document links, and
house style defined in the playbook **`docs/context/workflow/authoring-design-docs.md`** (Claude
Code exposes this as the `authoring-design-docs` skill; save screenshots and diagrams under the
document's output directory).
