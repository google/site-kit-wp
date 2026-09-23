---
name: writing-plainly
description: Checks a text against the writing rules and reports each rule broken with the edit that clears it. Use when writing or editing a document, a comment, a commit message, a pull request or a reply.
---

# Checking a text against the writing rules

## Run the check

Run the script on the text. It takes a path, or the text itself on standard input. Inside a plugin the path is `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/check-text.mjs`. Where this skill is installed on its own, the same file sits in the `scripts` folder beside this one.

```
node scripts/check-text.mjs <path>
```

```
<the text> | node scripts/check-text.mjs
```

It prints one finding a line, each naming the rule and the edit that fixes it. Where nothing is broken, it says so.

Run the script rather than read it. The rules sit in the files beside it.

- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/text.mjs` has the rules, one function each.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/refused-words.mjs` has the words the plain word rule reads. Each entry has one refused word, its plain word, its source and the day it was set.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/code.mjs` turns every part of a code file that a person does not read into spaces. The rules then read a comment and a string a person sees, and nothing else. A string inside a WordPress translation call, such as `__()` or `_x()`, is never read, because design owns that copy.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/names.mjs` reads the name of the file, and the name of every folder on its path, against the same refused words.

Where no script can run, read `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/references/the-rules-a-script-decides.md` and apply each rule by hand.

## Fix what it found, then run it again

Each finding names its own fix. Make that edit and run the check again. Repeat until it reports nothing.

Never reword a finding away. A sentence rewritten to get past a rule breaks the same rule for the reader.

## The rules no script decides

Read `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/references/the-rules-a-person-decides.md` and apply each rule in it by hand. No script reports one of them.

## Check the rulebook too

Run the check on the file that states the rules, and on any instruction file of the project. A rulebook that breaks its own rule is the fault this skill exists to catch. Nothing else reads that file.

## The tests beside the scripts

- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/text-test.mjs` has one test for each rule. Each one calls the rule with a string and checks what it reports.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/code-test.mjs` has one test for each mark that opens a comment or a string in a code file, and one for each type of file.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/lib/names-test.mjs` has one test for each place a refused word can sit in a path.
- `${CLAUDE_PLUGIN_ROOT}/skills/writing-plainly/scripts/check-text-test.mjs` runs the check script itself, because the exit code is what a caller reads.

After changing a rule or a library, run every one of them.

```
node --test scripts/check-text-test.mjs scripts/lib/text-test.mjs scripts/lib/code-test.mjs scripts/lib/names-test.mjs
```

## What went wrong before

Add a line here only from a failure a real run hit.

- Cut a rule that names nothing a person can see, rather than rewording it. One such rule caught six lines in five passes and finished only when the line was cut.
- Skip the front matter before applying a rule about prose. An early `broken-paragraph` rule read the lines between the two markers and reported a fault that was not there.
- Run the test beside a rule after changing that rule. One fix skipped the first line of every file with no front matter, and only that test caught it.
