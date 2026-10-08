# The human voice in Site Kit

## What this folder is for

Every text a person reads in Site Kit gets one voice, whoever or whatever wrote it. This folder holds that voice as one page per type of text. Each page says what the reader of that text does next, and gives the one rule that follows from it. It ends with one text a person corrected, from Site Kit's own history. Open the page before writing that type of text.

## The voice in three sentences

The voice is three sentences, in the words of the `human-voice` plugin's output style. That style is the instruction Claude reads at the start of every turn.

- `Name the thing, not a word near it`
- `Write what the reader needs, not the work behind it`
- `Answer the problem, not the example`

The rules under those sentences live in that plugin, in its output style and its reference files, and nowhere in this folder. Two copies of one rule move apart, so this folder holds none of them. Each page holds the one rule that is Site Kit's own for its type of text.

## The plugin behind the pages

The plugin is `human-voice`, at `.claude/skills/human-voice/` in this repository. Claude Code loads it once a person accepts the trust dialog for the repository, with nothing to install. From then on its hooks read every text a session writes there and send back each rule the text breaks. So a page is what to read before writing, and a hook is what catches a break after. These pages were written from version `0.2.0` of the plugin. If the plugin is past that version, read its output style first, at `.claude/skills/human-voice/output-styles/voice.md`. These pages do not move with the plugin.

The hooks apply the rules of one script, `.claude/skills/human-voice/skills/writing-plainly/scripts/check-text.mjs`. A person runs that script by hand, with `node` and the path of a file. The words it refuses, each with the plain word beside it, sit in one file, `.claude/skills/human-voice/skills/writing-plainly/scripts/lib/refused-words.mjs`. No other copy exists.

## The pages

Open the page for the type of text before writing it.

- `docs/context/voice/chat-reply.md`, before answering a person in the chat.
- `docs/context/voice/pull-request-comment.md`, before writing a comment on a pull request, or the body of one.
- `docs/context/voice/code-comment.md`, before writing a comment inside a code file.
- `docs/context/voice/commit-subject.md`, before writing the first line of a commit message.
- `docs/context/voice/file-and-folder-name.md`, before naming a file or a folder.
- `docs/context/voice/issue.md`, before writing an issue, its description or its `Acceptance criteria`.
- `docs/context/voice/implementation-brief.md`, before writing the `Implementation Brief` or the `Test Coverage` of an issue.
- `docs/context/voice/review.md`, before writing the review of a pull request.
