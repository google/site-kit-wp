# Design doc - implementation briefs

## Introduction

Read ./design-doc/preparation/00-introduction.md

## Inputs

Read the feature brief (./design-doc/input/feature-brief.md) and, from its "Current inputs"
table, the design doc, plus whichever preparation artifacts it names — the requirements
overview, the architecture document and the component list.

## Write Implementation Briefs

The design doc has been created; it's the iteration the brief's "Design doc" row points at.

Issues defined in the "Work Estimates" section of the design doc have been created, with their Acceptance Criteria defined.

The next step is to draft the "Implementation Brief" section for each of the issues.

Issues will be worked on in batches. For each batch:

- Refer to the issue files in the ./design-doc/issues/implementation-brief/pending directory for the issues that need to be completed.
- Example completed issues are found in the ./design-doc/input/issues/implementation-brief-examples directory.
- Existing issues for this feature that have been completed are found in the ./design-doc/issues/implementation-brief/complete directory.
- Create a new directory in ./design-doc/issues/implementation-brief/output/iteration-XX where XX is the next iteration number.
- Write the issues with their Implementation Briefs to the new directory.
- Keep each issue's filename and its `Source:` line exactly as they appear in `pending` — they carry the GitHub issue number, which is what lets the brief be pushed back to the right issue.
- Copy this file (07-write-implementation-briefs.md), ./design-doc/preparation/00-introduction.md and the feature brief to ./design-doc/issues/implementation-brief/output/iteration-XX/

DO NOT read the contents of the previous iterations' output directories, as they may be incorrect.

The `pending` directory holds the created issues trimmed down to their Feature Description and
Acceptance criteria. To refresh it from GitHub:

```sh
node ./design-doc/scripts/github-fetch-sub-issues.js <parent-issue-number>
node ./design-doc/scripts/markdown-trim-sections.js ./design-doc/issues/<parent-issue-number> \
  -o ./design-doc/issues/implementation-brief/pending
```

Once the user has approved a batch, the briefs are pushed back to the existing issues with:

```sh
node ./design-doc/scripts/github-create-sub-issues.js <parent-issue-number> \
  -d <batch directory> --update --dry-run
```

`--update` resolves each issue from the `Source:` line or the filename, so both must survive
from `pending`. Drop `--dry-run` to do it for real. Don't run it unless you're asked to.

### Implementation Brief guidelines

The examples directory (./design-doc/input/issues/implementation-brief-examples) and its
README cover general IB style, and the bloat to avoid — read them
first. What follows is what review has repeatedly corrected in this project.

**Respect the dependency order.**

- The `NN-` prefixes in `pending/` are not a reliable dependency order. Confirm it where a brief
  depends on a sibling landing first.
- Never assume a later issue's work exists. State what will be absent, placeholder or unwired when
  this issue lands.
- Where an issue deliberately falls short of the design because a later one completes it, add that
  exception to the AC's "matches the Figma design" bullet — a brief claiming both a Figma match and
  a missing control contradicts itself.
- Phrase work landing in another issue's files so it reads as work to do here, not as an
  instruction to go and edit that issue.

**Link sparingly.** An issue number earns its place only where it is the only pointer to that work
in the file, or where it names work landing outside this issue. If the component, selector or tab
name already carries the meaning, drop the number — and check the Feature Description and AC above
the IB first, since they already carry most sibling references. Don't repeat issue links in the IB.

**The italic scoping note is optional.** Include it only for scope the Feature Description and AC
don't already give; fold a single stray fact into the bullet it belongs to instead.

**Design component contracts deliberately.**

- Let the component derive its own state from the selectors, and give consumers a uniform veto
  (`hideNewBadge`, `hideUnreadDot`) over the parts they don't want. Sibling props that behave alike
  should read alike; follow the plugin's suppression-prop idiom (`hideExternalIndicator`,
  `noPrefix`), and avoid default-true booleans.
- Where a consumer's own action changes a derived value while the user is looking at it — a list
  marking its items seen — handle that transition inside the component, with local state and a
  `useEffect` timeout over the selector. Don't push the whole condition up to the consumer: it
  makes one prop a directive while its sibling is a veto, and spreads the behaviour across issues.

**Don't itemise styling** the AC's "matches the Figma design" already covers. Name a value only
where it can't be read off the design system, or where another issue depends on the arrangement —
e.g. the card drawing its own separator, so the lists using it need none.

**Storybook and tests.**

- Storybook stories are for verifying visual presentation, not logic. A story asserting an absence
  — a card filtered out, a heading omitted — has nothing to compare; that belongs in Test Coverage.
- Where several issues in a batch need the same registry setup, add a `provide*` helper to
  `tests/js/utils.ts` in the earliest of them and reuse it in the rest.

**Use TypeScript for all new files:** components `.tsx` exporting their own props type, stories
`.stories.tsx` typed with `Story< Props >` from `@/js/types/Story`, tests `.test.tsx`.

**The Acceptance Criteria are not frozen.** Where drafting the IB reveals a gap, a design decision
or a conflict, suggest a change to the AC too, and say why.

**Keep the batch consistent.** A decision that changes a shared contract — a new prop, a new
catalog field, a new test helper — applies to every brief in the batch that touches it, not just
the one where it came up.