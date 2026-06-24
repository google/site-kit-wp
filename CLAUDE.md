# CLAUDE.md

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. The shared, tool-agnostic project context
lives in `AGENTS.md`; the import below pulls it in so Claude Code and the other AI tools
share one source of truth.

@AGENTS.md

## Implementing a GitHub issue

When asked to implement, build, or work on a GitHub issue by number, the **`implement-issue`**
skill activates automatically (or invoke `/implement-issue <number>`). Both it and the
equivalents for the other tools follow the single shared playbook:

- Procedure: `docs/context/workflow/implement-issue.md`
- Review rubric: `docs/context/workflow/review-checklist.md`
- Convention reference (read only what the issue touches): `docs/context/js/`, `docs/context/php/`

## Reviewing a pull request

When asked to review a pull request by number, the **`review-pr`** skill activates
automatically (or invoke `/review-pr <number>`). It follows the single shared playbook:

- Procedure: `docs/context/workflow/review-pr.md`
- Review rubric: `docs/context/workflow/review-checklist.md`
- Convention reference (read only what the PR touches): `docs/context/js/`, `docs/context/php/`

## Working notes for Claude Code

- **Local only.** Do not commit, push, or open a PR unless explicitly asked. When committing
  is requested, commit messages must pass `bin/check-commit-msg.php` (capital first letter,
  present-tense verb, more than one word, ends with a full stop).
- **Tests.** Run the specific test files you touched — `npm -w tests/js run test:js -- <path>`
  for JS, `composer test -- --filter <TestClassName>` for PHP — not the whole suite.
- `.claude/settings.local.json` already allows `gh`, `git`, and `npm` commands.
