Review GitHub PR #$ARGUMENTS for the site-kit-wp project with a comprehensive analysis.

## Step 1 — Fetch PR data

Run these in parallel:
- `gh pr view $ARGUMENTS --json number,title,body,author,baseRefName,headRefName,files,additions,deletions,commits`
- `gh pr diff $ARGUMENTS`

## Step 2 — Read project principles

Read ALL of the following docs to ground your review in project conventions:

**JavaScript:**
- @docs/context/js/component-conventions.md
- @docs/context/js/event-tracking.md
- @docs/context/js/feature-flags.md
- @docs/context/js/feature-tours.md
- @docs/context/js/hooks.md
- @docs/context/js/jsdoc.md
- @docs/context/js/module-architecture.md
- @docs/context/js/notifications.md
- @docs/context/js/state-management.md
- @docs/context/js/storybook.md
- @docs/context/js/tests.md
- @docs/context/js/utils.md
- @docs/context/js/widgets.md

**PHP:**
- @docs/context/php/admin-features.md
- @docs/context/php/asset-management.md
- @docs/context/php/context-pattern.md
- @docs/context/php/dependency-injection.md
- @docs/context/php/module-architecture.md
- @docs/context/php/naming-conventions.md
- @docs/context/php/phpunit.md
- @docs/context/php/prompts-and-dismissals.md
- @docs/context/php/rest-api.md
- @docs/context/php/settings-management.md
- @docs/context/php/storage-patterns.md
- @docs/context/php/trait-composition.md

## Step 3 — Inspect changed files

For any non-trivial changed file (not auto-generated, not lock files), read the full file for context around the changed lines. Focus on files where the diff alone is insufficient to judge correctness.

## Step 4 — Produce the review

Structure your output as follows. Only include sections that are relevant to this PR — omit sections with nothing to report.

---

### PR #$ARGUMENTS — [title]

**Author**: [author] | **Branch**: `[head]` → `[base]` | **Size**: +[additions] / -[deletions]

#### Summary
One paragraph describing what this PR does and what areas it touches.

---

#### Principles Compliance

For each principle area that applies to files in this PR, report:

**[Area Name]** ✅ / ⚠️ / ❌
- List specific findings with file:line references. ✅ = follows conventions, ⚠️ = minor deviation, ❌ = violation.

Areas to check (only those touched by the PR):

- **Import order** — external → WordPress → internal, with comment separators
- **Component conventions** — PropTypes, named exports, file headers with license
- **JSDoc** — file-level header present, utility functions documented
- **State management** — correct use of `@wordpress/data` selectors/resolvers/actions, no direct store mutations
- **Module architecture** — JS and PHP module structure, correct file placement
- **Hooks** — custom hooks in correct location (`/assets/js/hooks/` for global), naming (`use` prefix)
- **Utils** — utility functions in `/assets/js/util/`, not inlined in components
- **Widgets** — correct area/context registration, widget component structure
- **Notifications** — correct use of notification areas, priority, and dismissal
- **Feature flags** — flags defined in `feature-flags.json`, correct `isFeatureEnabled()` usage
- **Feature tours** — required fields (slug, version, contexts, gaEventCategory), correct step structure
- **Event tracking** — `trackEvent()` / `trackEventOnce()` usage, correct category/label patterns
- **Storybook** — stories present for new/modified components when required
- **JS tests** — test files co-located, registry mocking pattern, no real network calls
- **PHP naming conventions** — PascalCase classes, snake_case methods, file names match class names
- **PHP dependency injection** — Context injected first, dependencies via constructor
- **PHP module architecture** — correct interface implementation, trait usage
- **PHP REST API** — route registration via filter, permission callbacks, schema validation
- **PHP settings** — extends correct base class, `get_default_value()` implemented
- **PHP storage** — uses `Options`/`User_Options`/`Transients` abstractions, not direct WP functions
- **PHP trait composition** — traits used for horizontal reuse, not deep inheritance
- **PHP asset management** — assets registered via module interface, not hardcoded enqueues
- **PHP tests** — integration tests (not unit mocks), correct use of test traits and fakes

---

#### Code Quality Issues

List bugs, logic errors, edge cases, or correctness problems not covered by principles above. Include file:line references.

#### Security Concerns

Flag any XSS, capability checks, nonce verification, direct SQL, or data sanitization issues.

#### Performance

Note any unnecessary re-renders, missing memoization, expensive selectors, N+1 queries, or large asset impacts.

#### Test Coverage

Identify changed logic that lacks test coverage or where existing tests were not updated to cover new behavior.

#### Minor / Nits

Optional: style, naming, or documentation improvements that don't affect correctness.

---

#### Verdict

**APPROVE** / **REQUEST CHANGES** / **NEEDS DISCUSSION**

Brief justification. If requesting changes, list the blocking issues as a numbered checklist.
