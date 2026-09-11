# Writing an Issue — Playbook

This is the **single source of truth** for writing the **description** and the **Acceptance
criteria** of a Site Kit issue, whether that issue is a feature request or a bug report. Every AI
coding tool (Gemini CLI, Antigravity, Claude Code) points at this file through a thin per-tool
adapter, so the procedure stays identical everywhere. When you update the process, update it
**here** — not in the adapters.

Which sections make up the description depends on the type of issue: a **Feature Description**
for a feature request, a **Bug Description** and **Steps to reproduce** for a bug report. Step 1
settles which type you are writing.

These are the *authoring* sections. The Implementation Brief and Test Coverage are written later,
from the criteria you produce here, by `write-implementation-brief.md`. Write the criteria so that
playbook has a contract it can execute against without re-reading the design doc.

---

## Step 1 — Establish the issue type, the source and the mode

### The type

There are two issue templates, and they have different description sections:

- **Feature request** — `.github/ISSUE_TEMPLATE/feature_request.md`. You write the **Feature
  Description** and the **Acceptance criteria**.
- **Bug report** — `.github/ISSUE_TEMPLATE/bug_report.md`. You write the **Bug Description**, the
  **Steps to reproduce** and the **Acceptance criteria**.

Take the type from what the user asked for. A design doc, a new event, a new component, a new
setting, "add", "support" — feature request. A wrong value, a value that is never sent, a console
error, a state the plugin renders when it should not, something that used to work and no longer
does, "broken", "fix" — bug report.

**Ask the user which type they want whenever it is not clear from their message**, and wait for
the answer before you write anything. One question costs less than writing the issue against the
wrong template. When you ask, say which way you read the request and why, so the user can correct
the reading in one word.

A request to change behavior that works the way it was designed to work is a feature request, not
a bug, even when the user calls it a fix. Point that out when you ask.

When the source is an existing issue, its type is already decided: read the issue and match it.
Do not convert one type into the other.

### The source and the mode

Source material arrives one of three ways, and only the user can tell you which:

- **A design doc** — a path in the repo, or a hosted doc.
- **Requirements written directly in the user's message.**
- **An existing issue** — a GitHub issue number (`gh issue view <number> --json title,body`) or a
  path to a local issue file, when only the criteria are wanted.

There are two modes, and they decide what you are allowed to touch:

- **New issue** — write the description sections for the type and the Acceptance criteria.
- **Existing issue whose description is already written** — write **only** the Acceptance
  criteria. Read the description to write against it and leave it byte-for-byte alone, unless
  the user explicitly asks you to change it. This covers a Feature Description on a feature
  request and a Bug Description with its Steps to reproduce on a bug report alike.

**Stop and ask the user** if no source material was given, if the requirements are ambiguous or
contradict each other, or if the design doc covers an epic and the user has not said which issue
to write. Never invent a path to a design doc, and never go looking for a local issue file — it
has no fixed home, so the user must give you the path.

If the design doc has a **work-estimate table of proposed issues**, that table *is* the
breakdown: one issue per row, with its title and its point estimate. Do not re-slice it.

## Step 2 — Read the source material end to end

- **The whole design doc**, not only the section for this issue. The reasoning behind one
  issue's decisions is routinely somewhere else — Alternatives considered, Quality attributes,
  Technical debt, Dependencies.
- **Any sibling spec the design doc names as authoritative** (a locked event spec, a data
  contract, a PRD). Where that spec and the design doc disagree on *what* is built, the spec
  wins; where the design doc and the code disagree on *how*, the code wins (Step 3).
- **Sibling issues already written for the same epic.** They set the level of detail and show
  where this issue's scope stops and the next one begins.
- **For a bug report, the whole report as the user gave it** — the plugin version, the module
  state, the browser, the exact values they saw. Read whatever the report names as evidence: a
  support thread, a linked issue, or the pull request the user says introduced the problem.

## Step 3 — Verify everything against the code

Do not write criteria from the design doc alone. Open the files the issue will touch and
confirm, by reading them:

- Every class, method, constant, hook, filter, option, script handle and path you name exists
  and is spelled exactly right.
- The base class, registry or filter the issue extends has the shape the design doc claims.
- Who **consumes** the data the issue changes — a new key in a shared array, a new entry in a
  registry, a new item in a walk. That is what tells you which "must stay unchanged" criteria
  are real rather than imagined.
- That behavior the design doc treats as already existing actually exists.
- **For a bug report, that the wrong behavior is really what the code does today**, and where.
  Read until you can point at the lines that produce the symptom, and check whether the same
  code serves other cases that still work. A bug written from a guess sends the implementer to
  the wrong file, and its criteria describe a fix for something that was never broken. When you
  cannot find the symptom in the code, say so (Step 7) instead of writing the issue around it.

Where the code contradicts the design doc, the code wins: write the criteria against reality and
report the discrepancy (Step 7).

## Step 4 — Lay out the issue

Open the template for the type you settled in Step 1 and copy it. The file *is* the layout — do
not reproduce it from memory, and do not reorder or rename its sections:

- **Feature request** — `.github/ISSUE_TEMPLATE/feature_request.md`
- **Bug report** — `.github/ISSUE_TEMPLATE/bug_report.md`

Make two changes to the copy, and no others:

- **Drop the YAML frontmatter** — the `name:` and `about:` lines between the two `---` markers.
  They belong to GitHub's template picker, not to the issue.
- **Put the title in its place**, as a single `# ` heading at the top of the file.

Everything else stays exactly as the template has it: the headings in the template's order, the
`---------------` rule, the moderator notice byte-for-byte, and the placeholder comment in every
section you are not writing. The two templates word their placeholders differently — the feature
request's brief says "implement the feature" where the bug report's says "resolve the issue" — so
copy them from the file rather than carrying them over from the other type. Replace a placeholder
with your own content only in the sections the type gives you (Step 1).

**Screenshots** and **Additional Context** on a bug report are the reporter's evidence, not yours.
Leave both as the template gives them, and fill in only the environment facts the user actually
stated — a plugin version they named, the browser they used. Never invent a version number, an
operating system or a device, and never describe a screenshot you have not seen.

**Title** — for a feature request, name the deliverable, not the activity. Lead with the symbol or
event the issue produces, then the scope in a short clause: `` `AudienceTile` — no-data and
partially-available states ``. For a bug report, name the symptom and where it happens, in the
same shape: `` `AudienceTile` — no-data state renders for an audience that has data ``.

Nothing sits between the title and the first description heading — no epic name, no point
estimate, no dependency line. Where the issue depends on another, that dependency is a clause
inside the description, by real GitHub issue number.

## Referencing another issue — always ask for the number

Every reference to another issue, in any section you write, is a real GitHub number (`#12345`).
This applies to dependencies, prerequisites, siblings in the same epic and follow-ups alike. There
is no acceptable indirect form — not "issue 5" from the design doc's ordering, not "the next
issue", not "the issue that adds the store".

**Ask the user for the number.** Never infer it from the design doc's ordering, never guess it
from a nearby issue number, and never leave a placeholder to be filled in later:

- **The issue is already in GitHub** — ask the user for its number, then confirm it is the issue
  you mean with `gh issue view <number> --json title` before citing it.
- **The issue only exists locally** — a markdown file you or the user wrote that has not been
  filed yet. Say so, and ask the user to create it in GitHub and give you the new number. Wait
  for it: a cross-reference is the one thing you cannot write around.
- **The user has no number to give** — drop the cross-reference and name the deliverable instead
  (``the store introduced with `getAudienceSettings` ``). Report the dropped reference in
  Step 7.

Work out every issue you will need to cite before you start writing, and ask for all of the
numbers in one message rather than stopping repeatedly.

## Step 5 — Write the description

The description is the **only** place where rationale belongs. It answers "why does this issue
exist, and what problem does it solve" for someone who will never read the design doc or the
support thread. Write the sections that belong to the type you settled in Step 1.

### A feature request: the Feature Description

- **Open with the gap.** What happens today, and where it falls short. Name the concrete thing
  that doesn't cover the case — the existing component, the class, the API behavior.
- **State what the issue adds**, in one sentence.
- **Split the description** when the work has more than one part (server + frontend, two
  surfaces, markup + asset), using bold run-in headings.
- **Carry over the decisions the issue depends on**, and why — the constraint that an acceptance
  criterion compresses into a single line. "Why the value is stored per-user rather than
  per-site" lives here.
- **Prose paragraphs.** No bullets of criteria, no implementation instructions, no file trees.

### A bug report: the Bug Description and Steps to reproduce

The **Bug Description** is prose, and it is short. Three things, in this order:

- **What the plugin does today that is wrong.** The symptom as someone sees it, on the real
  surface: the widget, the page, the event, the API response, the option value. Give the wrong
  value and the value that was expected instead.
- **What should happen instead**, in one sentence.
- **When it happens.** The conditions the symptom needs and the ones it does not survive: which
  module is connected, which user role, which date range, which setting value, which screen size,
  which browser. Say plainly when the symptom appears every time.

Add the cause in one clause **only when you verified it in the code** in Step 3 — "the value is
read before the settings are loaded, so it is always the default". Do not prescribe the fix; that
is the Implementation Brief's job. When you did not find the cause, leave it out rather than
guessing at it.

Name the other places the same wrong behavior reaches — another widget served by the same code,
another module with the same shape. Whether this issue covers them is a scope decision, so it is
settled in the criteria (Step 6): the ones it covers get their corrected outcome, and the ones it
leaves get the outcome that still holds at the edge. Report the split in your reply (Step 7) so the
user can move the line.

The **Steps to reproduce** are the numbered list a tester follows with nothing but the plugin:

- **Start from a state the tester can reach.** A fresh install, a connected module, a setting at a
  named value. Make the starting state step 1 when the bug needs one.
- **One action per step**, with the real thing to click, type or paste — the page, the menu item,
  the URL, the value in the field. "Set the date range to `Last 28 days`", not "choose a date
  range".
- **End with the observation.** The last step is what the tester sees and what they should have
  seen instead: "The tile shows `Gathering data`, though the audience returned 412 users."
- **No mechanism.** No "check the store", no "read the network response", no breakpoints — unless
  the symptom genuinely cannot be seen any other way, in which case give the exact thing to open
  and the exact value to look at.

### Write in plain, simple words

This matters more than anything else in these sections. The description is read by people:
reviewers, moderators, engineers picking the issue up months later. Many of them do not speak
English as a first language, and none of them should have to read a sentence twice.

- **Use the simplest word that is still accurate.** Short sentences, one idea each. No
  decoration, no "notably", "crucially", "simply", "of course", "elegant", "robust".
- **No idioms, metaphors, or cultural references.** "A WhatsApp button is now standard furniture
  on business sites" is a phrase a reviewer has to decode; "A WhatsApp button is common on
  business sites" is not. The same goes for "under the hood", "out of the box", "for free",
  "dead weight", "poisoned", "leaks into".
- **Explain a technical term the first time you use it, or leave it out.**
- **Finish every sentence, and name who does what to what.** "the classifier short-circuits
  `outbound_link_click`" can be read in two opposite directions. "when a link is classified as a
  contact link, the listener emits `contact_link_click` and stops, so the same click is never
  also reported as an outbound click" can be read in only one.
- **Cut the sentence that only sounds good.** If removing it loses no information, remove it.

Read the finished description once more and rewrite every sentence that needs a second reading.
The same rules apply to the acceptance criteria (Step 6) and to your reply to the user (Step 7).

Do **not** include, in either type of description:

- **Rationale for the shape of the code.** The description says why the feature *behaves* the way
  it does, for someone who will use it or verify it. Why one listener serves two events, why a
  check sits in one place rather than two, what the code would have looked like otherwise — that
  is the Implementation Brief's material, and only where the implementer needs it. "This is a
  second consumer of one resolution — not a second `closest()` call" and "the short-circuit exists
  for that privacy reason, not for tidiness" leave the reader with nothing they can act on. Write
  the behavior and its reason in ordinary words instead: "when a link is already a contact link it
  sends `contact_link_click` and nothing else, so the phone number in its address is never sent to
  GA".
- **Links or paths to local design docs and specs.** They don't resolve for someone reading the
  issue on GitHub. Restate the constraint in a clause instead. External links — Figma, a hosted
  doc, public vendor documentation — are fine.
- **References to sibling issues by their position in the design doc** — "issue 5", "the next
  issue", "issue 3 of this epic". The design doc's numbering is not GitHub's, and will be wrong
  the moment the issues are filed. Cite the sibling by the real GitHub number you asked the user
  for, or name its deliverable when there is no number to be had.

## Step 6 — Write the Acceptance criteria

The criteria are the contract: the Implementation Brief is written against them and the PR is
graded on them. Write them for the person who **verifies** the finished work — the QA engineer
who will click through the site, and the reviewer checking that nothing is missing. That person
does not need to know how the code works, so each criterion states something they can observe by
using the feature: what the user does, what the plugin then does, and what the result contains.

**Keep the mechanism out.** Which class holds the logic, that one delegated listener serves every
click, that a lookup table drives the matching, which browser API parses the URL — that is the
Implementation Brief's job, and none of it can be checked by using the feature. "Matching uses
the parsed `URL.hostname` against an allowlist" tells a tester nothing; "clicking a link to
`https://notwa.me/1555` sends no event" tells them exactly what to try and what to expect. When
the criteria drop a rule the implementer still needs, put it in the brief.

**On a bug report** the criteria are the corrected behavior, not the bug. Write the outcome the
steps in the description must produce once the issue is done — "the tile shows the audience's 412
users" — never "the tile no longer shows `Gathering data` incorrectly", which cannot be graded
without the reader deciding what "incorrectly" meant. Then write the cases that already work and
run through the same code, so the fix is not allowed to trade one symptom for another. The cause
and the fix stay out of the criteria, in the same way technique does for a feature.

### Shape

- A flat list of `*` bullets.
- **One outcome per bullet.** Nest a second level when a single outcome has an enumerable set of
  cases — the conditions under which a hook must not fire, the values a param may take, the
  forms excluded from a match rule.
- A **table** when a criterion enumerates a lookup that prose would obscure (each widget slug
  and the module that owns it). Inline it; never link out to it.

### Content

Each bullet states an outcome:

- **Lead with the precondition** when the behavior is conditional — "When the module is
  connected and the user has view access (#12345), …".
- **Name the real thing** — the parts of it that appear in the outcome: the event name and its
  params, the config key, the inline-data global, the user-facing string, the page it renders on.
  Name a class, hook or filter when the outcome itself is server behavior someone verifies on the
  server; do not name the internals that merely produce a visible result. Names the issue invents
  are spelled out in full words — `character_count`, never `char_cnt`.
- **Give the input that produces the outcome**, in the form a tester can paste or click: the
  exact `href`, URL, setting value or sequence of clicks. `https://wa.me/15551234567` is
  verifiable; "a WhatsApp link with a recipient" is not.
- **State the whole outcome, not half of it.** "`https://notwa.me/1555` must not classify" leaves
  out *as what*; "clicking it sends no event" is complete. A criterion the reader has to
  interpret cannot be graded.
- **List every case you refer to as a group.** "Share links are excluded" is not checkable until
  the criterion writes out the share links it means. Give the members inline, or in a table the
  criterion carries.
- **Give the values**: `viewContext: 'mainDashboard'`, `dateRange: 'last-28-days'`, `limit: 3`,
  a 300-second cache TTL.
- **State cardinality** when it matters: "at most once per request", "exactly once per page
  view", "exactly one of the four states".
- **Say what must stay unchanged** when the change touches shared code, naming the consumers
  that would otherwise regress.

### Keep them compact

A criterion states the outcome of implementing the brief, and nothing else. Cut:

- **Rationale.** No "because", "since", "so that", "— the same reasoning as X". If a bullet
  explains itself, the explanation belongs in the Feature Description.
- **Technique and mechanism.** *How* the plugin matches, parses, stores or listens is the brief's
  job. "The value falls back to the site default when the user setting is unset" is an outcome;
  "read with `array_key_exists()` rather than `isset()`", "a single delegated listener on
  `document`", "driven by one lookup table keyed by scheme and host" are mechanism — keep the
  outcome and its counter-example ("an explicit `null` is preserved"), drop the rest.
- **Negative parentheticals.** No "(not an `id`)", "(not the raw response)", "rather than
  assumed to be the first entry". State what it *is*.
- **Restatements.** Name the thing once, in the bullet that defines when it happens. Never add
  a separate "the selector is named `X`" bullet, and never re-justify the name.
- **Work that isn't being done.** No "no new setting is registered", "no Storybook story is
  added", "no migration needed". Silence already says it.
- **"Out of scope" and "Known limitations" lists.** The list form names work instead of behavior,
  and nobody can grade it. A boundary that matters is a criterion like any other: write it as the
  outcome at the edge. "The button renders on the single product template, and the cart and
  checkout pages render nothing" is assertable; "Out of scope: cart and checkout" is not.

The criteria are the contract, so **the scope boundary lives here**, in that form — not as a
clause in the description, which no PR is graded against. Keep the negatives that **are** outcomes
and that a test can assert: "the notification is not rendered when …", "an unconnected module
contributes nothing", "the legacy option is not written", "the payload carries the slug and
nothing else", "nothing is enqueued when the feature flag is off". A boundary with no observable
edge — nothing a tester could do that would show the difference — is not one the issue needs.

## Step 7 — Report what did not go in the issue

Everything you decided, cut or discovered belongs in your reply to the user — not in the issue:

- **The type you wrote**, when the user did not name it and you asked — one line saying which
  template you used, so a wrong answer costs one reply rather than a review cycle.
- **Decisions you had to make** because the design doc was silent, flagged as decisions so the
  user can overrule them.
- **Discrepancies** between the design doc and the code, with the `file:line` you checked.
- **Anything you added** beyond the design doc's scope for this issue, so the user can drop it.
- **On a bug report**: the cause you found, with its `file:line`; anything in the report you could
  not confirm in the code; and the environment facts you left blank because the user did not
  state them.
- **Cross-references** — every issue number you were given and what you cited it for, any
  reference you dropped because no number was available, and any locally-written issue that still
  has to be filed before this issue's text is final.

---

## Guardrails

- **Ask which type of issue it is** when the user's message does not make it clear, and wait for
  the answer. A feature request and a bug report use different templates and different description
  sections — guessing wrong means writing the issue twice.
- **The authoring sections only.** A feature request: the Feature Description and the Acceptance
  criteria. A bug report: the Bug Description, the Steps to reproduce and the Acceptance criteria.
  Leave Implementation Brief, Test Coverage, QA Brief and Changelog entry as the template's
  placeholder comments, and leave a bug report's Screenshots and Additional Context as the
  template gives them, except for environment facts the user actually stated.
- **Plain, simple words.** No idioms, no metaphors, no unexplained jargon, no half sentences.
  Name who does what to what, and list the members of every set you name — see Steps 5 and 6.
- **Criteria are observable behavior.** Written for whoever verifies the feature by using it, not
  for whoever writes the code. Anything that can only be checked by reading the source belongs in
  the Implementation Brief.
- **An existing description is untouchable.** When asked to add criteria to an issue that already
  has a Feature Description, or a Bug Description with its Steps to reproduce, read it and leave it
  exactly as it is unless explicitly told otherwise.
- **Don't publish.** Never run `gh issue create` or `gh issue edit`, and never post a comment,
  unless the user explicitly asks. Produce the markdown file and let them place it.
- **No local paths anywhere in the sections you write, and no indirect issue references** — every
  cross-reference is a real GitHub number you asked the user for, never a design-doc position,
  a relative pointer or a placeholder.
- **Verify before naming.** Never reference a symbol, path or hook you have not opened.
- **One issue per unit of work.** If the source material describes more, write them as separate
  files rather than merging them.
