# Design doc - create issues

## Introduction

Read ./design-doc/preparation/00-introduction.md

## Inputs

Read the feature brief (./design-doc/input/feature-brief.md) and, from its "Current inputs"
table, the design doc, the requirements overview, the architecture document and the component
list.

## Create GitHub issues

The design doc has been created; it's the iteration the brief's "Design doc" row points at.

The next step is to draft the "Feature Description" and "Acceptance criteria" sections for each of the issues that are defined in the "Work Estimates" section of the design doc.

Issues will be created in batches. For each batch:

- Use the repository's issue template, ./.github/ISSUE_TEMPLATE/feature_request.md, as a template for the issues.
- Example issues are found in the ./design-doc/input/issues/acceptance-criteria-examples directory.
- Existing issues that have been completed are found in the ./design-doc/issues/acceptance-criteria/output/final directory.
- Create a new directory in ./design-doc/issues/acceptance-criteria/output/iteration-XX where XX is the next iteration number.
- Write the issues to the new directory.
- Each issue should be in a separate file, named NN-{slug}.md where NN is the issue number and {slug} is the issue slug, derived from the issue title.
- Copy this file (06-create-issues.md), 00-introduction.md and the feature brief to ./design-doc/issues/acceptance-criteria/output/iteration-XX/

DO NOT read the contents of the previous iterations' output directories, as they may be incorrect.

Once the user has approved a batch, it's pushed to GitHub with
`node ./design-doc/scripts/github-create-sub-issues.js <parent-issue-number> -d <batch directory>`,
which creates an issue per markdown file and attaches each as a sub-issue of the parent. Don't
run it unless you're asked to.

## Acceptance criteria guidelines

When writing the acceptance criteria (AC), follow these guidelines:

-  In general, keep implementation details to a minimum. The target audience includes developers, QA engineers, and product managers. Implementation details will be covered in the "Implementation Brief" section.
-  When an issue is user-facing, ideally there will be no implementation details in the AC.
-  When an issue has no user-facing changes, for example it's only introducing a new REST endpoint or datastore API, some implementation details are expected, but still keep them to a minimum (e.g, in this example the AC would list the endpoints and the shape of the datastore API, but not the details of how the endpoints or the datastore API are implemented).
-  Only cross-reference issues that have already been completed, or are within the batch being created.
   - Issues that have been completed are referenced by their GitHub issue number, e.g. "#123".
   - Issues within the batch being created are referenced with a placeholder, e.g. "#NN-{slug}".
-  Follow the examples in the ./design-doc/input/issues/acceptance-criteria-examples directory for guidance.
