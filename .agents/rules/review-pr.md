---
description: Applies when the user asks to review a Site Kit GitHub pull request by number — routes to the shared PR review playbook.
trigger: model_decision
---

# Reviewing a pull request

> Set this rule's activation mode to **Model Decision** in the Antigravity Rules panel (the
> `trigger` above is a hint; the mode is configured in the UI).

When the user asks to review, critique, or give feedback on a pull request by number in the
**google/site-kit-wp** repo, follow the shared, tool-agnostic playbook
**`docs/context/workflow/review-pr.md`** and grade against
**`docs/context/workflow/review-checklist.md`**. Read only the `docs/context/{js,php}`
convention docs the PR touches.

Key points: read the issue the PR links under "Addresses issue:" and check the diff against its
acceptance criteria and Implementation Brief first; cite the context file + section for every
deviation; and stay **read-only** — do not post comments, approve, or change the PR state
unless explicitly asked.

For a full end-to-end run, prefer the `/review-pr` workflow.
