# Implementing a GitHub Issue — Playbook

This is the **single source of truth** for implementing a GitHub issue in Site Kit by
Google. Every AI coding tool (Gemini CLI, Antigravity, Claude Code) points at this file
through a thin per-tool adapter, so the procedure stays identical everywhere. When you
update the process, update it **here** — not in the adapters.

The convention details themselves live in `docs/context/js/` and `docs/context/php/`.
This playbook tells you _what to do and in what order_; those docs tell you _how the code
must look_. Read only the convention docs relevant to the issue (see the map in Step 3).

---

## Step 1 — Fetch and parse the issue

Fetch the issue from `google/site-kit-wp` (e.g. `gh issue view <number> --json title,body,labels`,
or the GitHub MCP issue tools).

Site Kit issues follow `.github/ISSUE_TEMPLATE/feature_request.md`. Extract these sections
verbatim:

- **Feature Description** — the problem / publisher need.
- **Acceptance criteria** — between `## Acceptance criteria` and `## Implementation Brief`.
- **Implementation Brief** — between `## Implementation Brief` and `### Test Coverage` (the
  technical checkboxes; your plan of work).
- **Test Coverage** — between `### Test Coverage` and `## QA Brief`.
- **QA Brief** — between `## QA Brief` and `## Changelog entry`.

Note: the **Changelog entry** section is filled in by the merge reviewer at PR-merge time,
not when the issue is created — expect it to be empty and don't rely on it.

**The acceptance criteria are the contract; the Implementation Brief is one route to satisfying
them.** Read both before you write any code, and where the two disagree the criteria win — the
brief is drafted first and the criteria keep moving through review, so the brief is the half that
goes stale. The brief also leaves user-facing copy and observable behavior to the criteria on
purpose rather than quoting them, so a heading, label or error message you cannot find in the
brief is in the criteria, not missing. Where a criterion and a brief bullet genuinely cannot both
be satisfied, stop and ask.

**Stop and ask the user** if: the issue can't be found, the body is empty, the section
markers are missing, or the Implementation Brief is ambiguous/contradictory. Do not guess
at requirements.

## Read every issue this one references — before writing any code

Site Kit issues lean on their siblings: a brief says `(added in #12950)` for the store it
builds on, `(see #13005)` for the extension point it leaves open, "the create variant is
#13022" for the half that isn't yours. Those references carry requirements that the issue
in front of you does not repeat.

Collect every issue referenced anywhere in the Feature Description, Acceptance criteria,
Implementation Brief and Test Coverage — `#12345`, a full `github.com/google/site-kit-wp/issues/…`
URL, the parent epic, and anything GitHub lists as linked — and read each one with
`gh issue view <number> --json title,body,state,url` **before** you start implementing. From
each, take:

- **What it delivered**, when it is closed — the classes, selectors, hooks and constants your
  brief expects to already be there. Confirm they exist in the branch you are on; a closed
  issue whose PR has not been merged into your base leaves you building on nothing.
- **What it will deliver**, when it is still open — the work that is *not* yours. Stop at that
  boundary rather than implementing it, and don't duplicate a symbol it is going to add.
- **Its acceptance criteria**, where they constrain yours — a shared payload shape, a naming
  scheme, an ordering guarantee. Where a referenced issue and your brief disagree, the code
  wins if it is already written; otherwise ask.

Read the referenced issues themselves, not their references — follow a second hop only when
the first leaves a requirement genuinely unclear.

**Stop and ask the user** if: a referenced issue can't be fetched; your brief depends on work
that a referenced issue has not landed yet; or the issue refers to a sibling **indirectly**
("the next issue", "issue 5", "the issue that adds the store") rather than by number — ask for
the real number instead of guessing which issue is meant.

## Step 2 — Determine scope

Classify the work and identify the affected module:

- **JS-only** / **PHP-only** / **full-stack**.
- Which module? JS lives in `assets/js/`, PHP in `includes/`.

Study an existing, similar feature before writing anything — match its structure and idioms.

## Step 3 — Load the relevant convention docs

Read **only** what the issue touches. Map:

**JavaScript (`docs/context/js/`)**

| If the issue involves… | Read |
| --- | --- |
| React components, PropTypes, imports, file headers | `component-conventions.md` |
| Module file layout / placement | `module-architecture.md` |
| `@wordpress/data` stores, selectors, resolvers, actions | `state-management.md` |
| Custom hooks | `hooks.md` |
| Reusable utilities | `utils.md` |
| Dashboard widgets (context/area/widget) | `widgets.md` |
| Notifications / banners | `notifications.md` |
| Feature tours | `feature-tours.md` |
| Feature flags | `feature-flags.md` |
| `trackEvent` / `trackEventOnce` | `event-tracking.md` |
| JSDoc on utilities/hooks | `jsdoc.md` |
| Storybook stories | `storybook.md` |
| Jest tests | `tests.md` |

**PHP (`docs/context/php/`)**

| If the issue involves… | Read |
| --- | --- |
| A module class / lifecycle / interfaces | `module-architecture.md` |
| Class/method/file naming | `naming-conventions.md` |
| Constructor DI | `dependency-injection.md` |
| The `Context` service | `context-pattern.md` |
| Settings / module settings | `settings-management.md` |
| `Options` / `User_Options` / `Transients` | `storage-patterns.md` |
| REST routes | `rest-api.md` |
| Traits / horizontal reuse | `trait-composition.md` |
| Script/stylesheet registration | `asset-management.md` |
| Admin screens / notices / pointers | `admin-features.md` |
| Prompts & dismissals | `prompts-and-dismissals.md` |
| PHPUnit integration tests | `phpunit.md` |

## Step 4 — Implement

Follow the conventions you loaded in Step 3. In addition:

- **Co-locate tests.** Add `*.test.js` / `*.test.ts` / `*.test.tsx` next to each
  JS or Typescript source file; add `*Test.php` under the mirroring path in
  `tests/phpunit/integration/`.
- **Storybook.** Add a `*.stories.js` or `*.stories.tsx` next to any new UI component (and update VRT
  references where relevant — see Storybook docs).
- **Styles.** Put SCSS under `assets/sass/`.
- **Feature flags.** Gate not-yet-shippable work behind a flag in `feature-flags.json`
  (see `docs/context/js/feature-flags.md`).
- Cover every Implementation Brief checkbox and Acceptance criterion. Implement the
  **Test Coverage** items as real tests. A brief bullet that says to migrate or replace
  something is done only when the old version is gone: every place that used the old code
  uses the new code, and the old selectors and the PHP code behind them are removed.
- **Reuse before you write.** Before adding a helper, a test helper, a mock or a
  `jest.mock()` factory, search `assets/js` and `tests/js` for a line of its
  code. If it already exists, use it (add an option to it when you need one). If you
  are about to write the same function in a second file, move it into a shared module
  instead (`tests/js/*-utils`, or the feature's `test-utils`). A test helper calls the
  production function that builds the same values instead of building them by hand. Test
  data (fixtures, expected values, URLs) is written directly in each test, even when it
  repeats.
- **One rule, one check.** When a criterion applies in more than one place (for example
  view and edit mode), every place uses the same selector or helper.
- **Fix lint errors instead of disabling the rule.** Don't add `eslint-disable` (or
  `phpcs:ignore`) to make lint pass. For `complexity`, move part of the logic into a helper function.

### Removing or replacing code

When the brief removes a component, flag, feature or caller, the removal also covers what it
leaves behind:

- Grep every removed symbol, CSS class, flag name, event label and component name across
  `assets/`, `includes/`, `tests/` and `storybook/`, including comments and
  docblocks. Update or remove each result.
- For every function that loses a caller, check whether its parameters, options or branches
  are still used by anyone else. Remove the ones that only the deleted code used, with their
  test cases.
- **Before deleting a test file, check whether the code it covers still exists somewhere
  else** (for example a similar file, or the component that replaces it). If it does, move the
  relevant tests next to that code instead of deleting them.
- Remove styles, VRT references and fixtures that only the deleted code used.

## Step 5 — Self-review

Before verifying, review your own diff against `review-checklist.md` (in this directory).
Fix every requirements gap and convention violation you find; address critical/high quality
issues. The bar is: all acceptance criteria met, all relevant conventions followed, tests
written and passing.

Read every comment and docblock that your diff adds or touches against the code under it.
Each one must be true of that code: numbers and limits match the code, a claim about another
part of the codebase is checked in that code, and a hard-coded number keeps the comment that
says where it comes from. Fix docblocks that your change made out of date, including ones
outside the diff.

## Step 6 — Verify

Run, and fix anything that fails:

- **Lint** — prefer scoping to the files you touched over the whole codebase:
  - JS: `npm run lint:js:files -- <path/to/file.js>` (auto-fix the full codebase with
    `npm run lint:js-fix`, or just your files with
    `npm run lint:js:files -- --fix <path/to/file.js>`).
  - PHP: `composer lint -- <path/to/File.php>` (auto-fix with `composer lint-fix`).
- **Build** — `npm run build:dev` when JS/asset changes are non-trivial.
- **Tests** — run the **specific** test files you touched, not the whole suite:
  - JS: `npm -w tests/js run test:js -- <path/to/file.test.js>`
  - PHP: `composer test -- --filter <TestClassName>`
- **Visual check (any change that affects rendering)** — for SCSS, layout, spacing,
  alignment, or responsive rules, **render the change and look at it** before declaring it
  done. Lint and build passing do **not** prove visual correctness, and a change that looks
  like a trivial value tweak in the brief can still be visually wrong. Prefer the Storybook
  story at the affected viewport(s); if no dev server is running, build a throwaway HTML
  reproduction using the **real computed values** (typography from
  `assets/sass/components/global/_googlesitekit-typography.scss`, breakpoints/sizes from
  `assets/sass/config/`) and open it in the browser. For responsive / `@media` changes,
  check **both sides** of every breakpoint you touch (`$bp-tablet` = 600px): a mobile-only
  rule is invisible at desktop width, and the default VRT run is desktop-only so it will
  not exercise it. Re-check the exact state described in the issue (e.g. the badge *next to
  the title*, not just the component in isolation).
- **VRT** — if you added/changed a Storybook story, check just that scenario rather than
  the full suite (`npm run test:visualtest` wraps nested `npm run` calls and won't forward
  extra CLI args, so call the script directly):
  `./tests/backstop/bin/backstop test --filter="<scenario label>"`.
  - A story sets every value the component reads for the state it shows (settings,
    including a new setting with a default, module data, user data). A value that isn't set
    usually shows a loading or empty state instead of the intended one.
  - After `approve`, **open every new or changed reference image** and confirm it shows the
    state the story names. An approved image of the wrong state keeps passing VRT.
  - If `develop` changed shared components, typography or global styles after you made the
    references, generate them again before the merge. Otherwise the out-of-date references
    fail VRT on every other branch once yours is merged.

## Step 7 — Wrap up

Summarize what changed: files created/modified/deleted, how acceptance criteria are met,
and verification results. Also list:

- each Implementation Brief bullet with the `file:line` that implements it;
- every place where the code differs from the brief, and why;
- every change outside the issue's scope (a refactor, a fix to shared code, a config
  change), and why it is needed here.

These lists are the PR's "Relevant technical choices"; a change that you cannot explain there
belongs in a separate issue.

---

## Guardrails

- **Local only.** Do **not** commit, push, or open a pull request unless the user explicitly
  asks. The deliverable is a working, verified local change on the feature branch.
- **No scope creep.** Implement what the brief specifies; flag anything underspecified rather
  than inventing behavior. A referenced issue is context, never a work item — never implement
  a sibling's brief because your issue mentions it.
- **Commit messages** (only when asked to commit) must satisfy `bin/check-commit-msg.php`:
  start with a capital letter, begin with a present-tense verb, contain more than one word,
  and end with a full stop — e.g. `Track learn more about conversion tracking link.`
