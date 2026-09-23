# human-voice

- [Every place Claude writes, and what reads it](#every-place-claude-writes-and-what-reads-it)
- [Install it for Claude Code](#install-it-for-claude-code)
- [Ship it inside a repository](#ship-it-inside-a-repository)
- [Install it where no hook runs](#install-it-where-no-hook-runs)
- [Use it](#use-it)
- [Catch a text nobody asked Claude to write](#catch-a-text-nobody-asked-claude-to-write)
- [How to turn the hooks off](#how-to-turn-the-hooks-off)
- [What it does not do](#what-it-does-not-do)
- [The second reader](#the-second-reader)
- [What it reads, and what it sends](#what-it-reads-and-what-it-sends)
- [Adding a rule](#adding-a-rule)

Claude is given the writing rules at the start of every session, and breaks them in its first sentence. The cause is how many rules it gets at once. One rule on its own was obeyed 97 times out of 100. The same rule beside five others fell to 2 times out of 100.

So this plugin splits the rules in two. A script decides every rule a script can decide. The prompt keeps only what needs a judgement. Those few rules then no longer compete with dozens a script could have decided.

## Every place Claude writes, and what reads it

| What Claude writes | What reads it | When |
| --- | --- | --- |
| A reply in the terminal | The `Stop` hook | After the reply is printed |
| A file of any type | The `PostToolUse` hook | Before it stands |
| The name of that file, and of every folder on its path | The same hook | Before it stands |
| A commit message | The `PreToolUse` hook | Before the command runs |
| A file written through the shell | The same hook | Before the command runs |
| A pull request body or comment | The same hook | Before the command runs |
| A subagent's report | The `SubagentStop` hook | Before the session sees it |
| The rulebook itself | The check, run by hand or in a job | Whenever the check runs |
| A chat reply, on any surface with no hooks | The skill, asked for | When Claude asks for it |

The reply in the terminal is the one place nothing can catch before a person reads it. The hook fires when Claude finishes, so the reader sees the first version and the correction after it.

A file written through the shell has its own row because the hook on `Write` and `Edit` never sees `cat > note.md`. So the hook on shell commands reads a heredoc going into a text file.

## Install it for Claude Code

```
/plugin marketplace add <the marketplace this plugin ships in>
/plugin install human-voice
/reload-plugins
```

The plugin starts off. A project turns it on with one line in its committed `.claude/settings.json`, under `enabledPlugins`.

```json
{
  "enabledPlugins": {
    "human-voice@google-site-kit-agents": true
  }
}
```

The part after the `@` is the name of the marketplace the plugin was installed from. That one line turns the four hooks, the output style, the skill and the three agents on together.

No hook script opens with a check of its own, and this is why. A plugin review asks every hook on a prompt or a tool call for one check. Is the project one the plugin is for? The committed settings line is that check. The plugin is off by default, git keeps the line, and Claude Code reads it before any hook starts.

## Ship it inside a repository

A repository can hold the plugin itself. Everyone who clones it then gets the plugin, with nothing to install.

Copy the whole plugin folder, with its manifest, its hooks, its output style, its skill and its agents. It goes into `.claude/skills/` of that repository, under the name `human-voice`. The test cases under `evals/` can stay out of the copy. Run this from the root of that repository.

```
cp -R <the plugin folder> .claude/skills/human-voice
```

Claude Code loads the folder as `human-voice@skills-dir` on the next session, once a person has accepted the trust dialog for that repository. That takes no marketplace and no install command. The four hooks, the output style, the skill and the three agents all load with it.

The route has two costs. It loads only for a session started in the folder whose `.claude/skills/` holds it, and not for a session started in a subfolder. On a machine where the plugin is also installed from a marketplace under the same name, the installed one wins. The copy does not load, and `claude plugin list` says so.

The copy is a snapshot at the version its manifest names. Copy the folder again when that version moves.

## Install it where no hook runs

claude.ai and its mobile app run no hooks at all, so nothing fires on its own there. The skill at `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/` has the same rules and the same script, and Claude asks for it when the work is writing.

A skill does not sync between surfaces. Each one takes its own copy of the skill folder, and the plugin is the one source they all come from.

- **claude.ai.** Upload the folder under Customize, then Skills. An owner can add it for a whole organisation instead.
- **The API.** Upload the folder with `POST /v1/skills`, then name it in the `container` parameter of a request. It needs the code execution tool.
- **Claude Code.** The plugin already ships it. Nothing to upload.

## Use it

Check one file.

```
node "${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/check-text.mjs" path/to/file.md
```

A file that breaks nothing gets one line.

```
check-text: path/to/file.md breaks no rule this check reads.
```

Check a text that is never saved, such as a commit message.

```
git log -1 --format=%B | node "${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/check-text.mjs"
```

Check the rulebook against its own rules.

```
node "${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/check-text.mjs" "${CLAUDE_PLUGIN_ROOT}/output-styles/voice.md"
```

## Catch a text nobody asked Claude to write

A person writes a commit message too, and no hook fires for that. A git hook reads it with the same script.

```
printf '#!/bin/sh\nnode "$CLAUDE_PLUGIN_ROOT/skills/writing-plainly/scripts/check-text.mjs" "$1"\n' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

A continuous integration job reads every text in the change with the same script, given a list of paths.

## How to turn the hooks off

Turn the plugin off for one project by setting its line to `false`. Removing the line turns it off too, where no other settings file turns it on.

```json
{
  "enabledPlugins": {
    "human-voice@google-site-kit-agents": false
  }
}
```

Turn them off everywhere by turning the plugin off.

```
/plugin disable human-voice
/reload-plugins
```

The output style sets `force-for-plugin`. It applies while the plugin is on, and it overrides the output style setting of the session. Turning the plugin off gives that setting back.

## What it does not do

No script judges a voice. Whether a sentence reads as a person wrote it stays a question for a person. Those rules sit in the output style.

## The second reader

Three agent files under `agents/` are the second reader, one for each sentence of the voice. Each judges its sentence in a fresh context. `names-the-thing` judges `Name the thing, not a word near it`. `writes-what-the-reader-needs` judges `Write what the reader needs, not the work behind it`. `answers-the-problem` judges `Answer the problem, not the example`.

A skill or a test starts one by name, as `human-voice:names-the-thing`. It gives one text, or two marked A and B, as paths or inside the prompt. With one text the agent answers `pass`, `fail` or `unknown`. With two it answers `A`, `B` or `neither`. Every answer quotes the words that decided it, with their line, and gives one sentence why. The agent changes nothing. They run in the tests rather than on every write, because a second reader is one more model call on every text.

## What it reads, and what it sends

It reads five things.

- A file Claude saves.
- The reply Claude writes.
- The text inside a shell command.
- A subagent's report.
- Any text given to the check on standard input.

Inside a code file it reads a comment and a string a person sees, and nothing else. A string inside a WordPress translation call, such as `__()` or `_x()`, is never read, because design owns that copy.

It makes no network call. It reads no file outside the path it was given.

## Adding a rule

A rule enters the script only after a reviewer makes the same complaint twice, and the rule has a link to that complaint. A rule added with no failure behind it makes every rule already there less likely to be followed.
