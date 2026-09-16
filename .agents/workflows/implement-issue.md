---
title: Implement a GitHub issue
description: Implement a Site Kit GitHub issue end-to-end from its implementation brief, following the project's shared playbook and conventions.
---

# Implement a GitHub issue

Run with `/implement-issue <issue-number>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/implement-issue.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Fetch & parse** the issue from `google/site-kit-wp` and extract the Acceptance criteria,
   Implementation Brief, Test Coverage, and QA Brief (the Changelog entry section is filled
   in later by the merge reviewer, so it's typically empty at this point). Stop and ask if the
   issue is missing/empty or the brief is ambiguous.
2. **Determine scope** (JS-only / PHP-only / full-stack) and the affected module.
3. **Load only** the relevant `docs/context/{js,php}` convention docs (use the map in the
   playbook).
4. **Implement** with co-located tests and Storybook stories; cover every acceptance criterion
   and Test Coverage item.
5. **Self-review** against `docs/context/workflow/review-checklist.md` and fix gaps.
6. **Verify**: lint, the specific test files you touched, and `npm run build:dev`.

**Local only** — do not commit, push, or open a PR unless explicitly asked.
