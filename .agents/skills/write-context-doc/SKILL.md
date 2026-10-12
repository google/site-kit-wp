---
name: write-context-doc
description: >
  Write or update a Site Kit convention doc in docs/context/js/ or docs/context/php/ so it
  explains how features use and extend a system instead of copying internal code. Use when the
  user asks to write, add, update, rewrite, or clean up a context doc or one of its sections
  (e.g. "document the new prompts system in docs/context", "rewrite the Notices section of
  admin-features.md", "update the context doc for this change") in the google/site-kit-wp repo.
argument-hint: "[doc-path-or-system]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Write a context doc

Write or update the context doc for **$ARGUMENTS** — a path under `docs/context/`, a section
name, or the system to document. If you were given none of these, ask which doc or system before
doing anything else. Do not reimplement the procedure here — read and follow the playbook, which
is the single source of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/write-context-doc.md` and follow every step.
2. **Set the scope**: the doc and the sections the job covers. Leave unrelated sections alone,
   even when they are stale.
3. **Read the code** for every class, argument, default, filter, capability and behavior you
   will describe. Where the old doc and the code disagree, the code wins.
4. **Write the sections** in the playbook's structure: a short intro, a constructor-argument
   table, behavior bullets, a short registration example, and real examples described in prose.
5. **Register a new doc** in the scope maps in `implement-issue.md` Step 3 and `review-pr.md`
   Step 3.
6. **Report** the sections you changed, each place where the old doc and the code disagreed,
   and the stale sections you left for a separate task.

## Important

- **Usage, not implementation.** No class bodies, private methods, copied defaults, bootstrap
  code or line numbers. Code examples only show how a feature registers or uses something.
- **Verify before naming.** Never describe a symbol or behavior you have not read in the code.
- **Don't commit.** Do not commit, push or open a PR unless the user explicitly asks.
