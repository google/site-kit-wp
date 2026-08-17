# Writing an Implementation Brief — Playbook

This is the **single source of truth** for writing the **Implementation Brief** and **Test
Coverage** sections of a Site Kit issue. Every AI coding tool (Gemini CLI, Antigravity, Claude
Code) points at this file through a thin per-tool adapter, so the procedure stays identical
everywhere. When you update the process, update it **here** — not in the adapters.

The brief you write is the spec that `implement-issue.md` executes and `review-pr.md` grades
against. Write it so an engineer who has never read the design doc can implement the issue from
the brief plus the codebase alone.

---

## Step 1 — Read the issue

The issue comes to you one of two ways, and only the user can tell you which:

- **An issue number** — fetch it with `gh issue view <number> --json title,body,labels`.
- **A path to a local issue file** — read that path. Do not go looking for it: such a file has no
  fixed home, so the user must give you the path.

If the user gave you **neither** a number nor a path, ask for one before doing anything else.

Parse whichever you get using the section map in `implement-issue.md` Step 1.

You are writing exactly two sections:

- **Implementation Brief** — between `## Implementation Brief` and `### Test Coverage`.
- **Test Coverage** — between `### Test Coverage` and `## QA Brief`.

The **Acceptance criteria** are the contract, and they describe observable behavior only: what a
tester can see by using the feature. The mechanism that produces that behavior is the brief's to
specify, so expect to add detail the criteria do not carry. Everything in the brief must serve a
criterion, and the brief may not add behavior a user or a tester would notice that no criterion
asks for.

**Stop and ask the user** if the acceptance criteria are missing, ambiguous, or contradict each
other. A brief written over guessed criteria is worse than no brief. Writing the criteria is a
separate job with its own playbook, `write-issue.md` — offer it rather than filling the gap here.

Feature Description and Acceptance criteria sit under a "managed by moderators only" notice in
the issue template — do not edit them. QA Brief and Changelog entry are filled in later by other
roles; leave them alone unless asked.

## Step 2 — Read the source material

- **The design doc.** It carries the rationale, the rejected alternatives, and the constraints
  that an acceptance criterion compresses into a single line, so read it whenever one exists.
  Use it when the issue links one or the user gives you a path; otherwise **ask the user for
  it** — if you already have to ask for the issue itself (Step 1), ask for both at once. Plenty
  of issues have no design doc: when the answer is "there isn't one", say so and write the brief
  from the acceptance criteria and the code. Never stall on a design doc, and never invent a
  path to one.
- **Sibling issues in the same epic** — they tell you where this issue's scope stops and the
  next one begins. Ask the user for their numbers so you can cross-reference them (see
  *Referencing another issue*, below).

## Step 3 — Verify everything against the code

Do not write a brief from the issue text alone. Open every file the brief will touch and
confirm, by reading it:

- Every class, method, constant, hook, filter, option and script handle you name exists and is
  spelled exactly right.
- The pattern you tell someone to follow (e.g. "mirror `X::register_script()`") actually looks
  the way you describe.
- Hook ordering and firing conditions, whenever the brief depends on them — trace the hook to
  its `do_action()` / `apply_filters()` call site rather than trusting the design doc.
- Which existing tests, fixtures, snapshots or inline data the change will move.
- **That the build can compile the kind of file you are about to name.** Open the build config
  that will include the new file, plus the lint config and `tsconfig.json`. A bundle can define
  its own rules instead of using the shared `createRules()`:
  `assets/webpack/frontendModules.config.js` defines a `babel-loader` rule that matches `.js`
  only, so the first `.ts` file in that bundle needs a new rule, and adding that rule is part of
  the brief. Check the globals the new file reads in the same pass: `_googlesitekit` has no
  declaration in `assets/js/types/globals.d.ts`, so a TypeScript file that reads it fails
  `npm run typecheck` until a declaration is added.

Where the code contradicts the design doc, the code wins: write the brief against reality and
report the discrepancy (Step 7).

## Step 4 — Load the relevant convention docs

Read **only** what the issue touches, using the scope map in `implement-issue.md` Step 3. The
brief should not restate those conventions — it should be written so that following it produces
conforming code.

## Referencing another issue — always ask for the number

Every reference to another issue is a real GitHub number (`#12345`) — prerequisites, siblings in
the same epic, the extension point this brief leaves open, the follow-up that lands the rest.
There is no acceptable indirect form: not "issue 5" from a design doc's ordering, not "the next
issue", not "the issue that adds the datastore".

**Ask the user for the number.** Never infer it from a design doc's ordering, never guess it from
a nearby issue number, and never leave a placeholder to be filled in later:

- **The issue is already in GitHub** — ask the user for its number, then confirm it is the issue
  you mean with `gh issue view <number> --json title` before citing it.
- **The issue only exists locally** — a markdown file that has not been filed yet. Say so, and
  ask the user to create it in GitHub and give you the new number. Wait for it: a cross-reference
  is the one thing you cannot write around.
- **The user has no number to give** — drop the cross-reference and name the deliverable instead
  (``the store introduced with `getAudienceSettings` ``). Report the dropped reference in Step 7.

Work out every issue you will need to cite before you start writing, and ask for all of the
numbers in one message — together with the issue and design doc you already have to ask for
(Steps 1 and 2) — rather than stopping repeatedly.

## Step 5 — Write the Implementation Brief

### Structure

**Group by path.** Every group is headed by the path it changes; the changes hang off it as
nested bullets. Two shapes are in use — pick one and stay consistent within an issue:

```
* [ ] In `path/to/File.php`:
  * <one change per bullet>
  * <one change per bullet>
```

```
In `path/to/directory/` (new directory):

* [ ] <one change per bullet>
* [ ] <one change per bullet>
```

A group can be headed by a file, a directory, or a path plus a parenthetical note —
`(new file)`, `(new directory)`, ``(new file, combined into the store in `index.js`)``. Order
the groups the way someone would work through them: shared/base changes, then new classes, then
registration, then build config, then components, with SCSS last.

Nest a third level when one bullet covers several related behaviors, ending the parent in a
colon:

```
  * Submit behavior:
    * <on click>
    * <on success>
    * <on failure>
```

### Content

**Write in plain, simple words — this matters more than anything else in this section.** The
brief is read by people: the engineer who implements it, the reviewer who grades the PR against
it, and a moderator who has never read the design doc. Many of them do not speak English as a
first language. Every sentence must be clear on the first reading:

- **Use the simplest word that is still accurate.** Short sentences. One idea per sentence. No
  decoration, no "notably", "crucially", "simply", "of course", "elegant", "robust".
- **No idioms, metaphors, or cultural references.** Not "standard furniture", "dead weight",
  "burns the flag", "under the hood", "out of the box", "for free", "a natural no-op". Write what
  actually happens instead: "the listener finds no matching elements, so it does nothing".
- **Explain a technical term the first time you use it, or do not use it.** "the value lands in
  an opaque `pathname`" says nothing to the reader. "`hostname` is empty and the whole recipient
  stays in `pathname` as one unsplit string with no leading slash — `tel:+15551234567` gives
  `pathname` `+15551234567`" says all of it.
- **Finish every sentence.** "`https://notwa.me/1555` must not classify" leaves out *as what*.
  Write "…is not a contact link, so nothing is emitted".
- **Name who does what to what.** "the classifier short-circuits `outbound_link_click`" can be
  read in two opposite directions. "when a link is classified as a contact link, the listener
  emits `contact_link_click` and returns, so the outbound handler never receives that anchor"
  can be read in only one.
- **List the members of any set you name.** If you write "an allowlist", "the excluded hosts",
  "the usual guards", write out what is in it, inline. A set the reader has to guess at is the
  same as no set at all.

Read each bullet once more before you finish, and rewrite every sentence that needs a second
reading. This applies to your reply to the user (Step 7) as much as to the issue text.

**Say what to do, and nothing else.** Every bullet is an instruction. Leave a genuine
implementation choice open rather than inventing a detail, but never leave the implementer to
search for something the codebase has already decided.

**Name the real thing.** Wherever a symbol already exists, name it exactly:

- classes, methods, hooks, filters, constants, script handles, datapoint names (`GET:ctas`);
- datastore selectors and actions with their signature
  (`getCTAs( { organizationID, publicationID } )`), and the form/store constants they use;
- components to reuse (`SpinnerButton`, `ProgressBar`, `Notice`), their props (`helperText`),
  and CSS class names (`mdc-text-field--error`);
- inline-data globals and keys (`wpPrivacyURL` on `_googlesitekitBaseData`);
- user-facing strings, quoted verbatim — headings, descriptions, CTA labels, error text.

**Spell out every name you invent.** A brief names things that do not exist yet: constants, config
keys, event params, methods, variables, types. Write each of them in full words — no abbreviations,
no truncations, no initials. `readThresholdPct` and `readMinSeconds` each cost the reader a guess:
what does `Pct` stand for, and is `Min` "minutes" or "minimum"? `readTimeThresholdPercent` and
`minimumReadTimeSeconds` cost nothing and can only be read one way. The short forms that stay are
the ones already used across the codebase (`ID`, `URL`, `HTML`) and any existing name, which you
copy exactly as it is. See `docs/context/php/naming-conventions.md`.

**Point at an exemplar instead of describing one.** "following the pattern in
`includes/Modules/Analytics_4/Datapoints/`", "following `publications.js`", "following how
`Analytics_4` registers `POST:create-audience`". One reference beats a paragraph of description.

**Cross-reference sibling issues inline** wherever the work meets theirs — `(added in #12950)`,
`(see #13005)`, "the create variant is #13022". Use it for prerequisites the brief depends on
and for extension points it deliberately leaves open. Every number comes from the user, never
from your own inference — see *Referencing another issue*, above.

**Fence the scope in one line** when an adjacent concern could reasonably be pulled in: "No
express-flow routing/gating changes in this step." "The live API wiring lands in the API
integration work." "Keep shared stepper/layout styles untouched."

**For UI work**, reference the design (a Figma node link, or "per the design") rather than
restating measurements, and spell out the interaction states: what disables the CTA, the pending
state, what happens on success, what renders on error. Name the SCSS partial to create or extend
and the index file to import it into.

Do **not** include:

- **Rationale.** No "because", no "this keeps X out of Y", no trade-off discussion, no
  restatement of a decision's benefits. The design doc and the acceptance criteria hold the
  *why*; the brief holds the *what*.
- **Work that isn't needed.** No "no Storybook changes required", "no migration needed", "no new
  settings". Silence already says that.
- **Routine commands.** No lint, build, test or VRT invocations — `implement-issue.md` Step 6
  owns verification, and every engineer already knows to build. Mention a command only when it
  is unusual and specific to this issue.
- **Links to local design docs.** They don't resolve for someone reading the issue on GitHub;
  restate the constraint in one clause instead. External links — Figma, a hosted design doc —
  are fine.
- **Plain-text line numbers.** No `includes/Core/Modules/Modules.php:212`, no "see line 212", no
  `file:line` anywhere in the two sections. The number is wrong as soon as anyone edits the file,
  and a reader on GitHub cannot click it. When a bullet has to point at an exact place in the
  code, use a GitHub permalink instead — a URL pinned to a commit SHA, with the line or range on
  the end:
  `https://github.com/google/site-kit-wp/blob/<commit SHA>/includes/Core/Modules/Modules.php#L212-L218`.
  Get one by opening the file on GitHub and pressing `y`, or with
  `gh browse --no-browser --commit=<commit SHA> <path>` and adding the `#L<start>-L<end>` yourself.
  A URL built on a branch name (`/blob/main/`, `/blob/develop/`) is **not** a permalink — it points
  at different lines next week — so never use one. Naming the symbol is still better than linking
  to it: link only when there is no name to give, such as an unnamed block inside a long function.
- **Restated acceptance criteria**, a recap of the Feature Description, or background on how the
  existing system works.
- Prose paragraphs.

Do include, when they apply:

- **The right extension on every new frontend file.** New files on the JavaScript side are
  written in TypeScript: `.ts`, or `.tsx` when the file returns JSX, with co-located tests as
  `.test.ts` / `.test.tsx`. Never ask for a new `.js` or `.jsx` file. Name the types the new file
  exports the same way you name any other symbol — the union of allowed values, the interface a
  table row must match, the function signature with its return type
  (`classifyContactLink( anchor: HTMLAnchorElement ): ContactLinkType | null`). An existing `.js`
  file that the issue only edits stays as it is, unless the issue asks for a rename.
- The concrete shape of any data the change publishes — array keys, JSON payload, inline-script
  global, selector signature.
- The exact insertion point when ordering matters: hook priority, array position, above or below
  an early return.
- Changes to existing files that the acceptance criteria imply but do not name.

## Step 6 — Write the Test Coverage

Keep it short — a handful of bullets, not a test plan. Two shapes, both in use:

```
* Add tests for `<source file>` covering:
  * <case>
  * <case>

* JS tests in `<file>.test.ts` covering the `<name>` action and the `<name>` selector.
```

- One bullet per test file or area, with the cases nested under it. Name the test file when it
  exists or its name follows from the source: co-located next to the source — `*.test.ts` /
  `*.test.tsx` for every new test file, `*.test.js` only when you are adding cases to a JavaScript
  test file that already exists — and `*Test.php` under the mirroring path in
  `tests/phpunit/integration/`.
- Phrase each case as the behavior or outcome, not the mechanics — "the privacy policy field
  falls back to the WordPress privacy policy URL when the publication value is missing", not
  "mock the store and assert the input value".
- Cover every acceptance criterion at least once, including the negative cases: precondition
  unmet, feature disabled, invalid input, empty or error response.
- **Storybook stories belong here, not in the brief.** "Add a Story for `<Component>`", or list
  the states when there is more than one: "(default, loading, error)".
- Name any new fixture, fake or mock the coverage needs, and the directory it belongs in.
- Call out **existing** tests the change will break, so the work is budgeted rather than
  discovered mid-implementation — "Fix any failing tests/snapshots" when the blast radius isn't
  knowable up front.
- No commands.

## Step 7 — Report what did not go in the brief

Everything you cut for brevity, and everything you learned while verifying, belongs in your
reply to the user — not in the issue:

- Discrepancies between the design doc and the code, with the `file:line` you checked.
- Consequences the acceptance criteria did not anticipate: a metric that will shift, a default
  that changes for every install, an existing test that will start failing.
- Anything you left as an open decision, and the assumption the brief is written under.
- Every issue number you were given and what you cited it for, any cross-reference you dropped
  because no number was available, and any locally-written issue that still has to be filed
  before the brief's text is final.

---

## Guardrails

- **Write only the two sections.** Leave Feature Description, Acceptance criteria, QA Brief and
  Changelog entry untouched.
- **Plain, simple words.** No idioms, no metaphors, no unexplained jargon, no half sentences.
  Name who does what to what, and list the members of every set you name — see Step 5.
- **New frontend files are TypeScript.** `.ts` / `.tsx` sources, `.test.ts` / `.test.tsx` tests,
  and a build-config change whenever the bundle cannot compile them yet.
- **Names are full words.** Every constant, key, param, method and type the brief invents is
  spelled out — no `Pct`, no `Min`, no initials — see Step 5.
- **Don't publish.** Do not edit the GitHub issue or post a comment unless the user explicitly
  asks. Produce the text — or update the local issue file you were given — and let them place it.
- **Don't expand scope.** If a change looks necessary but no acceptance criterion covers it,
  raise it in Step 7 instead of adding it silently.
- **No indirect issue references.** Every cross-reference is a real GitHub number you asked the
  user for, never a design-doc position, a relative pointer or a placeholder.
- **No plain-text line numbers.** Every pointer into the code is a GitHub permalink pinned to a
  commit SHA, never `path/to/File.php:212` and never a `/blob/<branch>/` URL — see Step 5.
- **Verify before naming.** Never reference a symbol, path or hook you have not opened.
