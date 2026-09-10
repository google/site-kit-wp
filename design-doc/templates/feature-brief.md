# <Feature name> — design doc brief

<!--
Copy this file to ./design-doc/input/feature-brief.md and fill it in before running any
stage of the process described in ./design-doc/README.md. Every stage reads it.

Replace each placeholder and delete the guidance comments as you go.
-->

## Feature

<!-- One paragraph: what the feature is, and who it's for. -->

A new feature for Google's Site Kit plugin for WordPress that <does what, for whom>.

## Resources

The full requirements for the feature are found in these resources:

- Product requirements document (PRD): <path or URL>
- Design: <Figma URL, or path to exported designs>
- <Any other source of truth, e.g. a content/copy spreadsheet: path or URL>

<!--
Local files belong under ./design-doc/input/ — it's gitignored, so confidential material
stays out of the repository. Give a URL where the source of truth lives online.
-->

## Scope

<!--
State the intended scope, and be explicit about exclusions — an unbounded brief produces an
unbounded design doc. Delete this section only if the PRD is genuinely the whole scope.
-->

This will be a <MVP / full> implementation of the feature.

Items NOT in scope are:

- <Exclusion, and if it needs one, a clarification of what the term means here.>

## Additional context

<!--
Anything an engineer reading the requirements would otherwise get wrong. Examples: which
resource wins when two disagree; which copy is placeholder; a dependency that's still in
flight.
-->

- <Context note.>

## Current inputs

Each stage of the process writes its artifact to a new `<name>-NN` directory and then updates
its row below. Later stages read **only** what this table points at.

Pin the iteration you want the next stage to read. That is not automatically the
highest-numbered one — a newer iteration may be an experiment you decided against.

The four preparation artifacts are optional. If you're skipping the preparation stages —
reasonable for a small, well-specified feature — mark their rows _(not used)_ and the later
stages will work from the PRD and the design in "Resources" instead.

| Artifact                | Path                |
| ----------------------- | ------------------- |
| Requirements overview   | _(not yet created)_ |
| Architecture            | _(not yet created)_ |
| Component list          | _(not yet created)_ |
| Detailed design outline | _(not yet created)_ |
| Design doc              | _(not yet created)_ |
