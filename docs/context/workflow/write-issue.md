# Writing an Issue — Playbook

Single source of truth for writing the **description** and **Acceptance criteria** of a Site Kit
issue, whether a feature request or a bug report. Every AI coding tool (Gemini CLI, Antigravity,
Claude Code) points at this file through a thin per-tool adapter, so the procedure stays identical
everywhere. Update the process **here** — not in the adapters.

A **feature request** gets a Feature Description; a **bug report** gets a Bug Description and
Steps to reproduce. Both get Acceptance criteria. Step 1 settles which type you're writing.

These are the *authoring* sections only. The Implementation Brief and Test Coverage come later,
written by `write-implementation-brief.md` from the criteria you produce here — so write the
criteria as a contract that playbook can execute without re-reading the design doc.

---

## Step 1 — Establish the type, source and mode

**Type** decides the template and the sections you write:

| Type | Template | You write |
| --- | --- | --- |
| Feature request | `.github/ISSUE_TEMPLATE/feature_request.md` | Feature Description + Acceptance criteria |
| Bug report | `.github/ISSUE_TEMPLATE/bug_report.md` | Bug Description + Steps to reproduce + Acceptance criteria |

Read the type from the request: a design doc, a new event/component/setting, "add", "support" →
feature request. A wrong value, a console error, a state that renders when it shouldn't, "broken",
"fix" → bug report. Changing behavior that works as designed is a feature request even when the
user calls it a fix.

**Ask the user whenever the type isn't clear from their message**, and wait for the answer — say
how you read the request so they can correct it in one word. One question costs less than writing
the issue against the wrong template. An existing issue keeps the type it already has; never
convert one into the other.

**Source** arrives as a design doc (a repo path or hosted doc), requirements in the user's
message, or an existing issue (`gh issue view <number> --json title,body`, or a local file path —
never go looking for one yourself, it has no fixed home).

**Mode**:

- **New issue** — write the description sections for the type, plus the Acceptance criteria.
- **Existing issue with a description already written** — write **only** the Acceptance criteria.
  Leave the description byte-for-byte alone unless the user explicitly asks you to change it.

**Stop and ask** if no source material was given, the requirements are ambiguous or contradict
each other, or a design doc covers an epic without saying which issue to write. Never invent a
path to a design doc. If the doc has a work-estimate table of proposed issues, that table *is* the
breakdown — one issue per row, with its title and point estimate. Do not re-slice it.

## Step 2 — Read the source material end to end

- **The whole design doc**, not just this issue's section — the reasoning behind one issue's
  decisions is routinely somewhere else (Alternatives considered, Quality attributes, Technical
  debt, Dependencies).
- **Any sibling spec the design doc names as authoritative** (a locked event spec, a data
  contract, a PRD). That spec wins over the design doc on *what* is built; the code wins over
  both on *how* (Step 3).
- **Sibling issues already written for the same epic** — they set the level of detail and show
  where this issue's scope stops.
- **For a bug report, the whole report as the user gave it** — plugin version, module state,
  browser, exact values seen — plus whatever it names as evidence: a support thread, a linked
  issue, or the PR the user says introduced the problem.

## Step 3 — Verify everything against the code

Do not write criteria from the design doc alone. Open the files the issue will touch and confirm:

- Every class, method, constant, hook, filter, option, script handle and path you name exists and
  is spelled exactly right.
- The base class, registry or filter the issue extends has the shape the design doc claims.
- Who **consumes** the data the issue changes — that's what tells you which "must stay unchanged"
  criteria are real rather than imagined.
- That behavior the design doc treats as already existing actually exists.
- **For a bug report, that the wrong behavior is really what the code does today.** Find the lines
  that produce it, and check whether the same code serves other cases that still work. When you
  can't find the symptom in the code, say so in Step 7 instead of writing the issue around a guess.

Where the code contradicts the design doc, the code wins: write against reality and report the
discrepancy (Step 7).

## Step 4 — Lay out the issue

Open the template for the type (Step 1) and copy it — it *is* the layout, don't reproduce it from
memory or reorder its sections. Make two changes, and no others:

- **Drop the YAML frontmatter** (the `name:`/`about:` lines between the `---` markers) — that
  belongs to GitHub's template picker, not the issue.
- **Put the title in its place**, as a single `# ` heading at the top.

Everything else stays exactly as the template has it: heading order, the `---------------` rule,
the moderator notice byte-for-byte, and the placeholder comment in every section you aren't
writing. The two templates word their placeholders differently ("implement the feature" vs.
"resolve the issue"), so copy from the file for the type you're writing, not the other one.

**Screenshots** and **Additional Context** on a bug report are the reporter's evidence, not yours
— leave both as the template gives them, filling in only environment facts the user actually
stated. Never invent a version, OS or device, and never describe a screenshot you haven't seen.

**Title** — for a feature request, name the deliverable, not the activity: lead with the symbol or
event, then the scope in a short clause — `` `AudienceTile` — no-data and partially-available
states ``. For a bug report, name the symptom and where it happens, same shape —
`` `AudienceTile` — no-data state renders for an audience that has data ``.

Nothing sits between the title and the first description heading — no epic name, point estimate,
or dependency line. A dependency on another issue is a clause inside the description, by real
GitHub issue number.

## Referencing another issue — always ask for the number

Every reference to another issue — dependency, prerequisite, sibling in the same epic, follow-up —
is a real GitHub number (`#12345`). There is no acceptable indirect form: not "issue 5" from the
design doc's ordering, not "the next issue".

**Ask the user for the number.** Never infer it from the design doc's ordering or a nearby issue
number, and never leave a placeholder:

- **Already in GitHub** — ask for the number, then confirm it's the issue you mean with
  `gh issue view <number> --json title` before citing it.
- **Only exists locally** — a markdown file not yet filed. Say so, and ask the user to file it and
  give you the new number. Wait for it: a cross-reference is the one thing you can't write around.
- **No number to give** — drop the cross-reference and name the deliverable instead (``the store
  introduced with `getAudienceSettings` ``). Report the drop in Step 7.

Work out every issue you'll need to cite before you start writing, and ask for all the numbers in
one message rather than stopping repeatedly.

## Step 5 — Write the description

The **only** place rationale belongs — why the issue exists, for someone who'll never read the
design doc or the support thread. Write the sections for your type (Step 1).

**A feature request — the Feature Description**:

- Open with the gap: what happens today, where it falls short, naming the concrete component,
  class or API behavior that doesn't cover the case.
- State what the issue adds, in one sentence.
- Split into bold run-in headings when the work has more than one part (server + frontend, two
  surfaces, markup + asset).
- Carry over the decisions the issue depends on, and why — the constraint an acceptance criterion
  compresses into one line.
- Prose paragraphs only — no criteria bullets, no implementation instructions, no file trees.

**A bug report — the Bug Description**, prose, short, in this order:

- What the plugin does today that is wrong — the symptom on the real surface (the widget, page,
  event, API response, option value), the wrong value versus the value expected.
- What should happen instead, in one sentence.
- When it happens — which module is connected, which role, date range, setting, screen size,
  browser; say plainly when it's every time.
- The cause, in one clause, **only when you verified it in Step 3** — never the fix. When you
  didn't find the cause, leave it out rather than guess.
- Other places the same wrong behavior reaches. Whether this issue covers them is a scope decision
  for the criteria (Step 6); report the split in Step 7 so the user can move the line.

**Steps to reproduce** — the numbered list a tester follows with nothing but the plugin:

- Start from a state the tester can reach; make it step 1 when the bug needs one.
- One action per step, with the real thing to click, type or paste — "Set the date range to
  `Last 28 days`", not "choose a date range".
- End with the observation: what the tester sees and what they should have seen instead.
- No mechanism — no "check the store", no breakpoints — unless the symptom genuinely can't be seen
  any other way, in which case give the exact thing to open and the exact value to look at.

### Write in plain, simple words

This matters more than anything else here. The description is read by reviewers, moderators, and
engineers picking the issue up months later — many don't speak English as a first language.

- Use the simplest word that's still accurate. Short sentences, one idea each. No "notably",
  "elegant", "robust", or other decoration.
- No idioms, metaphors, or cultural references ("under the hood", "for free") — write what
  actually happens instead.
- Explain a technical term the first time you use it, or leave it out.
- Finish every sentence and name who does what to what: "when a link is classified as a contact
  link, the listener emits `contact_link_click` and stops, so the same click is never also
  reported as an outbound click" can be read only one way; "the classifier short-circuits
  `outbound_link_click`" can be read two.
- List the members of every set you name — an "allowlist" nobody can see is no allowlist at all.
- Cut any sentence that only sounds good; if removing it loses no information, remove it.

Reread the finished description once and rewrite every sentence that needs a second reading. The
same rules apply to the acceptance criteria (Step 6) and your reply (Step 7).

**Leave out of either type**:

- **Rationale for the shape of the code** — why one listener serves two events, why a check sits
  in one place rather than two. That's the Implementation Brief's material. Write the behavior and
  its reason in plain words instead: "when a link is already a contact link it sends
  `contact_link_click` and nothing else, so the phone number is never sent to GA".
- **Links or paths to local design docs and specs** — they don't resolve on GitHub. Restate the
  constraint in a clause instead. External links (Figma, a hosted doc, vendor docs) are fine.
- **Sibling issues referenced by design-doc position** ("issue 5", "the next issue") — that
  numbering isn't GitHub's. Cite the real number, or name the deliverable when there's none.

## Step 6 — Write the Acceptance criteria

The contract: the Implementation Brief is written against these, and the PR is graded on them.
Write for whoever **verifies** the finished work by using it — the tester, the reviewer — not
whoever writes the code. Each bullet states what the user does, what the plugin then does, and
what the result contains.

**Keep the mechanism out.** Which class holds the logic, that one listener serves every click —
none of that is checkable by using the feature. "Matching uses `URL.hostname` against an
allowlist" tells a tester nothing; "clicking a link to `https://notwa.me/1555` sends no event"
tells them exactly what to try. A rule the implementer still needs, that the criteria drop, goes in
the brief instead.

**On a bug report** the criteria are the corrected behavior, not the bug — "the tile shows the
audience's 412 users", never "the tile no longer shows `Gathering data` incorrectly" (nobody can
grade what "incorrectly" meant). Add the cases that already work through the same code, so the fix
can't trade one symptom for another. Cause and fix stay out, same as for a feature.

### Shape

- A flat list of `*` bullets, one outcome per bullet. Nest a second level only for an enumerable
  set of cases (values a param may take, forms excluded from a match rule).
- A table when a criterion enumerates a lookup that prose would obscure — inline it, never link
  out to it.

### Content

Each bullet states an outcome:

- **Lead with the precondition** when conditional — "When the module is connected and the user has
  view access (#12345), …".
- **Name the real thing** that appears in the outcome — event name and params, config key,
  inline-data global, user-facing string, the page it renders on. Name a class or hook only when
  the outcome itself is server behavior someone verifies server-side. Names the issue invents are
  spelled out in full — `character_count`, never `char_cnt`.
- **Give the input that produces the outcome**, in a form the tester can paste or click:
  `https://wa.me/15551234567` is verifiable, "a WhatsApp link with a recipient" is not.
- **State the whole outcome, not half of it** — "clicking it sends no event" is complete;
  "`https://notwa.me/1555` must not classify" leaves out *as what*.
- **List every case in a group you refer to** — "share links are excluded" isn't checkable until
  the criterion writes out which ones, inline or in a table.
- **Give the values**: `viewContext: 'mainDashboard'`, `dateRange: 'last-28-days'`, `limit: 3`, a
  300-second cache TTL.
- **State cardinality** when it matters — "at most once per request", "exactly one of four
  states".
- **Say what must stay unchanged**, naming the consumers that would otherwise regress.

### Keep them compact

A criterion states the outcome of the brief, and nothing else. Cut:

- **Rationale** — no "because", "so that". If a bullet explains itself, the explanation belongs in
  the Feature Description.
- **Technique and mechanism** — keep the outcome and its counter-example, drop *how* it's
  produced ("a single delegated listener", "driven by one lookup table").
- **Negative parentheticals** — no "(not an `id`)". State what it *is*.
- **Restatements** — name a thing once, in the bullet that defines it. Never a separate
  "the selector is named X" bullet.
- **Work that isn't being done** — no "no new setting is registered". Silence already says it.
- **"Out of scope" and "Known limitations" lists** — the list form names work, not behavior, and
  nobody can grade it. Write the boundary as the outcome at the edge instead: "the button renders
  on the single product template, and the cart and checkout pages render nothing" is assertable;
  "Out of scope: cart and checkout" is not.

The scope boundary lives here, in that form — not as a clause in the description, which no PR is
graded against. Keep negatives that **are** gradable outcomes: "the notification is not rendered
when …", "an unconnected module contributes nothing", "nothing is enqueued when the flag is off".
A boundary with no observable edge isn't one the issue needs.

## Step 7 — Report what did not go in the issue

In your reply to the user, not the issue:

- **The type you wrote**, when you had to ask — one line, so a wrong answer costs a reply, not a
  review cycle.
- **Decisions you had to make** because the design doc was silent, so the user can overrule them.
- **Discrepancies** between the design doc and the code, with the `file:line` you checked.
- **Anything you added** beyond the design doc's scope for this issue.
- **On a bug report**: the cause you found with its `file:line`, anything in the report you
  couldn't confirm, and environment facts left blank because the user didn't state them.
- **Cross-references**: every issue number you were given and what you cited it for, any reference
  you dropped for lack of a number, and any locally-written issue that still needs to be filed.

---

## Guardrails

- **Ask which type of issue it is** when the message doesn't make it clear, and wait for the
  answer. A feature request and a bug report use different templates and sections.
- **The authoring sections only.** Leave Implementation Brief, Test Coverage, QA Brief and
  Changelog entry as placeholders, and a bug report's Screenshots/Additional Context as the
  template gives them except for stated environment facts.
- **Plain, simple words.** No idioms, no unexplained jargon, no half sentences. List the members
  of every set you name.
- **Criteria are observable behavior**, written for whoever verifies the feature by using it.
  Anything checkable only by reading the source belongs in the Implementation Brief.
- **An existing description is untouchable** unless the user explicitly asks otherwise.
- **Don't publish.** No `gh issue create`/`edit`, no comments, unless explicitly asked.
- **No local paths, no indirect issue references** — every cross-reference is a real GitHub number.
- **Verify before naming.** Never reference a symbol, path or hook you haven't opened.
- **One issue per unit of work.** Write separate files rather than merging distinct units.
