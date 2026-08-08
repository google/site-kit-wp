# Writing an Issue — Playbook

This is the **single source of truth** for writing the **Feature Description** and **Acceptance
criteria** of a Site Kit issue. Every AI coding tool (Gemini CLI, Antigravity, Claude Code)
points at this file through a thin per-tool adapter, so the procedure stays identical
everywhere. When you update the process, update it **here** — not in the adapters.

These are the two *authoring* sections. The Implementation Brief and Test Coverage are written
later, from the criteria you produce here, by `write-implementation-brief.md`. Write the criteria
so that playbook has a contract it can execute against without re-reading the design doc.

---

## Step 1 — Establish the source and the mode

Source material arrives one of three ways, and only the user can tell you which:

- **A design doc** — a path in the repo, or a hosted doc.
- **Requirements written directly in the user's message.**
- **An existing issue** — a GitHub issue number (`gh issue view <number> --json title,body`) or a
  path to a local issue file, when only the criteria are wanted.

There are two modes, and they decide what you are allowed to touch:

- **New issue** — write both the Feature Description and the Acceptance criteria.
- **Existing issue with a Feature Description already written** — write **only** the Acceptance
  criteria. Read the description to write against it and leave it byte-for-byte alone, unless
  the user explicitly asks you to change it.

**Stop and ask the user** if no source material was given, if the requirements are ambiguous or
contradict each other, or if the design doc covers an epic and the user has not said which issue
to write. Never invent a path to a design doc, and never go looking for a local issue file — it
has no fixed home, so the user must give you the path.

If the design doc has a **work-estimate table of proposed issues**, that table *is* the
breakdown: one issue per row, with its title and its point estimate. Do not re-slice it.

## Step 2 — Read the source material end to end

- **The whole design doc**, not only the section for this issue. The reasoning behind one
  issue's decisions is routinely somewhere else — Alternatives considered, Quality attributes,
  Technical debt, Dependencies.
- **Any sibling spec the design doc names as authoritative** (a locked event spec, a data
  contract, a PRD). Where that spec and the design doc disagree on *what* is built, the spec
  wins; where the design doc and the code disagree on *how*, the code wins (Step 3).
- **Sibling issues already written for the same epic.** They set the level of detail and show
  where this issue's scope stops and the next one begins.

## Step 3 — Verify everything against the code

Do not write criteria from the design doc alone. Open the files the issue will touch and
confirm, by reading them:

- Every class, method, constant, hook, filter, option, script handle and path you name exists
  and is spelled exactly right.
- The base class, registry or filter the issue extends has the shape the design doc claims.
- Who **consumes** the data the issue changes — a new key in a shared array, a new entry in a
  registry, a new item in a walk. That is what tells you which "must stay unchanged" criteria
  are real rather than imagined.
- That behavior the design doc treats as already existing actually exists.

Where the code contradicts the design doc, the code wins: write the criteria against reality and
report the discrepancy (Step 7).

## Step 4 — Lay out the issue

Follow `.github/ISSUE_TEMPLATE/feature_request.md` exactly, including the moderator notice and
the placeholder comments for the sections you are not writing:

```markdown
# <title>

## Feature Description

<prose>

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* <criterion>

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
```

**Title** — name the deliverable, not the activity. Lead with the symbol or event the issue
produces, then the scope in a short clause: `` `AudienceTile` — no-data and partially-available
states ``.

Nothing sits between the title and `## Feature Description` — no epic name, no point estimate,
no dependency line. Where the issue depends on another, that dependency is a clause inside the
Feature Description, by real GitHub issue number.

## Referencing another issue — always ask for the number

Every reference to another issue, in either section, is a real GitHub number (`#12345`). This
applies to dependencies, prerequisites, siblings in the same epic and follow-ups alike. There is
no acceptable indirect form — not "issue 5" from the design doc's ordering, not "the next issue",
not "the issue that adds the store".

**Ask the user for the number.** Never infer it from the design doc's ordering, never guess it
from a nearby issue number, and never leave a placeholder to be filled in later:

- **The issue is already in GitHub** — ask the user for its number, then confirm it is the issue
  you mean with `gh issue view <number> --json title` before citing it.
- **The issue only exists locally** — a markdown file you or the user wrote that has not been
  filed yet. Say so, and ask the user to create it in GitHub and give you the new number. Wait
  for it: a cross-reference is the one thing you cannot write around.
- **The user has no number to give** — drop the cross-reference and name the deliverable instead
  (``the store introduced with `getAudienceSettings` ``). Report the dropped reference in
  Step 7.

Work out every issue you will need to cite before you start writing, and ask for all of the
numbers in one message rather than stopping repeatedly.

## Step 5 — Write the Feature Description

This is the **only** section where rationale belongs. It answers "why does this exist, and what
problem does it solve" for someone who will never read the design doc.

- **Open with the gap.** What happens today, and where it falls short. Name the concrete thing
  that doesn't cover the case — the existing component, the class, the API behavior.
- **State what the issue adds**, in one sentence.
- **Break out the halves** when the work has more than one (server + frontend, two surfaces,
  markup + asset) using bold run-in headings.
- **Carry over the load-bearing decisions** the design doc made, and why — the constraint that
  an acceptance criterion compresses into a single line. "Why the value is stored per-user rather
  than per-site" lives here.
- **Prose paragraphs.** No bullets of criteria, no implementation instructions, no file trees.

Do **not** include:

- **Links or paths to local design docs and specs.** They don't resolve for someone reading the
  issue on GitHub. Restate the constraint in a clause instead. External links — Figma, a hosted
  doc, public vendor documentation — are fine.
- **References to sibling issues by their position in the design doc** — "issue 5", "the next
  issue", "issue 3 of this epic". The design doc's numbering is not GitHub's, and will be wrong
  the moment the issues are filed. Cite the sibling by the real GitHub number you asked the user
  for, or name its deliverable when there is no number to be had.

## Step 6 — Write the Acceptance criteria

The criteria are the contract: the Implementation Brief is written against them and the PR is
graded on them. Every criterion must be checkable by reading the diff or exercising the feature.

### Shape

- A flat list of `*` bullets. Add bold run-in group labels (`**Server**`, `**Frontend**`,
  `**Both**`) only when the issue has genuinely separate halves.
- **One outcome per bullet.** Nest a second level when a single outcome has an enumerable set of
  cases — the conditions under which a hook must not fire, the values a param may take, the
  forms excluded from a match rule.
- A **table** when a criterion enumerates a lookup that prose would obscure (each widget slug
  and the module that owns it). Inline it; never link out to it.

### Content

Each bullet states an outcome:

- **Lead with the precondition** when the behavior is conditional — "When the module is
  connected and the user has view access (#12345), …".
- **Name the real thing**: the event name, the config key, the inline-data global, the CSS
  selector, the param names, the hook, the class.
- **Give the values**: `viewContext: 'mainDashboard'`, `dateRange: 'last-28-days'`, `limit: 3`,
  a 300-second cache TTL.
- **State cardinality** when it matters: "at most once per request", "exactly once per page
  view", "exactly one of the four states".
- **Say what must stay unchanged** when the change touches shared code, naming the consumers
  that would otherwise regress.

### Keep them compact

A criterion states the outcome of implementing the brief, and nothing else. Cut:

- **Rationale.** No "because", "since", "so that", "— the same reasoning as X". If a bullet
  explains itself, the explanation belongs in the Feature Description.
- **Technique.** *How* to match, parse or store something is the brief's job. "The value falls
  back to the site default when the user setting is unset" is an outcome; "read with
  `array_key_exists()` rather than `isset()`" is a technique note — keep the outcome and its
  counter-example ("an explicit `null` is preserved"), drop the note.
- **Negative parentheticals.** No "(not an `id`)", "(not the raw response)", "rather than
  assumed to be the first entry". State what it *is*.
- **Restatements.** Name the thing once, in the bullet that defines when it happens. Never add
  a separate "the selector is named `X`" bullet, and never re-justify the name.
- **Work that isn't being done.** No "no new setting is registered", "no Storybook story is
  added", "no migration needed". Silence already says it.
- **Out-of-scope lists and known-limitation lists.** They describe what isn't built. A scope
  boundary belongs in the Feature Description, in a clause, and only when it genuinely prevents
  someone building the wrong thing.

Keep the negatives that **are** outcomes and that a test can assert: "the notification is not
rendered when …", "an unconnected module contributes nothing", "the legacy option is not
written", "the payload carries the slug and nothing else", "nothing is enqueued when the feature
flag is off".

## Step 7 — Report what did not go in the issue

Everything you decided, cut or discovered belongs in your reply to the user — not in the issue:

- **Decisions you had to make** because the design doc was silent, flagged as decisions so the
  user can overrule them.
- **Discrepancies** between the design doc and the code, with the `file:line` you checked.
- **Anything you added** beyond the design doc's scope for this issue, so the user can drop it.
- **Cross-references** — every issue number you were given and what you cited it for, any
  reference you dropped because no number was available, and any locally-written issue that still
  has to be filed before this issue's text is final.

---

## Guardrails

- **Two sections only.** Leave Implementation Brief, Test Coverage, QA Brief and Changelog entry
  as the template's placeholder comments.
- **An existing Feature Description is untouchable.** When asked to add criteria to an issue that
  already has one, read it and leave it exactly as it is unless explicitly told otherwise.
- **Don't publish.** Never run `gh issue create` or `gh issue edit`, and never post a comment,
  unless the user explicitly asks. Produce the markdown file and let them place it.
- **No local paths anywhere in either section, and no indirect issue references** — every
  cross-reference is a real GitHub number you asked the user for, never a design-doc position,
  a relative pointer or a placeholder.
- **Verify before naming.** Never reference a symbol, path or hook you have not opened.
- **One issue per unit of work.** If the source material describes more, write them as separate
  files rather than merging them.
