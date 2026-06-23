---
name: implement-issue
description: >
  Implement a Site Kit GitHub issue end-to-end from its implementation brief. Use when the
  user asks to implement, build, or work on a GitHub issue / feature by number (e.g.
  "implement issue #12345", "build the feature in issue 12345", "follow the implementation
  brief for #12345") in the google/site-kit-wp repo.
argument-hint: "[issue-number]"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Implement a GitHub issue

Implement GitHub issue **#$ARGUMENTS** (if no number was given, ask for one) by following the
project's shared playbook. Do not reimplement the procedure here — read and follow the
playbook, which is the single source of truth shared with the other AI tools.

## Procedure

1. **Read the playbook** `docs/context/workflow/implement-issue.md` and follow every step:
   fetch & parse the issue, determine scope, load only the relevant `docs/context/{js,php}`
   convention docs (per the map in the playbook), branch off `develop`, implement with
   co-located tests/stories, self-review, and verify.
2. **Fetch the issue**: `gh issue view $ARGUMENTS --json title,body,labels`. Stop and ask the
   user if the issue is missing, empty, or the Implementation Brief is ambiguous.
3. **Self-review** your diff against `docs/context/workflow/review-checklist.md` and fix gaps
   before finishing.
4. **Verify** with the exact commands in the playbook (lint, targeted tests, build).

## Important

- **Local only**: never commit, push, or open a PR unless the user explicitly asks.
- Run only the **specific** test files you touched (`npm -w tests/js run test:js -- <path>`),
  not the whole suite.
- The convention details are in `docs/context/{js,php}/` — read what the issue touches, not
  everything.
