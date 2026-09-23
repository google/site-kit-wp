/**
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check
// Tests for the library that blanks what a person does not read in a code file. Each test
// calls the function with a string and an extension, and reads what came back. No test here
// reads a file of the project.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { whatAPersonReads } from "./code.mjs";

/**
 * Gives back each line of the result with its spaces at both ends cut off.
 *
 * @param {string} text The result.
 * @returns {string[]} One entry for each line.
 */
function trimmed(text) {
  return text.split("\n").map((one) => one.trim());
}

/**
 * Says whether every line of the result is as long as the same line of the source.
 *
 * @param {string} source The file.
 * @param {string} result What came back.
 * @returns {boolean} True when every line kept its length.
 */
function sameLengths(source, result) {
  const before = source.split("\n");
  const after = result.split("\n");
  return before.length === after.length && before.every((one, index) => one.length === after[index].length);
}

test("keeps a line comment without its mark, and the line keeps its length", () => {
  const source = "const a = 1; // The count of files.\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["The count of files.", ""]);
  strictEqual(sameLengths(source, result), true);
});

test("keeps a block comment without its marks or the star that opens each line", () => {
  const source = "/**\n * Reads the file.\n *\n * @param {string} path The path.\n */\nconst a = 1;\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["", "Reads the file.", "", "@param {string} path The path.", "", "", ""]);
  strictEqual(sameLengths(source, result), true);
});

test("blanks a string of fewer than four words and keeps one of four or more", () => {
  const source = 'const a = "utilize";\nconst b = "one two three";\nconst c = "The export is finished now.";\n';
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["", "", "The export is finished now.", ""]);
});

test("does not open a string on a quote inside a comment", () => {
  const source = "// It's the file's name.\nconst a = 1; // and a second comment\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["It's the file's name.", "and a second comment", ""]);
});

test("does not open a comment on a comment mark inside a string", () => {
  const source = 'const a = "see http://example.test/x for the whole story"; const b = "hidden";\n';
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["see http://example.test/x for the whole story", ""]);
});

test("keeps a string going past a backslash before a quote", () => {
  const source = 'const a = "say \\"hello\\" to the reader"; const b = "hidden"; // kept comment\n';
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ['say  "hello " to the reader                          kept comment', ""]);
  strictEqual(sameLengths(source, result), true);
});

test("does not open a template string on a backtick inside a pattern", () => {
  const source = "const a = line.replace(/`[^`\\n]*`/g, blank);\nconst b = `hidden`;\n// A comment that stays whole.\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["", "", "A comment that stays whole.", ""]);
});

test("reads a division as code and still keeps the comment after it", () => {
  const source = "const a = b / c; // half of it\nconst d = e / f;\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["half of it", "", ""]);
});

test("keeps the words of a template string and blanks the code inside its braces", () => {
  const source = "const a = `The file ${path} breaks a rule ${one ? `x` : `y`}. Fix it.`;\nconst b = `${a}:${b}: ${c}`;\n";
  const result = whatAPersonReads(source, ".mjs");
  const [first, second] = result.split("\n");
  strictEqual(first.includes("The file"), true);
  strictEqual(first.includes("breaks a rule"), true);
  strictEqual(first.includes("Fix it."), true);
  strictEqual(first.includes("path"), false);
  strictEqual(first.includes("one"), false);
  strictEqual(second.trim(), "");
  strictEqual(sameLengths(source, result), true);
});

test("blanks a newline mark inside a kept string", () => {
  const source = 'const a = "One line here.\\n\\nAnd a second one.";\n';
  const result = whatAPersonReads(source, ".mjs");
  strictEqual(trimmed(result)[0], "One line here.    And a second one.");
});

test("keeps a hash comment and a docstring in a Python file, and blanks a short string", () => {
  const source = '# The header comment.\ndef run():\n    """Reads the file\n    and reports."""\n    return "hidden"\n';
  const result = whatAPersonReads(source, ".py");
  deepStrictEqual(trimmed(result), ["The header comment.", "", "Reads the file", "and reports.", "", ""]);
});

test("opens a hash comment only at the start of a line or after a space", () => {
  const source = "x=y#not a comment at all\ncount=${#items[@]}\n# the page background\n";
  const result = whatAPersonReads(source, ".sh");
  deepStrictEqual(trimmed(result), ["", "", "the page background", ""]);
});

test("keeps a hash comment in a PHP file too", () => {
  const source = "<?php\n# The old mark.\n// The new mark.\n$a = 'hidden';\n";
  const result = whatAPersonReads(source, ".php");
  deepStrictEqual(trimmed(result), ["", "The old mark.", "The new mark.", "", ""]);
});

test("blanks a shebang line", () => {
  const source = "#!/bin/sh\n# The header.\n";
  const result = whatAPersonReads(source, ".sh");
  deepStrictEqual(trimmed(result), ["", "The header.", ""]);
});

test("keeps a markup comment and a long attribute value, and blanks the text between tags", () => {
  const source = '<!-- The header comment. -->\n<p title="A title of four words" class="short">Text between the tags</p>\n';
  const result = whatAPersonReads(source, ".html");
  deepStrictEqual(trimmed(result), ["The header comment.", "A title of four words", ""]);
});

test("keeps a JSON value of four words and blanks the name of its field", () => {
  const source = '{\n  "a field of four words": "short",\n  "description": "Checks a text against the rules."\n}\n';
  const result = whatAPersonReads(source, ".json");
  deepStrictEqual(trimmed(result), ["", "", "Checks a text against the rules.", "", ""]);
});

test("gives a prose file back whole", () => {
  const source = "// Not a comment in prose.\n\nA paragraph.\n";
  strictEqual(whatAPersonReads(source, ".md"), source);
  strictEqual(whatAPersonReads(source, ".txt"), source);
});

test("gives a file of an unknown type back whole", () => {
  const source = "node_modules/\n*.log\n";
  strictEqual(whatAPersonReads(source, ".gitignore"), source);
  strictEqual(whatAPersonReads(source, ""), source);
});

test("reads the extension whatever its case", () => {
  const source = "// A comment.\n";
  deepStrictEqual(trimmed(whatAPersonReads(source, ".MJS")), ["A comment.", ""]);
});

test("keeps every line the same length in a mixed file", () => {
  const source = [
    "// @ts-check",
    "/* A block",
    "   that runs on */ const a = 'x';",
    "const b = `one ${a} two three four five`;",
    "const c = /\"quoted\"/.test(b); // trailing",
    "const d = \"a \\\"b\\\" c d e\";",
    ""
  ].join("\n");
  const result = whatAPersonReads(source, ".mjs");
  strictEqual(sameLengths(source, result), true);
  strictEqual(result.includes("A block"), true);
  strictEqual(result.includes("that runs on"), true);
  strictEqual(result.includes("trailing"), true);
  strictEqual(result.includes("quoted"), false);
});

test("reads no string in a file whose opening comment says the check reads the comments alone", () => {
  const source = "// @ts-check\n// In this file the check reads the comments alone, because it lists the words a rule bans.\n\nconst a = \"one two three four\"; // A comment that stays.\nconst b = `five six seven eight ${a}`;\n";
  const result = whatAPersonReads(source, ".mjs");
  deepStrictEqual(trimmed(result), ["@ts-check", "In this file the check reads the comments alone, because it lists the words a rule bans.", "", "A comment that stays.", "", ""]);
  strictEqual(sameLengths(source, result), true);
});

test("keeps a string when the phrase sits in a comment after the first line of code", () => {
  const source = "const a = \"one two three four\";\n// The check reads the comments alone.\n";
  deepStrictEqual(trimmed(whatAPersonReads(source, ".mjs")), ["one two three four", "The check reads the comments alone.", ""]);
});

test("finds the phrase across two lines of a block comment, and after a shebang line", () => {
  const block = "/**\n * The check reads the\n * comments alone here.\n */\nconst a = \"one two three four\";\n";
  strictEqual(whatAPersonReads(block, ".mjs").includes("one two three four"), false);
  const hash = "#!/bin/sh\n# The check reads the comments alone.\nx=\"one two three four\"\n";
  strictEqual(whatAPersonReads(hash, ".sh").includes("one two three four"), false);
});

test("still reads a string to its end in such a file, so a comment mark inside it opens nothing", () => {
  const source = "// The check reads the comments alone.\nconst a = \"see // this is not a comment\"; const b = 1;\n";
  deepStrictEqual(trimmed(whatAPersonReads(source, ".mjs")), ["The check reads the comments alone.", "", ""]);
});

/** The WordPress translation calls the library skips, listed here too so a test proves each name on its own. */
const TRANSLATION_CALLS = ["__", "_e", "_x", "_n", "esc_html__", "esc_html_e", "esc_html_x", "esc_attr__", "esc_attr_e", "esc_attr_x"];

for (const name of TRANSLATION_CALLS) {
  test(`blanks the string inside ${name}() and keeps the one beside it, in a PHP file and in a JavaScript file`, () => {
    const php = [
      "<?php",
      `echo ${name}( 'Read the file and report.', 'google-site-kit' );`,
      "$a = 'Read the file and report.';",
      ""
    ].join("\n");
    deepStrictEqual(trimmed(whatAPersonReads(php, ".php")), ["", "", "Read the file and report.", ""]);
    const script = [
      `const a = ${name}( 'Read the file and report.', 'google-site-kit' );`,
      "const b = 'Read the file and report.';",
      ""
    ].join("\n");
    deepStrictEqual(trimmed(whatAPersonReads(script, ".js")), ["", "Read the file and report.", ""]);
  });
}

test("blanks both strings of a call with two strings, across every line the call runs on", () => {
  const source = [
    "const a = _n(",
    "  'One file was read.',",
    "  'Some files were read.',",
    "  count,",
    "  'google-site-kit'",
    ");",
    "const b = 'Read the file and report.';",
    ""
  ].join("\n");
  const result = whatAPersonReads(source, ".js");
  deepStrictEqual(trimmed(result), ["", "", "", "", "", "", "Read the file and report.", ""]);
  strictEqual(sameLengths(source, result), true);
});

test("blanks a template string inside a translation call", () => {
  const source = [
    "const a = __( `Read the file and report.`, 'google-site-kit' );",
    "const b = `Read the file and report.`;",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".js")), ["", "Read the file and report.", ""]);
});

test("keeps every line the same length around a translation call", () => {
  const source = [
    "<?php",
    "$a = sprintf( __( 'Read the file %s now.', 'google-site-kit' ), $b ); // A comment.",
    "$c = esc_html_e( 'Read the file and report.' );",
    "$d = 'Read the file and report.';",
    ""
  ].join("\n");
  const result = whatAPersonReads(source, ".php");
  strictEqual(sameLengths(source, result), true);
  deepStrictEqual(trimmed(result), ["", "A comment.", "", "Read the file and report.", ""]);
});

test("still reads a string built first and passed to a translation call in a variable", () => {
  const source = [
    "<?php",
    "$text = 'Read the file and report.';",
    "echo __( $text, 'google-site-kit' );",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".php")), ["", "Read the file and report.", "", ""]);
});

test("reads a name that only ends in one of the names, or has no bracket after it, as no translation call", () => {
  const source = [
    "const a = my__( 'Read the file and report.', 'google-site-kit' );",
    "const __ = 'Read the file and report.';",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".js")), ["Read the file and report.", "Read the file and report.", ""]);
});

test("blanks the strings inside a translation call nested in another call, and keeps the string beside it", () => {
  const source = [
    "<?php",
    "echo sprintf( __( 'Hello %s, read the file.', 'google-site-kit' ), $name, 'Read the file and report.' );",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".php")), ["", "Read the file and report.", ""]);
});

test("keeps a comment inside a translation call", () => {
  const source = [
    "const a = __(",
    "  'Read the file and report.', // The copy from design.",
    "  'google-site-kit'",
    ");",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".js")), ["", "The copy from design.", "", "", ""]);
});

test("opens the call when a space sits between the name and its bracket", () => {
  const source = [
    "<?php",
    "echo __ ( 'Read the file and report.', 'google-site-kit' );",
    ""
  ].join("\n");
  deepStrictEqual(trimmed(whatAPersonReads(source, ".php")), ["", "", ""]);
});
