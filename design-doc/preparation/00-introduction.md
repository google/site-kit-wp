# Writing the Feature Discovery Hub design doc

## Introduction

You're going to create a design doc for the "Feature Discovery Hub" feature. This is a new feature for Google's Site Kit plugin for WordPress.

This document is an introduction to the process of writing the design doc.

## Resources

The full requirements for the feature are found in these resources:

- Product requirement document (PRD): ./design-doc/feature-discovery-hub-prd.md
- Figma design: https://www.figma.com/design/7gBBIQhrIvLicLinAt9vta/Feature-Discovery-Hub?node-id=756-13326&p=f&t=31e0sVDm9Cupvhbt-0
- Features list: https://docs.google.com/spreadsheets/d/1I3LvR-r0CY_uOiI2jZh_iy1m6AgCf9ypmhRBQBggzN0/edit?pli=1&gid=65994475#gid=65994475

The design doc will follow this template: ./design-doc/design-doc-template.md

Example design docs are found in this folder: ./design-doc/examples

Your working directory contains the Site Kit codebase.

## Scope

This will be an MVP implementation of the feature.

Items NOT in scope are:

- Aspects of the PRD that aren't included in the other resources.
- The "Suggested for you" tab and other user input related aspects.
  - "User input" in this context refers specifically to Site Kit's 3-question user input questionnaire. The other feedback mechanisms are in scope.
- Showing features from plugin versions newer than the installed version.
- RRM sub-features other than the newsletter sub-feature.

## Additional context

- Some of the copy in Figma is placeholder text, the copy in the features list will be the final copy.

## Conventions

Follow the shared conventions for design-doc screenshots, diagrams, intra-document links, and house style defined in the playbook **`docs/context/workflow/authoring-design-docs.md`** (Claude Code exposes this as the `authoring-design-docs` skill; save screenshots and diagrams under the document's output directory).
