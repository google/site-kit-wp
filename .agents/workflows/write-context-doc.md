---
title: Write a context doc
description: Write or update a Site Kit convention doc in docs/context so it explains how features use and extend a system, verified against the codebase.
---

# Write a context doc

Run with `/write-context-doc <doc-path-or-system>` in the Agent chat.

The full procedure is the shared, tool-agnostic playbook
**`docs/context/workflow/write-context-doc.md`** (the single source of truth used by all of this
project's AI tools). Follow it exactly. Summary of the steps:

1. **Set the scope** — the doc and the sections the job covers. Leave unrelated sections alone,
   even when they are stale.
2. **Read the code** — every class, public method, constructor argument, default, filter,
   capability and behavior you will describe. Where the old doc and the code disagree, the code
   wins.
3. **Decide what belongs** — include what a feature needs to use the system. Leave out class
   bodies, private methods, copied defaults, bootstrap code, line numbers and history.
4. **Structure each section** — a short intro, a constructor-argument table, behavior bullets,
   the manager class in a few sentences, and real examples described in prose.
5. **Write code examples** only to show how a feature registers or uses something.
6. **Add a new doc** to the scope maps in `implement-issue.md` Step 3 and `review-pr.md` Step 3.
7. **Write in plain words**, following the rules in `write-implementation-brief.md` Step 5.
8. **Verify and report** — check every claim against the code, then report the sections you
   changed, the disagreements you found, and the stale sections you left alone.

Do not commit, push or open a PR unless explicitly asked.
