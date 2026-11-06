# Review Checklist — Conventions & Quality

The shared rubric for judging a Site Kit change against project conventions. Used by the
self-review step of the `implement-issue` skill and by the `review-pr` skill. Check only the areas
the change actually touches.

Authoritative convention details live in `docs/context/js/` and `docs/context/php/` — cite
the file + section when flagging a violation.

A rule written in those docs wins over what the surrounding code does. Code that breaks a rule is
not a precedent, even when several neighbouring files do the same; the same bar applies to a
self-review. A finding about a convention the docs don't state needs evidence that it is one,
such as how most of the codebase does it, not a single example.

---

## 1. Requirements adherence

- Every **Acceptance criterion** is met.
- Every **Implementation Brief** checkbox is implemented.
- Every **Test Coverage** item exists as a real, passing test.
- Edge cases named in the issue are handled. No required behavior is missing.
- An Implementation Brief bullet point that migrates or replaces something leaves no old copy
  behind: every place that used the old code uses the new code, and the old code is
  removed.
- A removal leaves nothing behind: no reference to a removed symbol, class, flag or
  component (comments included), no parameter or branch that only the removed code used,
  and no deleted test whose code still exists elsewhere (those tests move instead).
- A criterion that applies in several places (for example view and edit mode) uses the
  same check in each of them.

## 2. Convention adherence

**JavaScript** (see `docs/context/js/`)

- **Import order** — external → WordPress → internal, with comment separators (`component-conventions.md`).
- **Component conventions** — PropTypes, named exports, license file header (`component-conventions.md`).
- **JSDoc** — file header present; utilities/hooks documented with `@since`/`@param`/`@return` (`jsdoc.md`). Code that is moved or
  renamed keeps its docblock and its original `@since`, with an extra `@since n.e.x.t` line that
  says what changed.
- **State management** — correct `@wordpress/data` selectors/resolvers/actions; no direct store mutation (`state-management.md`).
- **Module architecture** — files placed per module structure (`module-architecture.md`).
- **Hooks** — global hooks in `assets/js/hooks/`; `use` prefix (`hooks.md`).
- **Utils** — shared helpers in `assets/js/util/`, not inlined (`utils.md`).
- **Widgets** — correct context/area registration and component structure (`widgets.md`).
- **Notifications** — correct area, priority, dismissal (`notifications.md`).
- **Feature flags** — defined in `feature-flags.json`; gated via the documented helper (`feature-flags.md`).
- **Feature tours** — required fields (slug, version, contexts, gaEventCategory); correct steps (`feature-tours.md`).
- **Event tracking** — correct `trackEvent`/`trackEventOnce` category/label usage (`event-tracking.md`).
- **Storybook** — stories present for new/changed UI components (`storybook.md`).
- **Tests** — co-located; registry-mocking pattern; no real network calls; every added or
  changed test title starts with "should"; every negative assertion can fail, and each test
  protects something no other test does (`tests.md`).
- **Test helpers** — existing helpers and mocks are reused; no function or `jest.mock()`
  factory is copied into a second file; values that production code builds (for example
  report options) come from the production function, not written out by hand. Test data is
  still written directly in each test (`tests.md`).

**PHP** (see `docs/context/php/`)

- **Naming** — PascalCase classes, snake_case methods, file names match class names (`naming-conventions.md`).
- **Dependency injection** — `Context` injected first; dependencies via constructor (`dependency-injection.md`).
- **Module architecture** — correct interfaces, lifecycle, trait usage (`module-architecture.md`).
- **REST API** — route registered via filter; permission callbacks; schema validation (`rest-api.md`).
- **Settings** — extends the correct base; `get_default()` implemented; sanitization (`settings-management.md`).
- **Storage** — uses `Options`/`User_Options`/`Transients`, not raw WP functions (`storage-patterns.md`).
- **Trait composition** — traits for horizontal reuse, not deep inheritance (`trait-composition.md`).
- **Asset management** — assets registered via the module interface, not hardcoded enqueues (`asset-management.md`).
- **Prompts & dismissals** — correct system used and stored (`prompts-and-dismissals.md`).
- **Tests** — integration tests (not unit mocks); correct test traits/fakes (`phpunit.md`).

## 3. Code quality

- **Design** — before reviewing line by line, check whether a design with clearly fewer parts
  meets the same acceptance criteria (for example one shared check that every path goes through,
  instead of one per path). Raise that first; it changes what the rest of the review is about.
- Structure & readability; targeted changes (no gratuitous refactors).
- Error handling and edge cases.
- **Security** — XSS, capability checks, nonce verification, no direct SQL, input sanitization.
- **Performance** — no needless re-renders, missing memoization, expensive selectors, N+1 queries, or large asset bloat.
- **Documentation** — complex logic and all exports documented. Every added or touched
  comment explains why the code is the way it is, avoids details that go out of date (such
  as specific counts), and any fact it states is true. Docblocks made out of date by the
  change are updated.
- **Disabled lint rules** — no new `eslint-disable` / `phpcs:ignore` added to make a check
  pass; `complexity` is fixed by extracting a helper. A rule disabled anyway has explicit
  approval and a reason in the PR.
- **Scope** — every change outside the issue's scope is explained in the PR's "Relevant
  technical choices".
- Accessibility and backward compatibility where relevant.

## 4. Verification

- Lint passes — for the full suite: `npm run lint:js` / `composer lint`; scoped to the
  changed files: `npm run lint:js:files -- <path...>` / `composer lint -- <path...>`.
- Relevant tests were **actually executed** and pass.
- Build succeeds for non-trivial asset changes (`npm run build:dev`).
- Any change that affects rendering (SCSS, layout, spacing, alignment) is **visually
  verified on the rendered result**, not inferred from lint/build passing or from reading
  the diff. Verify the exact state the issue describes (the element in its real context,
  e.g. badge *next to the title*), not just the component in isolation.
- Responsive / `@media` changes are checked on **both sides** of each breakpoint they
  touch (breakpoint variables such as `$bp-tablet` are defined in
  `assets/sass/config/_variables.scss`). A rule gated below a breakpoint is verified at a width
  below it.
- For UI changes, add/update Storybook stories and the corresponding VRT reference images (run
  `npm run test:visualtest -- --grep "<story label>"` to check just that story, and
  `npm run test:visualapprove -- --grep "<story label>"` to accept the new images; see
  `tests/vrt/README.md`). Stories set every value the component reads for their state, and
  every new or changed reference image was opened and shows the state its story names.
- A change that shows data (a tile, widget, chart, PDF or email section) is checked with real
  data, not only with fixtures: rates stay between 0% and 100%, shares add up to at most 100%,
  and a value shown in several places is the same in each. Matching an existing view only proves
  both are the same, not that they are right, so reusing an existing builder or selector does
  not skip this check.

---

## Scoring rubric (for tools that gate on a score)

| Score | Meaning |
| --- | --- |
| 0.0–0.5 | An acceptance criterion is unmet, a convention is violated, a critical security/correctness issue exists, or tests are missing/failing/not executed. |
| 0.5–0.84 | Works but below standard — multiple issues, or incomplete tests/docs. |
| 0.85–0.94 | All requirements met, all relevant conventions followed, clean code, tests executed and passing, well documented. **Approval threshold.** |
| 0.95–1.0 | Exceeds standards — exemplary code, exceptional coverage and documentation. |

When reporting violations, for each one state: the principle, the context file + section that
defines it, how the code violates it, the fix required, and the affected files.
