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
doing anything else.

A context doc explains how a feature uses or extends one system: its public API, its arguments,
its filters and actions, its rules, and the behavior to expect. AI tools load these docs before
they change code (Step 3 of the `implement-issue` skill) and cite them when they review a PR
(the `review-pr` skill). Write each doc so a reader can use the system correctly without reading
its implementation first.

**Aim for an evergreen doc**, where practical: one that stays true until the system's contract
changes, not until the next refactor. Describe what is stable, such as the public API, the
extension points and the rules. For a detail that changes often, name the constant, file or class
that holds it instead of repeating its value. A useful test for each sentence: would it still be
true after a refactor that keeps the public API the same? If not, prefer a stable wording when it
serves the reader just as well. Keep a coupled detail when the reader needs it to act, such as an
exact command or the values an argument accepts, and say where it comes from so the next writer
can check it.

A context doc is **not** a copy of the code. Copied class bodies and private methods go stale
with the next refactor, and a stale doc teaches the wrong thing with full confidence.

## Step 1 — Set the scope

Work out which doc and which sections the job covers:

- **A change to a documented system.** Update only the sections for the system the change
  touches. Find them with the scope map in `.agents/skills/implement-issue/SKILL.md` Step 3.
- **A new system with no doc.** Decide whether it belongs in an existing doc or needs a new file
  (see Step 6).
- **A rewrite of stale sections.** Rewrite the sections the user named.

Do not rewrite unrelated sections in the same change, even when they are stale. Many docs still
copy internal code. List the stale sections you found in your report (Step 8) and suggest a
separate task for them.

## Step 2 — Read the code

Do not write from the old doc, the issue, or memory. Open the source of every class you will
describe and confirm, by reading it:

- every class, public method, constant, filter, action, option and script handle you name, and
  its exact spelling;
- every constructor argument, its type and its default;
- every capability check, and the `Permissions` constant it uses;
- every hook a feature uses, traced to its `apply_filters()` / `do_action()` call site, with the
  arguments it passes and when it fires;
- the callers of each public method, so you know which methods other features actually use;
- the real features that use the system, so you can point at one as an example.

Where the old doc and the code disagree, the code wins. Note each disagreement for your report.

## Step 3 — Decide what belongs in the doc

Ask of every fact: **does a feature that uses this system need to know it?** If yes, it belongs.
If it only describes how the system works inside, leave it out.

Include, when it applies:

- **What the system is for**, and how a feature uses it, in one or two sentences.
- **The public API**: the class a feature creates, its constructor arguments, and the public
  methods other features call.
- **Extension points**: each filter or action, what a callback receives, and what it must return.
- **Rules**: when something is active, which capability it needs, where it runs (site admin,
  network admin, front end), and any registration order other code depends on.
- **Behavior to expect**, especially behavior that surprises people. For example: "Site Kit
  removes all admin notices from its own screens, including its own."
- **What does not exist**, when readers keep guessing it. For example: "There is no filter for
  screens." Keep this to facts about the current code.
- **Where to look**: the path of each class, and of one real feature that uses the system well.

Leave out:

- class bodies, private and protected methods, and private properties;
- copies of constructor default arrays (put each default in the argument table instead);
- registration code copied from `Plugin.php` or another bootstrap file;
- lists that copy data from the code and change often, such as every registered screen or every
  asset handle, unless the list itself is the API;
- values copied from the code, such as a breakpoint width, a cache lifetime or a limit, when
  naming the constant or variable that holds the value tells the reader enough;
- line numbers and `file:line` references;
- history: what the code used to do, or what an earlier version of the doc said wrongly.

## Step 4 — Structure each section

Use this shape for a system, and leave out the parts that do not apply:

```
## <System name>

### <Class name>

**Location**: `path/to/Class.php`

<One or two sentences: what it represents, and how a feature creates and registers it.>

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `name` | string | Required. <What it does.> |
| `other` | callable | <What it does. What the callable receives.> Default <value>. |

#### <Behavior heading, e.g. Activation and Dismissal>

- <One rule or behavior per bullet.>

### <Manager class name>

**Location**: `path/to/Manager.php`

<A few sentences: what it collects, from which filter, and what it does with it. Say whether
feature code ever calls it directly.>

### Adding a <thing>

<One short example of the registration a feature writes.>

### <Thing> Examples

#### <Real feature>

**Location**: `path/to/Feature.php`

<A few sentences on what it does and which arguments it relies on.>
```

- Put each argument's default and "Required" in its table row, not in a code block.
- Write behavior as bullets: one rule per bullet, stated as a fact about the current code.
- Describe a real example in prose, with its location. Add code only when it shows something the
  generic example does not.
- When you change a section, update the doc's other sections that refer to it, such as a "Best
  Practices" or "Extensibility" section. Remove any "see … above" that points at something you
  deleted.

## Step 5 — Write code examples

Code is allowed for one purpose: **to show how a feature registers or uses something.**

- Keep each example short: the call a feature writes, and nothing else.
- Use only the public API, with argument names that exist today.
- Use a generic slug such as `example-notice` when the example is not a real feature.
- Never paste a private method, a class body, or a bootstrap file as an example.

For example, this shows how a feature adds a notice:

```php
add_filter(
	'googlesitekit_admin_notices',
	function ( $notices ) {
		$notices[] = new Notice(
			'example-notice',
			array(
				'content' => __( 'Example notice content.', 'google-site-kit' ),
				'type'    => Notice::TYPE_WARNING,
			)
		);

		return $notices;
	}
);
```

## Step 6 — Add a new doc

When a system needs a new file:

- Put it in `docs/context/js/` or `docs/context/php/`, named after the system in kebab case
  (`admin-features.md`, `state-management.md`).
- Start with a `#` title and a short paragraph on what the system is for, then the sections from
  Step 4.
- Add a row for it to the scope map in `.agents/skills/implement-issue/SKILL.md` Step 3. The
  `implement-issue`, `review-pr` and `write-implementation-brief` skills all use that map, so
  without the row no skill loads the doc. If the doc defines conventions a reviewer should check,
  also add a line for it to `.agents/skills/review-pr/review-checklist.md` §2.
- Add it to the list of context docs in `.gemini/styleguide.md`. The Gemini Code Assist reviewer on
  GitHub reads that file, not the skills, so it keeps its own list.

## Step 7 — Write in plain words

The readers include engineers whose first language is not English, and AI tools that take every
sentence literally. Follow the plain-words rules in
`.agents/skills/write-implementation-brief/SKILL.md` Step 5 ("Content"). In short:

- Short sentences, one idea each. Use the simplest accurate word.
- No idioms or metaphors. Say what the code does.
- Name who does what: "`Notices` renders each active notice", not "notices are rendered".
- List the members of any set you name, such as the tags an allowlist keeps.
- Spell names exactly as the code does.

## Step 8 — Verify and report

Before you finish, check every claim one more time against the code. Search for each symbol you
name, and confirm each path exists. Apply the evergreen test to each sentence. Then confirm with
`git diff` that you changed only the sections in scope.

Report to the user:

- which sections you rewrote or added;
- each place where the old doc and the code disagreed, with the file you checked;
- stale sections you found but left alone, so they can become a separate task.

## Guardrails

- **Evergreen where practical.** Describe the stable contract, and point to the code for details
  that change often.
- **Usage, not implementation.** Explain how a feature uses the system. Never copy internal code.
- **Verify before naming.** Never describe a symbol, argument, default or behavior you have not
  read in the code.
- **Stay in scope.** Change only the sections the job covers.
- **No line numbers and no history.** Describe the code as it is now.
- **Keep the doc lists in sync.** A new doc gets a row in the `implement-issue` skill's scope map
  and an entry in `.gemini/styleguide.md`.
- **Don't commit.** Do not commit, push or open a PR unless the user explicitly asks.
