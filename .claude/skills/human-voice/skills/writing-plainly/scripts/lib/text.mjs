// @ts-check
// The rules a script decides, one function each. Every rule takes the text of one
// file and gives back a list of findings. No rule here reads the disk, so a test
// calls one with a string and nothing else. A rule names the words it bans, so in
// this file the check reads the comments alone and no string.

import { refused, technical } from "./refused-words.mjs";

/** A sentence longer than this is one the reader has to read twice. */
const LONGEST_SENTENCE = 25;

/** How the word list uses a word, written out for a message. */
const USES = new Map([
  ["v", "a verb"],
  ["n", "a noun"],
  ["adj", "an adjective"],
  ["adv", "an adverb"],
  ["prep", "a preposition"],
  ["conj", "a conjunction"],
  ["art", "an article"]
]);

/** An adverb that adds length and no meaning. */
const EMPTY_ADVERBS = ["very", "quite", "really", "basically", "essentially", "actually"];

/** Every form of each verb that does no work in front of a noun made from a verb. Serves the noun-for-verb rule. */
const EMPTY_VERBS = new Map([
  ["make", ["make", "makes", "made", "making"]],
  ["perform", ["perform", "performs", "performed", "performing"]],
  ["conduct", ["conduct", "conducts", "conducted", "conducting"]],
  ["carry out", ["carry out", "carries out", "carried out", "carrying out"]],
  ["provide", ["provide", "provides", "provided", "providing"]],
  ["give", ["give", "gives", "gave", "given", "giving"]],
  ["take", ["take", "takes", "took", "taken", "taking"]],
  ["reach", ["reach", "reaches", "reached", "reaching"]]
]);

/** A noun standing where a verb belongs, with the verb to write in its place. Where the verb the noun came from is a refused word, the entry names the plain word the data file gives for it. Serves the noun-for-verb rule. */
const NOUNS_FOR_VERBS = [
  { phrase: "make a decision", verb: "decide" },
  { phrase: "make a choice", verb: "choose" },
  { phrase: "make a change", verb: "change" },
  { phrase: "make a comparison", verb: "compare" },
  { phrase: "make a selection", verb: "select" },
  { phrase: "make an assumption", verb: "think" },
  { phrase: "make a determination", verb: "find" },
  { phrase: "make a recommendation", verb: "recommend" },
  { phrase: "make a correction", verb: "correct" },
  { phrase: "make an assessment", verb: "calculate" },
  { phrase: "make use of", verb: "use" },
  { phrase: "perform a check", verb: "check" },
  { phrase: "perform a review", verb: "review" },
  { phrase: "perform a test", verb: "test" },
  { phrase: "perform a search", verb: "search" },
  { phrase: "perform an inspection", verb: "examine" },
  { phrase: "conduct a check", verb: "check" },
  { phrase: "conduct a review", verb: "review" },
  { phrase: "conduct a test", verb: "test" },
  { phrase: "conduct a search", verb: "search" },
  { phrase: "conduct an inspection", verb: "examine" },
  { phrase: "carry out a check", verb: "check" },
  { phrase: "carry out a review", verb: "review" },
  { phrase: "carry out a test", verb: "test" },
  { phrase: "carry out a search", verb: "search" },
  { phrase: "carry out an inspection", verb: "examine" },
  { phrase: "provide a description", verb: "describe" },
  { phrase: "provide an explanation", verb: "explain" },
  { phrase: "provide a summary", verb: "summarize" },
  { phrase: "provide an indication", verb: "show" },
  { phrase: "provide a confirmation", verb: "make sure" },
  { phrase: "give a description", verb: "describe" },
  { phrase: "give an explanation", verb: "explain" },
  { phrase: "give a summary", verb: "summarize" },
  { phrase: "give an indication", verb: "show" },
  { phrase: "give a confirmation", verb: "make sure" },
  { phrase: "take a look", verb: "look" },
  { phrase: "take a decision", verb: "decide" },
  { phrase: "reach a conclusion", verb: "conclude" }
];

/** A word ending in ing that opens no tail, such as a preposition or a pronoun. Serves the ing-tail rule. */
const NOT_A_TAIL = [
  "including",
  "according",
  "regarding",
  "during",
  "following",
  "concerning",
  "notwithstanding",
  "pending",
  "excluding",
  "nothing",
  "something",
  "anything",
  "everything"
];

/**
 * The severity the ing-tail rule reports at.
 *
 * A comma and a word ending in ing also open an item of a list, such as the second item of
 * `picking the type, writing the diagram and rendering it`. On 2026-09-22, 13 of the first thirty
 * findings on the markdown files of the project that built this plugin were such a list. So the
 * rule reports a warning, for a reader to judge.
 */
const ING_TAIL_SEVERITY = "warning";

/** A phrase saying what a thing is not before what it is. Serves the not-x-but-y rule. */
const NOT_X_BUT_Y = [
  { name: "not only X but Y", pattern: "not only\\b[^.!?]{0,80}?\\bbut" },
  { name: "not just X, it's Y", pattern: "not just\\b[^.!?]{0,80}?,\\s*it['’]s" },
  { name: "it's not X, it's Y", pattern: "it['’]s not\\b[^.!?]{0,80}?,\\s*it['’]s" },
  { name: "rather than merely", pattern: "rather than merely" },
  { name: "no X, no Y, no Z", pattern: "no [\\w-]+, no [\\w-]+,? (?:and )?no [\\w-]+" }
];

/** A phrase telling the reader that something matters. Serves the it-matters rule. */
const IT_MATTERS = [
  "matters because",
  "distinction matters",
  "what matters more",
  "what matters is",
  "it matters that",
  "this matters"
];

/** A phrase promising a benefit with no cost. Serves the benefit-with-no-cost rule. */
const BENEFIT_WITH_NO_COST = [
  "without requiring",
  "without sacrificing",
  "without losing",
  "without compromising",
  "without needing",
  "without having to"
];

/** A formal linking word at the start of a step. Serves the linking-word rule. */
const LINKING_WORDS = [
  "furthermore",
  "moreover",
  "in addition",
  "additionally",
  "ultimately",
  "consequently",
  "subsequently"
];

/** A word that rates a thing without describing it. Serves the rating-word rule. */
const RATING_WORDS = [
  "dependable",
  "meaningful",
  "profound",
  "deliberate",
  "robust",
  "seamless",
  "powerful",
  "elegant",
  "comprehensive",
  "crucial",
  "vital",
  "pivotal",
  "essential"
];

/** A heavy verb standing where is or are belongs. Serves the serves-as rule. */
const SERVES_AS = [
  "serves as",
  "serve as",
  "served as",
  "functions as",
  "acts as",
  "stands as",
  "serves to"
];

/** A phrase that opens a summary of what was just said. The comma after the last one is part of the phrase. Serves the summary-repeat rule. */
const SUMMARY_REPEAT = [
  "in summary",
  "in conclusion",
  "to sum up",
  "all in all",
  "to summarize",
  "overall,"
];

/** A phrase announcing the text to come, rather than writing it. Serves the what-comes-next rule. */
const WHAT_COMES_NEXT = [
  "looking ahead",
  "in this section we will",
  "in this section, we",
  "what comes next",
  "as we will see",
  "as we'll see",
  "in the following sections",
  "let's dive in"
];

/** A phrase weakening everything, and naming nobody as the one who thinks it. Serves the weakening rule. */
const WEAKENING = [
  "may provide",
  "not necessarily",
  "some argue",
  "some would say",
  "it is worth noting",
  "it's worth noting",
  "it should be noted",
  "it is important to note",
  "arguably",
  "to some extent",
  "in some ways",
  "could potentially",
  "might possibly"
];

/** How many letters a word of a heading can have and still count for nothing, such as `a`, `the` or `API`. Serves the title-case-heading rule. */
const SHORT_WORD = 3;

/** How many words after the first, each starting with a capital letter, make a heading title case. Serves the title-case-heading rule. */
const CAPITALS_IN_TITLE_CASE = 3;

/** How many sentences a text needs before the rule measures their lengths. Serves the same-length rule. */
const FEWEST_SENTENCES = 8;

/**
 * The distance, in words, at or under which the length of a sentence reads as never changing.
 *
 * On 2026-09-22, the distance was measured on every markdown file of the project that built this
 * plugin. A sentence there is a fragment that ends in a sentence mark. Of the files with at least
 * eight sentences, the lowest distance was 0.63 words, the middle one 4.50 and the highest 21.48.
 * The ten lowest were lists of short items, such as eight lines of `Use X to do Y`, and each one
 * read flat. Every file that project wrote outside its work folder sat at 2.72 or above, and
 * read as a person's. So the figure is 2, which reported 98 of the 2,232 files.
 *
 * Serves the same-length rule.
 */
const FLAT_DISTANCE = 2;

/**
 * Blanks every span a rule must not read. Every line keeps its length.
 *
 * A rule names the words it bans, so a rulebook checked against itself would report
 * its own rule. Backticked text is the quotation, the command and the file name, and
 * none of those is prose. Blanking rather than cutting keeps every column number true.
 *
 * The target of a link and a bare address are blanked too. A reader never reads either one,
 * and the target of a link repeats the words of the link, so the same sentence was
 * reported twice. Changing one of those words would break the link.
 *
 * @param {string} line The line to blank.
 * @returns {string} The line with every backticked span turned into spaces.
 */
function outsideCode(line) {
  const blank = (span) => " ".repeat(span.length);
  return line
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\]\([^)\n]*\)/g, blank)
    .replace(/https?:\/\/\S+/g, blank);
}

/**
 * Splits text into lines, and marks every one a prose rule must not read.
 *
 * Two types of line are not prose. A fenced block has code, and YAML front matter at
 * the top of the file has fields. A rule that reads either one reports a fault that is
 * not there, which is how this rule first failed on its own output style.
 *
 * A fence is found after the indentation is taken off, because a command written under a
 * numbered step is indented. A check that read the first column alone reported every line
 * of such a block as a broken sentence.
 *
 * A block opened with four backticks closes on four or more, and a shorter run inside it is
 * content. A file showing a fenced example puts it inside a longer fence, and closing the
 * outer block on the inner one left the whole example being read as prose.
 *
 * @param {string} text The whole file.
 * @returns {{ text: string, number: number, skip: boolean }[]} One entry for each line.
 */
export function lines(text) {
  const all = text.split("\n");
  let matter = -1;
  if (all[0]?.trim() === "---") {
    const close = all.findIndex((one, index) => index > 0 && one.trim() === "---");
    if (close > 0) matter = close;
  }
  let open = "";
  return all.map((one, index) => {
    const found = one.trimStart().match(/^(`{3,}|~{3,})/);
    let fence = false;
    if (found) {
      const mark = found[1];
      if (open === "") {
        open = mark;
        fence = true;
      } else if (mark[0] === open[0] && mark.length >= open.length) {
        open = "";
        fence = true;
      }
    }
    return { text: one, number: index + 1, skip: open !== "" || fence || index <= matter };
  });
}

/**
 * Builds one finding.
 *
 * @param {number} line The line the break sits on.
 * @param {string} rule The name of the rule that found it.
 * @param {string} severity Either `error` or `warning`.
 * @param {string} message A sentence naming the change that fixes it.
 * @returns {{ line: number, rule: string, severity: string, message: string }} The finding.
 */
function finding(line, rule, severity, message) {
  return { line, rule, severity, message };
}

/**
 * Reports an em dash or an en dash in prose.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function dash(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/[—–]/.test(outsideCode(line.text))) {
      found.push(finding(line.number, "dash", "error", "Replace the dash with a comma, a colon or a new sentence."));
    }
  }
  return found;
}

/**
 * Reports an adverb that adds length and no meaning.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function emptyAdverb(text) {
  const found = [];
  const pattern = new RegExp(`\\b(${EMPTY_ADVERBS.join("|")})\\b`, "gi");
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(pattern)) {
      found.push(finding(line.number, "empty-adverb", "error", `Cut "${hit[1]}", which adds length and no meaning.`));
    }
  }
  return found;
}

/**
 * Reports a sentence that opens on there is or there are.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function thereIs(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/(^|[.!?]\s+|^[-*]\s+)there\s+(is|are|was|were)\b/i.test(outsideCode(line.text))) {
      found.push(finding(line.number, "there-is", "error", "Open on the real subject instead of there is or there are."));
    }
  }
  return found;
}

/**
 * Reports a semicolon joining two sentences.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function semicolon(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/;\s+\w/.test(outsideCode(line.text))) {
      found.push(finding(line.number, "semicolon", "error", "Split the two halves into two sentences, which read faster than one long one."));
    }
  }
  return found;
}

/**
 * Reports a sentence longer than the ceiling.
 *
 * The emphasis marks come off before the split. A paragraph that opens with a bold lead-in ending
 * in a period reads as two sentences, and the split looks at the character before the space. That
 * character is a star rather than the period, so the lead-in and the sentence after it were
 * counted as one. Real files showed it, in a log where every paragraph opens with a bold lead-in.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function longSentence(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/^\s*\|/.test(line.text) || /^\s*#/.test(line.text)) continue;
    const prose = outsideCode(line.text)
      .replace(/^\s*[-*]\s+/, "")
      .replace(/^\s*\d+\.\s+/, "")
      .replace(/\*\*|__|\*|_/g, "");
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      const words = sentence.trim().split(/\s+/).filter(Boolean);
      if (words.length > LONGEST_SENTENCE) {
        found.push(finding(line.number, "long-sentence", "error", `Split this sentence of ${words.length} words, because a reader loses one past ${LONGEST_SENTENCE}.`));
      }
    }
  }
  return found;
}

/**
 * Reports a paragraph broken across lines.
 *
 * Markdown breaks the line at the window edge on its own, so a break at a fixed column helps
 * nobody and fights every window that is not that width. Two prose lines in a row, where the
 * first does not end a sentence, is that break.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function brokenParagraph(text) {
  const found = [];
  const all = lines(text);
  for (let index = 0; index < all.length - 1; index += 1) {
    const here = all[index];
    const next = all[index + 1];
    if (here.skip || next.skip) continue;
    const prose = (one) => one.trim() !== "" && !/^\s*([-*>|#]|\d+\.)/.test(one) && !one.startsWith("---");
    if (!prose(here.text) || !prose(next.text)) continue;
    if (/[.!?:]$/.test(here.text.trim())) continue;
    found.push(finding(here.number, "broken-paragraph", "error", "Join this line to the one below, because markdown wraps to the window on its own."));
  }
  return found;
}

/**
 * Makes a word safe to put inside a pattern.
 *
 * @param {string} text The word.
 * @returns {string} The word, with every mark a pattern reads escaped.
 */
function escaped(text) {
  return text.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

/**
 * Builds the pattern for one word of the standard, with the common endings it takes.
 *
 * The endings are s, es, d, ed and ing. A word ending in e drops it before ing, a word ending
 * in y after a consonant takes ies and ied, and a short word such as `trip` doubles its last
 * letter before ed and ing. A phrase takes the endings on its first word, which is the verb in
 * a phrase such as `carry out`.
 *
 * @param {string} word The word or phrase, lowercase.
 * @returns {string} The pattern, with no group that captures.
 */
function withEndings(word) {
  const [head, ...rest] = word.split(" ");
  const patterns = [`${escaped(head)}(?:s|es|d|ed|ing)?`];
  if (head.endsWith("e")) patterns.push(`${escaped(head.slice(0, -1))}ing`);
  if (/[^aeiou]y$/.test(head)) patterns.push(`${escaped(head.slice(0, -1))}(?:ies|ied)`);
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(head)) patterns.push(`${escaped(head)}${head.at(-1)}(?:ed|ing)`);
  return `(?:${patterns.join("|")})${rest.map((one) => `\\s+${escaped(one)}`).join("")}`;
}

/**
 * Groups the refused entries by word, each group with the pattern that finds its word.
 *
 * An owner's entry lists every form it matches, and a standard's entry takes the common
 * endings. A word both give makes one group, so one hit is reported once. The longest word
 * comes first, so a phrase such as `carry out` wins against the word that opens it.
 *
 * @param {typeof refused} entries Every refused entry.
 * @returns {{ word: string, entries: typeof refused, pattern: string, whole: RegExp }[]} The groups.
 */
function groupsOf(entries) {
  const byWord = new Map();
  for (const one of entries) {
    if (!byWord.has(one.word)) byWord.set(one.word, []);
    byWord.get(one.word).push(one);
  }
  const groups = [];
  for (const [word, own] of byWord) {
    const patterns = new Set();
    for (const one of own) {
      if (one.forms) for (const form of one.forms) patterns.add(escaped(form));
      else patterns.add(withEndings(word));
    }
    const pattern = `(?:${[...patterns].join("|")})`;
    groups.push({ word, entries: own, pattern, whole: new RegExp(`^${pattern}$`, "i") });
  }
  return groups.sort((one, two) => two.word.length - one.word.length);
}

/** The refused words by word, each with the pattern that finds it. */
const GROUPS = groupsOf(refused);

/** Finds every refused word in a line, in any of its forms. */
const REFUSED = new RegExp(`\\b(${GROUPS.map((one) => one.pattern).join("|")})\\b`, "gi");

/** Matches a technical word this work keeps, in any of its forms. The rule never reports one. */
const TECHNICAL = new RegExp(`^(?:${technical.map(withEndings).join("|")})$`, "i");

/**
 * Gives the plain word of one entry for the form that was hit.
 *
 * An owner's entry can list a form of the plain word for each form of the word, in the same
 * order, so the form that was hit takes the plain form at the same place.
 *
 * @param {typeof refused[number]} entry The entry.
 * @param {string} hit The word as the line writes it.
 * @returns {string} The plain word.
 */
function plainOf(entry, hit) {
  const plains = entry.plain.split(", ");
  const index = entry.forms ? entry.forms.indexOf(hit.toLowerCase()) : -1;
  return plains[index] ?? plains[0];
}

/**
 * Builds the finding for one hit of a refused word.
 *
 * The owner's entry speaks for a word the standard refuses too, because the owner wrote the
 * plain word for this project's own text. The owner refuses the word in every form, so an
 * owner's entry is an error whatever the approved section of the list says. A word of the
 * standard that the approved section also gives, in another use, is a warning for a reader to
 * judge, because a pattern cannot tell a noun from a verb. Every other refused word is an error.
 *
 * @param {number} line The line the hit sits on.
 * @param {{ word: string, entries: typeof refused }} group The entries that refuse the word.
 * @param {string} hit The word as the line writes it.
 * @returns {{ line: number, rule: string, severity: string, message: string }} The finding.
 */
export function refusedWord(line, group, hit) {
  const owners = group.entries.filter((one) => one.forms);
  const chosen = owners.length > 0 ? owners : group.entries;
  const uses = [...new Set(chosen.map((one) => one.part).filter(Boolean))].map((part) => USES.get(part) ?? part);
  const refusedAs = uses.length > 0 ? `as ${uses.join(" and as ")}` : "in every form";
  const approved = [...new Set(group.entries.flatMap((one) => one.approvedAs))].map((part) => USES.get(part) ?? part);
  const plains = [...new Set(chosen.map((one) => plainOf(one, hit)))].filter((one) => one !== group.word);
  const named = plains.map((one) => `"${one}"`).join(" or ");
  if (owners.length === 0 && approved.length > 0) {
    const write = uses.length > 0 ? `As ${uses.join(" or ")}, write` : "Write";
    const tail = named === "" ? "" : ` ${write} ${named}.`;
    return finding(line, "plain-word", "warning", `The list refuses "${hit}" ${refusedAs} and approves it as ${approved.join(" and as ")}, so judge which one this sentence has.${tail}`);
  }
  if (named === "") {
    return finding(line, "plain-word", "error", `The list refuses "${hit}" ${refusedAs} and gives no other word for it. Write the sentence with another word.`);
  }
  return finding(line, "plain-word", "error", `Write ${named} rather than "${hit}", because a reader stops to decode the harder word.`);
}

/**
 * Reports a refused word, with the plain word to write in its place.
 *
 * The words sit in the data file beside this one. A word inside a backticked span, a fenced
 * block, front matter or an address is never read, and a technical word this work keeps is
 * never reported.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function plainWord(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(REFUSED)) {
      if (TECHNICAL.test(hit[1])) continue;
      const group = GROUPS.find((one) => one.whole.test(hit[1]));
      if (group) found.push(refusedWord(line.number, group, hit[1]));
    }
  }
  return found;
}

/**
 * Builds the pattern that finds any phrase of a list, whole and whatever the case of the letters.
 *
 * A straight apostrophe in a phrase finds the curly one too, because an editor writes either.
 *
 * @param {string[]} phrases The phrases, lowercase, with one space between words.
 * @returns {RegExp} The pattern, which captures the phrase it found.
 */
function anyOf(phrases) {
  return new RegExp(`\\b(${phrases.map((one) => escaped(one).replace(/ /g, "\\s+").replace(/'/g, "['’]")).join("|")})\\b`, "gi");
}

/**
 * Builds the pattern that finds one noun standing where a verb belongs.
 *
 * The phrase is written in its plain case, such as `make a decision`. The pattern takes every
 * form of the verb in front, then `a`, `an`, `the` or nothing, then the noun in the plural too.
 * So one entry finds `made changes` and `making the decisions` too.
 *
 * @param {{ phrase: string, verb: string }} entry The entry.
 * @returns {RegExp} The pattern, which matches whole words whatever the case of the letters.
 */
function nounForVerbPattern(entry) {
  const found = entry.phrase.match(/^(\w+(?: out)?)(?: (?:a|an|the))? (.+)$/);
  if (!found) throw new Error(`Write the phrase "${entry.phrase}" as a verb, then a, an, the or nothing, then a noun.`);
  const forms = (EMPTY_VERBS.get(found[1]) ?? [found[1]]).map((one) => escaped(one).replace(/ /g, "\\s+"));
  const [head, ...rest] = found[2].split(" ");
  const noun = [`${escaped(head)}(?:s|es)?`, ...rest.map(escaped)].join("\\s+");
  return new RegExp(`\\b(?:${forms.join("|")})\\s+(?:(?:a|an|the)\\s+)?${noun}\\b`, "gi");
}

/** Every noun standing where a verb belongs, with the pattern that finds it. */
const NOUN_FOR_VERB_PATTERNS = NOUNS_FOR_VERBS.map((one) => ({ ...one, pattern: nounForVerbPattern(one) }));

/** Finds a comma, then a word ending in ing. */
const ING_TAIL = /,\s+([a-z]+ing)\b/gi;

/** Every phrase saying what a thing is not before what it is, with the pattern that finds it. */
const NOT_X_BUT_Y_PATTERNS = NOT_X_BUT_Y.map((one) => ({ ...one, pattern: new RegExp(`\\b${one.pattern}\\b`, "gi") }));

/** Finds a phrase telling the reader that something matters. */
const IT_MATTERS_PATTERN = anyOf(IT_MATTERS);

/** Finds a phrase promising a benefit with no cost. */
const BENEFIT_WITH_NO_COST_PATTERN = anyOf(BENEFIT_WITH_NO_COST);

/** Finds a formal linking word. */
const LINKING_WORD_PATTERN = anyOf(LINKING_WORDS);

/** Finds a word that rates a thing without describing it. */
const RATING_WORD_PATTERN = anyOf(RATING_WORDS);

/** Finds a heavy verb standing where is or are belongs. */
const SERVES_AS_PATTERN = anyOf(SERVES_AS);

/** Finds a phrase opening a summary at the start of a line, of a list item or of a sentence after a full stop. */
const SUMMARY_REPEAT_PATTERN = new RegExp(`(?:^\\s*(?:[-*]\\s+|\\d+\\.\\s+)?|[.!?]\\s+)(${SUMMARY_REPEAT.map((one) => escaped(one).replace(/ /g, "\\s+")).join("|")})(?!\\w)`, "gi");

/** Finds a phrase announcing the text to come. */
const WHAT_COMES_NEXT_PATTERN = anyOf(WHAT_COMES_NEXT);

/** Finds a phrase weakening everything. */
const WEAKENING_PATTERN = anyOf(WEAKENING);

/** Finds a markdown heading, and captures the words after its marks. */
const HEADING = /^\s*#{1,6}\s+(.*?)\s*$/;

/** Matches a word that starts with a capital letter and has enough letters to count. */
const CAPITAL_WORD = new RegExp(`^[A-Z][A-Za-z]{${SHORT_WORD},}`);

/**
 * Reports a noun standing where a verb belongs, and names the verb to write in its place.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function nounForVerb(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    const prose = outsideCode(line.text);
    for (const entry of NOUN_FOR_VERB_PATTERNS) {
      for (const hit of prose.matchAll(entry.pattern)) {
        found.push(finding(line.number, "noun-for-verb", "error", `Write "${entry.verb}" rather than "${hit[0]}", because the noun stands where the verb belongs.`));
      }
    }
  }
  return found;
}

/**
 * Reports a sentence that ends on a phrase built on a word ending in ing.
 *
 * The tail adds a judgement the sentence did not earn. A pattern cannot tell a verb from a
 * noun, so the rule reads the form alone: a comma, then a word ending in ing, then the rest of
 * the sentence. A word that opens no tail, such as `including`, is on a list and left alone.
 * A table row and a line opening with `#` are skipped, because neither one is a sentence.
 *
 * The same form opens an item of a list, and the comment on the severity constant says how
 * often that happened when the severity was set.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function ingTail(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/^\s*\|/.test(line.text) || /^\s*#/.test(line.text)) continue;
    for (const sentence of outsideCode(line.text).split(/(?<=[.!?])\s+/)) {
      for (const hit of sentence.matchAll(ING_TAIL)) {
        if (NOT_A_TAIL.includes(hit[1].toLowerCase())) continue;
        found.push(finding(line.number, "ing-tail", ING_TAIL_SEVERITY, `Cut the tail from "${hit[1]}" on, or write it as its own sentence, because it adds a judgement the sentence did not earn.`));
      }
    }
  }
  return found;
}

/**
 * Reports a phrase saying what a thing is not before what it is.
 *
 * Two of the phrases can match one span, because `it's not just X, it's Y` has both of them in
 * it. A hit inside a span another phrase already took is reported once.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function notXButY(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    const prose = outsideCode(line.text);
    const taken = [];
    for (const entry of NOT_X_BUT_Y_PATTERNS) {
      for (const hit of prose.matchAll(entry.pattern)) {
        const start = hit.index ?? 0;
        const end = start + hit[0].length;
        if (taken.some(([from, to]) => start < to && end > from)) continue;
        taken.push([start, end]);
        found.push(finding(line.number, "not-x-but-y", "error", `Say what the thing is and stop, because "${entry.name}" says what it is not first.`));
      }
    }
  }
  return found;
}

/**
 * Reports a phrase telling the reader that something matters.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function itMatters(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(IT_MATTERS_PATTERN)) {
      found.push(finding(line.number, "it-matters", "error", `Show the result rather than writing "${hit[1]}", because a reader decides what matters.`));
    }
  }
  return found;
}

/**
 * Reports a phrase promising a benefit with no cost.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function benefitWithNoCost(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(BENEFIT_WITH_NO_COST_PATTERN)) {
      found.push(finding(line.number, "benefit-with-no-cost", "error", `Name the cost that "${hit[1]}" hides, because real work has a cost.`));
    }
  }
  return found;
}

/**
 * Reports a formal linking word at the start of a step.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function linkingWord(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(LINKING_WORD_PATTERN)) {
      found.push(finding(line.number, "linking-word", "error", `Cut "${hit[1]}" and start the next sentence, because a writer often needs no linking word at all.`));
    }
  }
  return found;
}

/**
 * Reports a word that rates a thing without describing it.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function ratingWord(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(RATING_WORD_PATTERN)) {
      found.push(finding(line.number, "rating-word", "error", `Replace "${hit[1]}" with what the thing does, such as how long it has run without failing, because a rating describes nothing.`));
    }
  }
  return found;
}

/**
 * Reports a heavy verb standing where is or are belongs.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function servesAs(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(SERVES_AS_PATTERN)) {
      found.push(finding(line.number, "serves-as", "error", `Write "is" or "are" rather than "${hit[1]}", because the heavy verb stands where the plain one belongs.`));
    }
  }
  return found;
}

/**
 * Reports a sentence that opens on a summary of what was just said.
 *
 * The phrase is read at the start of a line, of a list item or of a sentence after a full stop,
 * because the same words inside a sentence, such as `in summary form`, open no summary.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function summaryRepeat(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(SUMMARY_REPEAT_PATTERN)) {
      found.push(finding(line.number, "summary-repeat", "error", `Delete the paragraph that opens with "${hit[1]}", because the reader just read the section.`));
    }
  }
  return found;
}

/**
 * Reports a phrase announcing the text to come, rather than writing it.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function whatComesNext(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(WHAT_COMES_NEXT_PATTERN)) {
      found.push(finding(line.number, "what-comes-next", "error", `Do the thing rather than announcing it with "${hit[1]}", because an announcement gives the reader nothing to use.`));
    }
  }
  return found;
}

/**
 * Reports a phrase weakening everything, and naming nobody as the one who thinks it.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function weakening(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    for (const hit of outsideCode(line.text).matchAll(WEAKENING_PATTERN)) {
      found.push(finding(line.number, "weakening", "error", `Take the position rather than writing "${hit[1]}", or name the one thing that could not be found out.`));
    }
  }
  return found;
}

/**
 * Reports a markdown heading in title case.
 *
 * A heading is title case where three or more words after the first start with a capital letter.
 * A word of one to three letters, such as `a`, `the` or `API`, counts for nothing, and so does a
 * word inside backticks. The first word is skipped, because sentence case gives it a capital too.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function titleCaseHeading(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    const heading = line.text.match(HEADING);
    if (!heading) continue;
    const prose = outsideCode(heading[1]);
    const words = [...heading[1].matchAll(/\S+/g)].map((hit) => prose.slice(hit.index, hit.index + hit[0].length).trim().replace(/^[^A-Za-z]+/, ""));
    const capitals = words.slice(1).filter((one) => CAPITAL_WORD.test(one));
    if (capitals.length >= CAPITALS_IN_TITLE_CASE) {
      found.push(finding(line.number, "title-case-heading", "error", "Write this heading in sentence case, so only the first word and a name start with a capital letter."));
    }
  }
  return found;
}

/**
 * Splits the prose of a text into sentences, each with its word count and its line.
 *
 * A table row and a heading are skipped, because neither one is a sentence. A fragment with no
 * sentence mark at its end, such as an item of a list, is skipped too. The list marker and the
 * emphasis marks come off before the split, as they do for the long-sentence rule.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, words: number }[]} One entry for each sentence, in order.
 */
function sentencesOf(text) {
  const found = [];
  for (const line of lines(text)) {
    if (line.skip) continue;
    if (/^\s*\|/.test(line.text) || /^\s*#/.test(line.text)) continue;
    const prose = outsideCode(line.text)
      .replace(/^\s*[-*]\s+/, "")
      .replace(/^\s*\d+\.\s+/, "")
      .replace(/\*\*|__|\*|_/g, "");
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      const trimmed = sentence.trim();
      if (!/[.!?]["'”’)\]]*$/.test(trimmed)) continue;
      found.push({ line: line.number, words: trimmed.split(/\s+/).filter(Boolean).length });
    }
  }
  return found;
}

/**
 * Measures how far the word count of each sentence sits from the average, in the whole text.
 *
 * The distance is the average, across every sentence, of the difference between its word count
 * and the average word count, with the sign taken off. A text with fewer sentences than the
 * rule needs gives null.
 *
 * @param {string} text The whole file.
 * @returns {{ sentences: number, average: number, distance: number, line: number } | null} The measurement, with the first line of prose.
 */
export function distanceFromAverage(text) {
  const all = sentencesOf(text);
  if (all.length < FEWEST_SENTENCES) return null;
  const average = all.reduce((sum, one) => sum + one.words, 0) / all.length;
  const distance = all.reduce((sum, one) => sum + Math.abs(one.words - average), 0) / all.length;
  return { sentences: all.length, average, distance, line: all[0].line };
}

/**
 * Reports a text whose sentence length never changes, once, on the first line of prose.
 *
 * The sign belongs to the whole text, so one finding stands for it. The rule reports a warning,
 * because a person judges rhythm, and the number only points at a text worth a look.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function sameLength(text) {
  const measured = distanceFromAverage(text);
  if (measured === null || measured.distance > FLAT_DISTANCE) return [];
  return [finding(measured.line, "same-length", "warning", `Write a short sentence after a long one, on purpose, because the sentences here all run near ${Math.round(measured.average)} words.`)];
}

/** Every rule this library has, by the name in its findings. */
export const RULES = new Map([
  ["dash", dash],
  ["empty-adverb", emptyAdverb],
  ["there-is", thereIs],
  ["semicolon", semicolon],
  ["long-sentence", longSentence],
  ["broken-paragraph", brokenParagraph],
  ["plain-word", plainWord],
  ["noun-for-verb", nounForVerb],
  ["ing-tail", ingTail],
  ["not-x-but-y", notXButY],
  ["it-matters", itMatters],
  ["benefit-with-no-cost", benefitWithNoCost],
  ["linking-word", linkingWord],
  ["rating-word", ratingWord],
  ["serves-as", servesAs],
  ["summary-repeat", summaryRepeat],
  ["what-comes-next", whatComesNext],
  ["weakening", weakening],
  ["title-case-heading", titleCaseHeading],
  ["same-length", sameLength]
]);

/**
 * Runs every rule on one text.
 *
 * @param {string} text The whole file.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} Every finding, by line.
 */
export function everyRule(text) {
  const found = [];
  for (const rule of RULES.values()) found.push(...rule(text));
  return found.sort((one, two) => one.line - two.line || one.rule.localeCompare(two.rule));
}
