# Writing an Implementation Brief — Playbook

Single source of truth for writing the **Implementation Brief** and **Test Coverage** sections of
a Site Kit issue. Every AI coding tool (Gemini CLI, Antigravity, Claude Code) points at this file
through a thin per-tool adapter, so the procedure stays identical everywhere. Update the process
**here** — not in the adapters.

`implement-issue.md` executes the brief you write; `review-pr.md` grades against it. Write it so
an engineer who has never read the design doc can implement the issue from the brief plus the
codebase alone.

---

## Step 1 — Read the issue

The issue comes to you one of two ways:

- **An issue number** — fetch it with `gh issue view <number> --json title,body,labels`.
- **A path to a local issue file** — read that path. Do not go looking for it; the user must give
  you the path.

If you were given neither, ask before doing anything else. Parse whichever you get using the
section map in `implement-issue.md` Step 1.

You are writing exactly two sections: **Implementation Brief** (between `## Implementation Brief`
and `### Test Coverage`) and **Test Coverage** (between `### Test Coverage` and `## QA Brief`).

The Acceptance criteria are the contract and describe observable behavior only — the mechanism
that produces it is the brief's to specify, so expect to add detail the criteria don't carry. Every
line in the brief must serve a criterion; the brief may not add behavior a user or tester would
notice that no criterion asks for.

**Stop and ask the user** if the acceptance criteria are missing, ambiguous, or contradict each
other — a brief written over guessed criteria is worse than no brief. Writing criteria is
`write-issue.md`'s job; offer it rather than filling the gap here.

Feature Description and Acceptance criteria sit under a "managed by moderators only" notice — do
not edit them. QA Brief and Changelog entry are filled in later by other roles — leave them alone
unless asked.

## Step 2 — Read the source material

- **The design doc** — carries the rationale, rejected alternatives, and constraints an acceptance
  criterion compresses into one line. Use the one the issue links or a path the user gives you;
  otherwise ask for it (bundle with the Step 1 ask if you're already asking). Plenty of issues
  have none — if the answer is "there isn't one", say so and write from the criteria and the code.
  Never stall on a design doc, and never invent a path to one.
- **Sibling issues in the same epic** — they show where this issue's scope stops and the next
  begins. Ask the user for their numbers so you can cross-reference them (see *Referencing another
  issue*, below).

## Step 3 — Verify everything against the code

Do not write a brief from the issue text alone. Open every file the brief will touch and confirm:

- Every class, method, constant, hook, filter, option and script handle you name exists and is
  spelled exactly right.
- The pattern you point to (e.g. "mirror `X::register_script()`") actually looks the way you
  describe.
- Hook ordering and firing conditions the brief depends on — trace the hook to its `do_action()` /
  `apply_filters()` call site rather than trusting the design doc.
- Which existing tests, fixtures, snapshots or inline data the change will move.
- **That the build can compile the kind of file you're about to name.** Open the build config that
  will include the new file, plus the lint config and `tsconfig.json` — a bundle can define its
  own rules instead of the shared `createRules()`: `assets/webpack/frontendModules.config.js`'s
  `babel-loader` rule matches `.js` only, so a bundle's first `.ts` file needs a new rule, and
  adding it is part of the brief. Check the globals the new file reads too — `_googlesitekit` has
  no declaration in `assets/js/types/globals.d.ts`, so a TypeScript file reading it fails
  `npm run typecheck` until a declaration is added.

Where the code contradicts the design doc, the code wins: write against reality and report the
discrepancy (Step 7).

## Step 4 — Load the relevant convention docs

Read **only** what the issue touches, using the scope map in `implement-issue.md` Step 3. The
brief shouldn't restate those conventions — write it so that following it produces conforming
code.

## Referencing another issue — always ask for the number

Every reference to another issue — prerequisite, sibling, extension point, follow-up — is a real
GitHub number (`#12345`). There is no acceptable indirect form: not "issue 5", not "the next
issue", not "the issue that adds the datastore".

**Ask the user for the number.** Never infer it from a design doc's ordering, and never leave a
placeholder:

- **Already in GitHub** — ask for the number, then confirm it's the issue you mean with
  `gh issue view <number> --json title` before citing it.
- **Only exists locally** — a markdown file not yet filed. Say so, and ask the user to file it and
  give you the new number. Wait for it: a cross-reference is the one thing you can't write around.
- **No number to give** — drop the cross-reference and name the deliverable instead (``the store
  introduced with `getAudienceSettings` ``). Report the drop in Step 7.

Work out every issue you'll need to cite before you start writing, and ask for all the numbers in
one message — together with the issue and design doc you already have to ask for (Steps 1–2).

## Step 5 — Write the Implementation Brief

### Structure

**Group by path.** Every group is headed by the path it changes, with the changes as nested
bullets. Two shapes are in use — pick one and stay consistent within an issue:

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

A group heading can carry a parenthetical note — `(new file)`, `(new directory)`, ``(new file,
combined into the store in `index.js`)``. Order the groups the way someone would work through
them: shared/base changes, then new classes, then registration, then build config, then
components, with SCSS last.

Nest a third level when one bullet covers several related behaviors, ending the parent in a colon
(e.g. "Submit behavior:" → on click / on success / on failure).

### Content

**Write in plain, simple words — this matters more than anything else here.** The brief is read by
the engineer implementing it, the reviewer grading the PR, and a moderator who's never read the
design doc — many don't speak English as a first language:

- Use the simplest word that's still accurate. Short sentences, one idea each. No decoration.
- No idioms or cultural references — write what actually happens ("the listener finds no matching
  elements, so it does nothing", not "a natural no-op").
- Explain a technical term the first time you use it, or don't use it.
- Finish every sentence and name who does what to what — "when a link is classified as a contact
  link, the listener emits `contact_link_click` and returns, so the outbound handler never
  receives that anchor" can be read only one way.
- List the members of any set you name. A "usual guards" nobody can see is no guard at all.

Reread each bullet once and rewrite anything that needs a second reading. The same applies to your
reply (Step 7).

**Say what to do, and nothing else.** Every bullet is an instruction. Leave a genuine
implementation choice open rather than inventing a detail, but never leave the implementer to
search for something the codebase has already decided.

**Name the real thing** wherever a symbol already exists: classes, methods, hooks, filters,
constants, script handles, datapoint names (`GET:ctas`); datastore selectors/actions with their
signature (`getCTAs( { organizationID, publicationID } )`); components to reuse
(`SpinnerButton`), their props (`helperText`), and CSS class names (`mdc-text-field--error`);
inline-data globals and keys (`wpPrivacyURL` on `_googlesitekitBaseData`); user-facing strings,
quoted verbatim.

**Spell out every name you invent** — a brief names things that don't exist yet, and each is
written in full words: `readTimeThresholdPercent` and `minimumReadTimeSeconds`, never
`readThresholdPct` or `readMinSeconds`. The short forms that stay are ones already standard in the
codebase (`ID`, `URL`, `HTML`) and any existing name, copied exactly. See
`docs/context/php/naming-conventions.md`.

**Point at an exemplar instead of describing one** — "following the pattern in
`includes/Modules/Analytics_4/Datapoints/`" beats a paragraph of description.

**Cross-reference sibling issues inline** wherever the work meets theirs — `(added in #12950)`,
`(see #13005)` — for prerequisites the brief depends on and extension points it deliberately
leaves open. Every number comes from the user (see above).

**Fence the scope in one line** when an adjacent concern could reasonably get pulled in: "No
express-flow routing/gating changes in this step."

**For UI work**, reference the design (a Figma node link, or "per the design") rather than
restating measurements, and spell out the interaction states: what disables the CTA, the pending
state, success, error. Name the SCSS partial to create or extend and the index file to import it
into.

**Leave out:**

- **Rationale.** No "because", no trade-off discussion. The design doc and criteria hold the
  *why*; the brief holds the *what*.
- **Work that isn't needed.** No "no Storybook changes required" — silence already says it.
- **Routine commands.** No lint/build/test/VRT invocations — `implement-issue.md` Step 6 owns
  verification. Mention a command only when it's unusual and specific to this issue.
- **Links to local design docs.** They don't resolve on GitHub; restate the constraint instead.
  External links (Figma, a hosted doc) are fine.
- **Plain-text line numbers.** No `File.php:212` — it goes stale the moment anyone edits the file,
  and doesn't link on GitHub. Use a permalink pinned to a commit SHA instead
  (`.../blob/<SHA>/path#L212-L218`; press `y` on the GitHub file view, or use
  `gh browse --no-browser --commit=<SHA> <path>` and add the `#L<start>-L<end>`). A `/blob/main/`
  or `/blob/develop/` URL is **not** a permalink. Naming the symbol still beats linking to it —
  link only when there's no name to give.
- **Restated acceptance criteria**, a Feature Description recap, or background on how the existing
  system works. Prose paragraphs.

**Do include, when they apply:**

- **The right extension on every new frontend file** — `.ts`, or `.tsx` when it returns JSX, with
  co-located `.test.ts` / `.test.tsx`. Never a new `.js` or `.jsx`. Name exported types the same
  way you name any other symbol, including the function's return type
  (`classifyContactLink( anchor: HTMLAnchorElement ): ContactLinkType | null`). An existing `.js`
  file the issue only edits stays as it is, unless the issue asks for a rename.
- The concrete shape of any data the change publishes — array keys, JSON payload, inline-script
  global, selector signature.
- The exact insertion point when ordering matters — hook priority, array position, above or below
  an early return.
- Changes to existing files the acceptance criteria imply but don't name.

## Step 6 — Write the Test Coverage

Keep it short — a handful of bullets, not a test plan:

```
* Add tests for `<source file>` covering:
  * <case>
  * <case>

* JS tests in `<file>.test.ts` covering the `<name>` action and the `<name>` selector.
```

- One bullet per test file or area, cases nested under it. Name the test file when it exists or
  its name follows from the source: co-located `*.test.ts` / `*.test.tsx` for every new test file,
  `*.test.js` only when adding cases to a JS test file that already exists, `*Test.php` under the
  mirroring path in `tests/phpunit/integration/`.
- Phrase each case as the behavior or outcome, not the mechanics — "the privacy policy field falls
  back to the WordPress privacy policy URL when the publication value is missing", not "mock the
  store and assert the input value".
- Cover every acceptance criterion at least once, including negatives: precondition unmet, feature
  disabled, invalid, empty or error input.
- **Storybook stories belong here, not the brief** — "Add a Story for `<Component>`", or list the
  states when there's more than one: "(default, loading, error)".
- Name any new fixture, fake or mock the coverage needs, and the directory it belongs in.
- Call out **existing** tests the change will break, so the work is budgeted rather than
  discovered mid-implementation.
- No commands.

## Step 7 — Report what did not go in the brief

In your reply to the user, not the issue:

- Discrepancies between the design doc and the code, with the `file:line` you checked.
- Consequences the acceptance criteria didn't anticipate: a metric that will shift, a default that
  changes for every install, an existing test that will start failing.
- Anything you left as an open decision, and the assumption the brief is written under.
- Every issue number you were given and what you cited it for, any cross-reference you dropped for
  lack of a number, and any locally-written issue that still needs to be filed.

---

## Guardrails

- **Write only the two sections.** Leave Feature Description, Acceptance criteria, QA Brief and
  Changelog entry untouched.
- **Plain, simple words.** No idioms, no unexplained jargon, no half sentences. List the members
  of every set you name.
- **New frontend files are TypeScript.** `.ts` / `.tsx` sources, `.test.ts` / `.test.tsx` tests,
  and a build-config change whenever the bundle can't compile them yet.
- **Names are full words.** Every constant, key, param, method and type the brief invents is
  spelled out — no abbreviations, no initials.
- **Don't publish.** Do not edit the GitHub issue or post a comment unless the user explicitly
  asks.
- **Don't expand scope.** If a change looks necessary but no criterion covers it, raise it in
  Step 7 instead of adding it silently.
- **No indirect issue references.** Every cross-reference is a real GitHub number.
- **No plain-text line numbers.** Every code pointer is a GitHub permalink pinned to a commit SHA.
- **Verify before naming.** Never reference a symbol, path or hook you haven't opened.
