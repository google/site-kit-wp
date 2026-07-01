# Antigravity configuration

This directory holds Google Antigravity adapters that point at the shared, tool-agnostic
playbook in `docs/context/workflow/`. Antigravity also reads the repo-root `AGENTS.md`
natively for always-on context.

- `workflows/implement-issue.md` — an on-demand workflow, run with `/implement-issue` in the
  Agent chat.
- `rules/implement-issue.md` — a rule meant to run in **Model Decision** mode so it
  auto-applies when the user asks to implement an issue.
- `workflows/review-pr.md` — an on-demand workflow, run with `/review-pr` in the Agent chat.
- `rules/review-pr.md` — a rule meant to run in **Model Decision** mode so it auto-applies
  when the user asks to review a pull request.

> ⚠️ **Verify the folder path in-product.** Antigravity's workspace rules/workflows directory
> has been reported as both `.agent/` and `.agents/`, and the Rules/Workflows panels show the
> exact path they write to. If your build uses a different location, move these files there
> (their _content_ is correct regardless of path) and delete this directory. Set each rule's
> activation mode to **Model Decision** in the Rules panel — the mode is configured in the UI,
> not the file.
