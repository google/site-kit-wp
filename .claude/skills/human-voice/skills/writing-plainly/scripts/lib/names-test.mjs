// @ts-check
// Tests for the library that reads a file name and a folder name against the refused words.
// Each test calls the function with a path and reads the findings. No test here reads a file
// of the project.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { refusedName } from "./names.mjs";

test("reports a refused word in the name of the file as an error naming the plain word", () => {
  const found = refusedName("docs/utilize-cache.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].rule, "refused-name");
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].line, 0);
  strictEqual(found[0].message, 'Rename the file "utilize-cache.md" with "use" in place of "utilize", because a person reads the name in a listing.');
});

test("reports a refused word in a folder as a warning", () => {
  const found = refusedName("utilize-things/note.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "warning");
  strictEqual(found[0].message.startsWith('Rename the folder "utilize-things"'), true);
});

test("skips a name a tool fixes", () => {
  deepStrictEqual(refusedName(".claude-plugin/plugin.json"), []);
  deepStrictEqual(refusedName("skills/writing-plainly/SKILL.md"), []);
  deepStrictEqual(refusedName("evals/a-case/graders/a-grader.md"), []);
});

test("never reports a technical word, whatever the list refuses", () => {
  deepStrictEqual(refusedName("fix-the-bug.md"), []);
  deepStrictEqual(refusedName("running-notes.md"), []);
});

test("ends a word at a hyphen, an underscore, a dot and a change of case", () => {
  const found = refusedName("utilizeCache_notes.attempt.md");
  deepStrictEqual(found.map((one) => one.message.match(/in place of "([^"]+)"/)?.[1]), ["utilize", "attempt"]);
});

test("reads a form with an ending", () => {
  const found = refusedName("utilizing-the-cache.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"use" in place of "utilizing"'), true);
});

test("reads a phrase across two words", () => {
  const found = refusedName("prior-to-the-change.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('in place of "prior to"'), true);
});

test("gives nothing for a clean path", () => {
  deepStrictEqual(refusedName("docs/notes/the-check.md"), []);
  deepStrictEqual(refusedName("check-text.mjs"), []);
});

test("reports a word the list approves in another use as a warning, even in the name of the file", () => {
  const found = refusedName("display-settings.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "warning");
  strictEqual(found[0].message.includes("judge which one"), true);
  strictEqual(found[0].message.includes('"show" in place of "display"'), true);
});

test("asks for another word where the list gives none", () => {
  const found = refusedName("bank-notes.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes("gives no other word"), true);
});

test("names the owner's plain word for the form that was hit", () => {
  const found = refusedName("claimed-results.md");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"said" in place of "claimed"'), true);
});

test("reads every segment of a path with two folders", () => {
  const found = refusedName("utilize-things/attempt-notes/fix.md");
  deepStrictEqual(found.map((one) => one.severity), ["warning", "warning"]);
});
