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
// Tests for the rules library. Every test calls a rule with a string, so no test here
// reads a file of the project.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { dash, emptyAdverb, thereIs, semicolon, longSentence, brokenParagraph, plainWord, refusedWord, nounForVerb, ingTail, notXButY, itMatters, benefitWithNoCost, linkingWord, ratingWord, servesAs, summaryRepeat, whatComesNext, weakening, titleCaseHeading, sameLength, distanceFromAverage, everyRule } from "./text.mjs";

test("reports an em dash in prose", () => {
  strictEqual(dash("The export finished — at last.").length, 1);
});

test("leaves an em dash inside backticks alone, so a rule can name what it bans", () => {
  strictEqual(dash("Never write `a — dash` in prose.").length, 0);
});

test("leaves a fenced block alone", () => {
  strictEqual(dash("```\nconst a = 1 — 2;\n```").length, 0);
});

test("names the empty adverb it found", () => {
  const found = emptyAdverb("It basically works.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes("basically"), true);
});

test("reports a sentence opening on there are", () => {
  strictEqual(thereIs("There are three lists.").length, 1);
});

test("reports there is after a full stop", () => {
  strictEqual(thereIs("The file loads. There is a second one.").length, 1);
});

test("leaves the word there alone when it is not the opener", () => {
  strictEqual(thereIs("The file is over there.").length, 0);
});

test("reports a semicolon joining two sentences", () => {
  strictEqual(semicolon("The check ran; it found nothing.").length, 1);
});

test("reports a sentence past the ceiling and gives its length", () => {
  const found = longSentence(`${"word ".repeat(30)}end.`);
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes("31"), true);
});

test("leaves a table row alone, because a cell is not a sentence", () => {
  strictEqual(longSentence(`| ${"word ".repeat(30)} |`).length, 0);
});

test("splits a bold lead-in from the sentence after it, which a log paragraph opens with", () => {
  const line = `**A short lead in.** ${"word ".repeat(20)}end.`;
  strictEqual(longSentence(line).length, 0);
});

test("still reports a sentence past the ceiling that follows a bold lead-in", () => {
  const line = `**A short lead in.** ${"word ".repeat(30)}end.`;
  strictEqual(longSentence(line).length, 1);
});

test("counts an italic word as one word rather than three", () => {
  strictEqual(longSentence(`${"word ".repeat(22)}*one* two three.`).length, 0);
});

test("reports two prose lines in a row as a broken paragraph", () => {
  strictEqual(brokenParagraph("The export builds the report\nfrom scratch every time.").length, 1);
});

test("leaves two list items alone", () => {
  strictEqual(brokenParagraph("- One item\n- Another item").length, 0);
});

test("leaves a line ending a sentence alone", () => {
  strictEqual(brokenParagraph("The export is finished.\nThe report is stored.").length, 0);
});

test("leaves an indented fenced block alone, which is the shape a command under a step takes", () => {
  strictEqual(brokenParagraph("1. Run the command.\n\n   ```\n   node scripts/render.mjs\n   the whole diagram goes here\n   ```\n").length, 0);
});

test("holds a longer fence open until a fence at least as long closes it", () => {
  const nested = "````\n```mermaid\nflowchart TD\n    A[One node]\n    B[Another node]\n```\n````\n";
  strictEqual(brokenParagraph(nested).length, 0);
});

test("reports a refused word as an error and gives the plain word in the message", () => {
  const found = plainWord("We utilize the cache.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"use"'), true);
});

test("reports a word the list refuses in one use and approves in another as a warning, naming both", () => {
  const found = plainWord("The page displays the number.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "warning");
  strictEqual(found[0].message.includes("verb"), true);
  strictEqual(found[0].message.includes("noun"), true);
  strictEqual(found[0].message.includes('"show"'), true);
});

test("never reports a technical word this work keeps, in any of its forms", () => {
  strictEqual(plainWord("Fix the hook, then run the test.").length, 0);
  strictEqual(plainWord("The check is running and the file states its need.").length, 0);
});

test("leaves a backticked span, a fenced block, front matter and an address alone", () => {
  strictEqual(plainWord("Never write `utilize` in prose.").length, 0);
  strictEqual(plainWord("```\nutilize the cache\n```").length, 0);
  strictEqual(plainWord("---\ndescription: utilize the cache\n---\n\nFine.\n").length, 0);
  strictEqual(plainWord("The page at https://example.com/provide-and-utilize states it.").length, 0);
});

test("matches every form of an owner's word and gives the matching form of the plain word", () => {
  const found = plainWord("The report claimed a result.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"said"'), true);
  strictEqual(plainWord("We swept the folder.")[0].message.includes('"go through every place"'), true);
});

test("lets the owner's plain word speak for a word the standard refuses too", () => {
  const found = plainWord("Guard the file.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"stop"'), true);
});

test("matches a word of the standard with a common ending on it", () => {
  strictEqual(plainWord("It utilizes the cache.").length, 1);
  strictEqual(plainWord("It is utilizing the cache.").length, 1);
  strictEqual(plainWord("Two processes run.").length, 1);
});

test("matches a refused phrase whole", () => {
  const found = plainWord("Do it prior to the run.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"before"'), true);
});

test("reports a word the list refuses in two uses once", () => {
  strictEqual(plainWord("One attempt is enough.").length, 1);
});

test("says when the list gives no other word for a refused one", () => {
  const found = plainWord("Bank the file.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes("another word"), true);
});

test("reads the words of a link and not its target, which no reader sees", () => {
  strictEqual(plainWord("- [Provide servers](#provide-servers)").length, 1);
});

test("gives every finding the same five fields", () => {
  const found = everyRule("It basically works — fine.");
  for (const one of found) {
    deepStrictEqual(Object.keys(one).sort(), ["line", "message", "rule", "severity"]);
  }
});

test("sorts findings by line", () => {
  const found = everyRule("It basically works.\n\nThe check ran; it stopped.");
  strictEqual(found[0].line <= found[found.length - 1].line, true);
});

test("gives nothing for text that breaks no rule", () => {
  strictEqual(everyRule("The check prints a report.\n").length, 0);
});

test("leaves YAML front matter alone, because a field is not a sentence", () => {
  strictEqual(brokenParagraph("---\ndescription: One thing\nname: another\n---\n\nReal prose here.\n").length, 0);
});

test("still reads the prose below the front matter", () => {
  strictEqual(emptyAdverb("---\nname: a\n---\n\nIt basically works.\n").length, 1);
});

test("leaves a line that only looks like a fence opener alone", () => {
  strictEqual(dash("---\nname: a — b\n---\n").length, 0);
});

test("reads the first line of a file that has no front matter", () => {
  strictEqual(dash("The export finished — at last.").length, 1);
});

test("reports an owner's word as an error where the approved section has the same word", () => {
  const entry = { word: "claim", part: "", plain: "say, says", source: "the owner", day: "2026-09-22", approvedAs: ["n"], forms: ["claim", "claims"] };
  const found = refusedWord(3, { word: "claim", entries: [entry] }, "claims");
  strictEqual(found.severity, "error");
  strictEqual(found.message.includes('"says"'), true);
});

test("reports a noun standing where a verb belongs and names the verb", () => {
  const found = nounForVerb("We make a decision here.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"decide"'), true);
  strictEqual(found[0].message.includes('"make a decision"'), true);
});

test("finds the noun after every form of the verb in front, with no article and in the plural", () => {
  strictEqual(nounForVerb("They made changes.").length, 1);
  strictEqual(nounForVerb("It is making use of the cache.").length, 1);
  strictEqual(nounForVerb("Carried out an inspection.").length, 1);
  strictEqual(nounForVerb("Take a look at the file.").length, 1);
});

test("leaves the verb alone, and a noun for a verb inside backticks", () => {
  strictEqual(nounForVerb("We decide here, then check the file.").length, 0);
  strictEqual(nounForVerb("Never write `make a decision` in prose.").length, 0);
});

test("names the plain word where the verb the noun came from is a refused word", () => {
  strictEqual(nounForVerb("Provide an indication of the state.")[0].message.includes('"show"'), true);
  strictEqual(nounForVerb("We made an assumption.")[0].message.includes('"think"'), true);
  strictEqual(nounForVerb("Give a confirmation.")[0].message.includes('"make sure"'), true);
});

test("leaves an analysis alone, because the list refuses the verb and gives the noun", () => {
  strictEqual(nounForVerb("Perform an analysis of the log, then carry out an analysis of the test.").length, 0);
});

test("reports a sentence ending on a phrase built on a word ending in ing", () => {
  const found = ingTail("The town grew fast, contributing to the development of the region.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"contributing"'), true);
});

test("leaves a comma before a word such as including or during alone", () => {
  strictEqual(ingTail("The check reads three files, including the manifest.").length, 0);
  strictEqual(ingTail("The hook runs once, during the write.").length, 0);
  strictEqual(ingTail("The file has one list, nothing else.").length, 0);
});

test("leaves a word ending in ing with no comma before it alone", () => {
  strictEqual(ingTail("The check is running and the file is missing.").length, 0);
});

test("leaves a table row and a heading alone for the ing tail, because neither is a sentence", () => {
  strictEqual(ingTail("| The check, running twice | fine |").length, 0);
  strictEqual(ingTail("## The check, running twice").length, 0);
});

test("reports each of the five ways of saying what a thing is not first", () => {
  strictEqual(notXButY("It is not only fast but also correct.").length, 1);
  strictEqual(notXButY("This is not just a check, it's a voice.").length, 1);
  strictEqual(notXButY("It's not the check, it's the voice.").length, 1);
  strictEqual(notXButY("It reads the file rather than merely opening it.").length, 1);
  strictEqual(notXButY("No setup, no config, no hassle.").length, 1);
});

test("names the way it found, and reports the stacked one once", () => {
  const found = notXButY("It's not just a check, it's a voice.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes("not just X, it's Y"), true);
});

test("leaves a plain not and but alone, and not only with no but in the same sentence", () => {
  strictEqual(notXButY("The check does not read the folder, but it reads the file.").length, 0);
  strictEqual(notXButY("Not only the check. But the hook too.").length, 0);
});

test("reports a phrase telling the reader that something matters", () => {
  const found = itMatters("This distinction matters. What matters is the result.");
  strictEqual(found.length, 2);
  strictEqual(found[0].message.includes('"distinction matters"'), true);
});

test("leaves the word matters alone outside those phrases", () => {
  strictEqual(itMatters("Two matters wait on the owner.").length, 0);
});

test("reports a benefit promised with no cost and names the phrase", () => {
  const found = benefitWithNoCost("It runs without requiring a build.");
  strictEqual(found.length, 1);
  strictEqual(found[0].message.includes('"without requiring"'), true);
});

test("leaves without alone when no benefit follows it", () => {
  strictEqual(benefitWithNoCost("The file is without a heading.").length, 0);
});

test("skips a fenced block and front matter in every new rule", () => {
  const text = "---\ndescription: not only fast but correct, without losing a thing\n---\n\n```\nmake a decision, contributing to it, this matters\n```\n";
  strictEqual(everyRule(text).length, 0);
});

test("reports a formal linking word and says to start the next sentence", () => {
  const found = linkingWord("The check ran. Furthermore, the hook ran too.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"Furthermore"'), true);
  strictEqual(found[0].message.includes("start the next sentence"), true);
  strictEqual(linkingWord("It runs in addition to the check, and consequently it fails.").length, 2);
});

test("leaves a sentence with no linking word alone, and a linking word inside backticks", () => {
  strictEqual(linkingWord("The check ran. The hook ran too, and the file was added.").length, 0);
  strictEqual(linkingWord("Never write `moreover` in prose.").length, 0);
});

test("reports a word that rates a thing and says to write what the thing does", () => {
  const found = ratingWord("The check is robust and dependable.");
  strictEqual(found.length, 2);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"robust"'), true);
  strictEqual(found[0].message.includes("what the thing does"), true);
});

test("leaves a longer word that opens on a rating word alone", () => {
  strictEqual(ratingWord("It essentially works, and the essentials are in the file.").length, 0);
});

test("reports a heavy verb standing where is or are belongs, and names the plain ones", () => {
  const found = servesAs("The gallery serves as the exhibition space.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"is" or "are"'), true);
  strictEqual(servesAs("The hook acts as a stop. The check functions as a filter. It stands as proof. It serves to stop a write.").length, 4);
});

test("leaves serves and acts alone when as or to does not follow", () => {
  strictEqual(servesAs("The waiter serves the table, and the actor acts.").length, 0);
});

test("reports a summary opening a sentence and says to delete the paragraph", () => {
  const found = summaryRepeat("The check ran. In summary, it found nothing.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes("Delete the paragraph"), true);
  strictEqual(summaryRepeat("Overall, the run passed.").length, 1);
  strictEqual(summaryRepeat("- To sum up, the run passed.").length, 1);
});

test("leaves the same words alone inside a sentence, and overall with no comma after it", () => {
  strictEqual(summaryRepeat("The line in summary form is short.").length, 0);
  strictEqual(summaryRepeat("The overall count is three.").length, 0);
});

test("reports a phrase announcing what comes next, with a straight or a curly apostrophe", () => {
  const found = whatComesNext("Looking ahead, the next batch adds five rules.");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"Looking ahead"'), true);
  strictEqual(whatComesNext("Let's dive in.").length, 1);
  strictEqual(whatComesNext("Let’s dive in.").length, 1);
  strictEqual(whatComesNext("In this section, we read the hook.").length, 1);
});

test("leaves a sentence that does the thing alone", () => {
  strictEqual(whatComesNext("The next batch adds five rules. The hook reads the file.").length, 0);
});

test("reports a machine word from the data file with its plain word", () => {
  const found = plainWord("The report delves into the intricate tapestry of the code.");
  strictEqual(found.length, 3);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"look at"'), true);
});

test("skips a fenced block, front matter and a backticked span in each of the five rules", () => {
  const text = "---\ndescription: furthermore, a robust check that serves as a stop\n---\n\n```\nIn summary, looking ahead\n```\n\nNever write `moreover`, `seamless`, `acts as`, `in conclusion` or `let's dive in` in prose.\n";
  strictEqual(everyRule(text).length, 0);
});

test("reports a phrase weakening everything and says to take the position", () => {
  const found = weakening("It may provide a fix. Some argue otherwise, and arguably it's worth noting the cost.");
  strictEqual(found.length, 4);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].message.includes('"may provide"'), true);
  strictEqual(found[0].message.includes("Take the position"), true);
  strictEqual(weakening("It’s worth noting that it could potentially fail.").length, 2);
});

test("leaves a position taken alone, and a weakening phrase inside backticks", () => {
  strictEqual(weakening("This is the wrong repair. I could not reproduce it on Windows, because I have no Windows machine.").length, 0);
  strictEqual(weakening("Never write `arguably` or `to some extent` in prose.").length, 0);
});

test("reports a heading in title case and says to write it in sentence case", () => {
  const found = titleCaseHeading("## The Impact Of Technology On Every Reader\n\nProse.\n");
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "error");
  strictEqual(found[0].line, 1);
  strictEqual(found[0].message.includes("sentence case"), true);
  strictEqual(titleCaseHeading("# Reading Every Markdown File Twice").length, 1);
});

test("leaves a heading in sentence case alone, and one whose capitals are short words or inside backticks", () => {
  strictEqual(titleCaseHeading("## The impact of technology\n").length, 0);
  strictEqual(titleCaseHeading("## The API And The CLI\n").length, 0);
  strictEqual(titleCaseHeading("## Impact Of Technology And Digitalization\n").length, 0);
  strictEqual(titleCaseHeading("## Run `Every Rule Twice` on the file\n").length, 0);
  strictEqual(titleCaseHeading("## Reading Claude Code on a Mac\n").length, 0);
  strictEqual(titleCaseHeading("Impact Of Technology And Digitalization\n").length, 0);
  strictEqual(titleCaseHeading("```\n## Impact Of Technology And Digitalization\n```\n").length, 0);
});

test("reports a text whose sentences all run the same length, once, on the first line of prose", () => {
  const sentence = "The check reads the file and prints a line.";
  const paragraph = Array(4).fill(sentence).join(" ");
  const found = sameLength(`# A heading\n\n${paragraph}\n\n${paragraph}\n`);
  strictEqual(found.length, 1);
  strictEqual(found[0].severity, "warning");
  strictEqual(found[0].line, 3);
  strictEqual(found[0].message.includes("short sentence after a long one"), true);
});

test("leaves a text alone whose sentence length changes, and one with fewer than eight sentences", () => {
  const changing = "The check runs. It reads every markdown file under the folder, and it prints one line for each rule a file breaks, with the line number. Then it stops. A warning never fails the run, because a person judges it. Done. The hook reads the same rules on every write, so a file that passes the check passes the hook too. It exits 2 on an error. Nothing else.";
  strictEqual(sameLength(changing).length, 0);
  strictEqual(distanceFromAverage(changing).sentences, 8);
  strictEqual(sameLength("The check reads the file. The check reads the file. The check reads the file. The check reads the file.").length, 0);
  strictEqual(distanceFromAverage("The check reads the file. The check reads the file."), null);
});

test("finds serve as and served as beside serves as, and as we'll see beside as we will see", () => {
  strictEqual(servesAs("The two files serve as the record, and one served as the draft.").length, 2);
  strictEqual(whatComesNext("As we'll see, the hook reads the file.").length, 1);
});

test("skips a fenced block, front matter and a backticked span in each of the last three rules", () => {
  const text = "---\ndescription: arguably it may provide a fix\n---\n\n```\n## A Title Case Heading Inside Code\nOne line. One line. One line. One line. One line. One line. One line. One line.\n```\n\nNever write `some argue` in prose.\n";
  strictEqual(everyRule(text).length, 0);
});
