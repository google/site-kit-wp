# Site Kit by Google — Code Review Style Guide

Site Kit is a mature, heavily reviewed WordPress plugin with strong CI (ESLint, Prettier, PHPCS, PHPStan, Jest, PHPUnit, and visual regression).
Formatting and style are already enforced by tooling — do not duplicate them.

## Defer to the project's context documentation

Before flagging anything related to conventions, naming, documentation, state management, data loading, or architecture, consult the project's context docs and defer to them.
They describe how this codebase is intentionally built:

JavaScript (`docs/context/js/`):

- `state-management.md` — Redux-style data stores, selectors, resolvers, and the data-loading lifecycle.
- `component-conventions.md` — React component structure and conventions.
- `hooks.md` — custom hooks and usage patterns.
- `jsdoc.md` — required JSDoc format and `@since` tagging.
- `module-architecture.md` — module registration and structure.
- `widgets.md` — the widget API and registration.
- `utils.md` — shared utilities.
- `feature-flags.md`, `feature-tours.md` — feature gating and tours.
- `notifications.md`, `event-tracking.md` — notifications and analytics events.
- `tests.md`, `storybook.md` — JS test and Storybook conventions.

PHP (`docs/context/php/`):

- `naming-conventions.md` — class, method, hook, and file naming.
- `dependency-injection.md`, `context-pattern.md` — DI and the Context object.
- `module-architecture.md`, `trait-composition.md` — module and trait structure.
- `storage-patterns.md`, `settings-management.md` — options and settings storage.
- `rest-api.md` — REST route registration and conventions.
- `asset-management.md`, `admin-features.md`, `prompts-and-dismissals.md` — assets, admin, and prompts.
- `phpunit.md` — PHP test conventions.

If a suggestion would contradict one of these docs, do not make it.

## Avoid speculative runtime guards

Do not suggest adding defensive null/undefined/falsy guards when the value is already safe by construction.
In particular, do **not** flag a value as possibly-undefined when:

- it is typed as non-nullable in TypeScript, or
- it has a destructuring default (e.g. `{ foo = '' }`), or
- it is produced by a data-store selector/resolver or data loader that already guarantees resolution before use (see `state-management.md`).

Trust the type system and the data-loading lifecycle.
Treating type-guaranteed or loader-guaranteed values as untrusted at runtime produces unreachable, rejected suggestions.

## Review only the actual change

Review the diff and its real call sites.
Do not invent requirements, hypothesize feature variants, or request plumbing for use cases that are not present in the changeset.
If a concern depends on an assumption about how the code is called, verify it against the actual call sites before raising it — and assign severity based on demonstrated impact, not on a speculative scenario.

## Consolidate repeated findings — but account for every instance

When the same issue appears in multiple locations, post a single consolidated comment instead of repeating it on each occurrence.
In that comment, explicitly list **every** affected location as a `path:line` reference (or permalink) so each instance is individually accounted for and actionable.
Never silently aggregate — a reader must be able to find and fix all occurrences from the one comment.

## User-facing copy comes from design

Treat user-facing strings and i18n copy as authored against design (Figma) and product decisions.
Do not suggest wording, tone, or capitalization changes to display strings.

## Respect the minimum supported versions

Site Kit supports **WordPress 5.2+** and **PHP 7.4+** (see `readme.txt` and the `google-site-kit.php` header).
Code must run on those minimums, so flag usage of anything introduced in a later version unless it is properly feature-detected, version-gated, or polyfilled.

Watch in particular for:

- PHP language features newer than 7.4 — e.g. enums, `match`, named arguments, constructor property promotion, nullsafe `?->`, or 8.0+ standard-library functions (`str_contains`, `str_starts_with`, etc.).
- WordPress functions, hooks, classes, or arguments introduced after 5.2 used without a `function_exists()`/`method_exists()` guard, a version check, or a bundled polyfill.
- JavaScript or browser APIs that fall outside the project's supported targets without the appropriate polyfill or transpilation.

Automated tooling (e.g. PHPCS compatibility checks) covers some of this but does not catch everything, so call out version-range risks even when CI is green — especially indirect cases like a newer function reached through a wrapper or passed as a callback.

## What to prioritize

Focus review effort where it has historically been most valuable on this project:

- **Framework-API correctness**, especially Gutenberg Block API details (e.g. props no longer passed to `Edit` in API v2/v3, `supports` flags that silently drop attributes).
- **Cross-file duplication / DRY** — identical logic that should be extracted into a shared helper, trait, or utility.
- **Concrete PHP and CSS correctness** — e.g. `??` vs `?:` to avoid undefined-key warnings, direct array access on options that may be missing, redundant or conflicting style declarations.
- **Security** — capability checks, nonce verification, input sanitization, and output escaping, consistent with WordPress and project conventions.
