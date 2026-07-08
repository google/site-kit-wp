# Antigravity configuration

This directory holds Google Antigravity adapters that point at the shared, tool-agnostic
playbook in `docs/context/workflow/`. Antigravity also reads the repo-root `AGENTS.md`
natively for always-on context.

- `workflows/implement-issue.md` — an on-demand workflow, run with `/implement-issue` in the
  Agent chat.
- `skills/implement-issue/SKILL.md` — a skill Antigravity can pick automatically when the
  user asks to implement an issue.
- `workflows/review-pr.md` — an on-demand workflow, run with `/review-pr` in the Agent chat.
- `skills/review-pr/SKILL.md` — a skill Antigravity can pick automatically when the user
  asks to review a pull request.
