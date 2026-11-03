---
name: write-in-the-voice
description: >
  Opens the page of the Site Kit voice rulebook under docs/context/voice/ for the type of text being written, and follows it. Use when writing any text a person reads in the google/site-kit-wp repo. The types are an issue, an implementation brief, a review and a pull request comment. They are also a code comment, a commit subject, a file or folder name and a chat reply. Use when asked to word a comment, to name a file or a folder, to reply to a reviewer or to write plainly. A request that calls for it is "write the PR comment for this change", "word this comment" or "reply to the review on #12345". Not for the steps of a workflow, which its own playbook under docs/context/workflow/ gives.
allowed-tools: Read
---

# Write a text in the Site Kit voice

Write every text a person reads by the voice rulebook under `docs/context/voice/`, which is written for no one tool. This skill restates none of it. The rulebook has one page per type of text, and each page gives one real Site Kit example.

## Procedure

1. **Read the overview** `docs/context/voice/README.md` first. It gives the three sentences of the voice, and lists every page with one line on when to open it.
2. **Open the page for the type of text being written**, and follow it. The pages are:
   - `docs/context/voice/chat-reply.md` for a chat reply.
   - `docs/context/voice/pull-request-comment.md` for a pull request comment.
   - `docs/context/voice/code-comment.md` for a code comment.
   - `docs/context/voice/commit-subject.md` for a commit subject.
   - `docs/context/voice/file-and-folder-name.md` for a file or folder name.
   - `docs/context/voice/issue.md` for an issue.
   - `docs/context/voice/implementation-brief.md` for an implementation brief.
   - `docs/context/voice/review.md` for a review.
3. **Write the text as the page says.** Where one request writes texts of two types, such as a commit subject and its pull request comment, open both pages.
4. **Where no page covers the type, follow the README.** Its three sentences are the rule for every type of text the rulebook has no page for.

## Important

- **Read the page before writing.** The `human-voice` plugin's hooks read every text as it is written and send back each rule it breaks. So the hook catches a break after the text is written, and the page is what stops one before. The plugin lives at `.claude/skills/human-voice/` in this repository.
- **Copy no rule into this skill or into a page.** The plugin holds the rules, and the rulebook holds Site Kit's pages and examples. A second copy here moves apart from the plugin's.
- **Open the page for the type being written, and not every page.** A page for another type costs context and changes nothing in this text.
