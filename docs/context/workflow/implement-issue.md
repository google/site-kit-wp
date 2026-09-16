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
  technical checkboxes; this is your primary spec).
- **Test Coverage** — between `### Test Coverage` and `## QA Brief`.
- **QA Brief** — between `## QA Brief` and `## Changelog entry`.

Note: the **Changelog entry** section is filled in by the merge reviewer at PR-merge time,
not when the issue is created — expect it to be empty and don't rely on it.

**Stop and ask the user** if: the issue can't be found, the body is empty, the section
markers are missing, or the Implementation Brief is ambiguous/contradictory. Do not guess
at requirements.

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
  **Test Coverage** items as real tests.

## Step 5 — Self-review

Before verifying, review your own diff against `review-checklist.md` (in this directory).
Fix every requirements gap and convention violation you find; address critical/high quality
issues. The bar is: all acceptance criteria met, all relevant conventions followed, tests
written and passing.

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

## Step 7 — Wrap up

Summarize what changed: files created/modified/deleted, how acceptance criteria are met,
and verification results.

---

## Guardrails

- **Local only.** Do **not** commit, push, or open a pull request unless the user explicitly
  asks. The deliverable is a working, verified local change on the feature branch.
- **No scope creep.** Implement what the brief specifies; flag anything underspecified rather
  than inventing behavior.
- **Commit messages** (only when asked to commit) must satisfy `bin/check-commit-msg.php`:
  start with a capital letter, begin with a present-tense verb, contain more than one word,
  and end with a full stop — e.g. `Track learn more about conversion tracking link.`
