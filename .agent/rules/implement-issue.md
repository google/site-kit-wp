---
description: Applies when the user asks to implement, build, or work on a Site Kit GitHub issue by number — routes to the shared implementation playbook.
trigger: model_decision
---

# Implementing a GitHub issue

> Set this rule's activation mode to **Model Decision** in the Antigravity Rules panel (the
> `trigger` above is a hint; the mode is configured in the UI).

When the user asks to implement, build, or work on a GitHub issue / feature by number in the
**google/site-kit-wp** repo, follow the shared, tool-agnostic playbook
**`docs/context/workflow/implement-issue.md`** and review against
**`docs/context/workflow/review-checklist.md`**. Read only the `docs/context/{js,php}`
convention docs the issue touches.

Key guardrails: co-locate tests and Storybook stories; run lint, the specific test
files touched, and `npm run build:dev`; and **never commit, push, or open a PR
unless explicitly asked**.

For a full end-to-end run, prefer the `/implement-issue` workflow.
