// @ts-check
// Reads the name of a file, and the name of every folder on its path, against the refused words,
// because a person reads a name in a listing. A refused word in the name of the file is an error,
// because Claude picked that name in this write and can change it. One in a folder is a warning,
// because the folder was there before, and a blocked write cannot rename it. A name Anthropic's
// tools fix is skipped, and the data file lists those names so the skip is visible.

import { refused, technical, fixedNames } from "./refused-words.mjs";

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

/**
 * Gives every form of one word of the standard, with the endings the plain word rule reads.
 *
 * The endings are s, es, d, ed and ing. A word ending in e drops it before ing, a word ending in y
 * after a consonant takes ies and ied, and a short word such as `trip` doubles its last letter
 * before ed and ing. A phrase takes the endings on its first word.
 *
 * @param {string} word The word or phrase, lowercase.
 * @returns {string[]} Every form.
 */
function formsOf(word) {
  const [first, ...rest] = word.split(" ");
  const forms = [first, `${first}s`, `${first}es`, `${first}d`, `${first}ed`, `${first}ing`];
  if (first.endsWith("e")) forms.push(`${first.slice(0, -1)}ing`);
  if (/[^aeiou]y$/.test(first)) forms.push(`${first.slice(0, -1)}ies`, `${first.slice(0, -1)}ied`);
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(first)) forms.push(`${first}${first[first.length - 1]}ed`, `${first}${first[first.length - 1]}ing`);
  const tail = rest.map((one) => ` ${one}`).join("");
  return forms.map((one) => `${one}${tail}`);
}

/** Every form of a technical word this work keeps. A refused word with the same form is never reported. */
const TECHNICAL = new Set(technical.flatMap(formsOf));

/** Every form of a refused word, each with the entries that refuse it. An owner's entry lists its own forms. */
const REFUSED = new Map();
for (const entry of refused) {
  for (const form of entry.forms ?? formsOf(entry.word)) {
    if (TECHNICAL.has(form)) continue;
    if (!REFUSED.has(form)) REFUSED.set(form, []);
    REFUSED.get(form).push(entry);
  }
}

/** How many words the longest refused phrase has, which is how many words of a name are read at once. */
const LONGEST = Math.max(...[...REFUSED.keys()].map((form) => form.split(" ").length));

/** The names Anthropic's tools fix, which no finding names. */
const FIXED = new Set(fixedNames);

/**
 * Splits one segment of a path into its words.
 *
 * A word ends at a hyphen, a dot, a space or `_`. It also ends at a change from a lowercase
 * letter to an uppercase one. Every word comes back lowercase.
 *
 * @param {string} segment The name of one file or folder.
 * @returns {string[]} Its words.
 */
function wordsOf(segment) {
  return segment.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Gives the entries that refuse one form, from the word closest to it.
 *
 * A form such as `coating` is a word of the list and an ending of `coat`, and the longer word is
 * the one the list wrote for that form.
 *
 * @param {string} form The form, lowercase.
 * @returns {typeof refused} The entries.
 */
function entriesOf(form) {
  const all = REFUSED.get(form) ?? [];
  const longest = Math.max(...all.map((one) => one.word.length));
  return all.filter((one) => one.word.length === longest);
}

/**
 * Gives the plain word of one entry for the form that was hit.
 *
 * An owner's entry can list a form of the plain word for each form of the word, in the same
 * order, so the form that was hit takes the plain form at the same place.
 *
 * @param {typeof refused[number]} entry The entry.
 * @param {string} hit The form as the name writes it.
 * @returns {string} The plain word.
 */
function plainOf(entry, hit) {
  const plains = entry.plain.split(", ");
  const index = entry.forms ? entry.forms.indexOf(hit) : -1;
  return plains[index] ?? plains[0];
}

/**
 * Builds the finding for one refused word in one name.
 *
 * The severity follows two decisions. A word in the name of the file is an error and a word in a
 * folder is a warning, because Claude can change the first and not the second. A word the approved
 * section of the list also gives, in another use, is a warning wherever it sits, because a name has
 * no grammar and a pattern cannot tell a noun from a verb. An owner's entry is an error in every
 * form, whatever the approved section says.
 *
 * @param {string} segment The name the word sits in.
 * @param {boolean} isFile Whether the segment is the last one, which is the file's own name.
 * @param {string} hit The form as the name writes it.
 * @param {typeof refused} entries The entries that refuse it.
 * @returns {{ line: number, rule: string, severity: string, message: string }} The finding.
 */
function nameFinding(segment, isFile, hit, entries) {
  const owners = entries.filter((one) => one.forms);
  const chosen = owners.length > 0 ? owners : entries;
  const word = chosen[0].word;
  const uses = [...new Set(chosen.map((one) => one.part).filter(Boolean))].map((part) => USES.get(part) ?? part);
  const refusedAs = uses.length > 0 ? `as ${uses.join(" and as ")}` : "in every form";
  const approved = owners.length > 0 ? [] : [...new Set(entries.flatMap((one) => one.approvedAs))].map((part) => USES.get(part) ?? part);
  const plains = [...new Set(chosen.map((one) => plainOf(one, hit)))].filter((one) => one !== word && one !== hit);
  const named = plains.map((one) => `"${one}"`).join(" or ");
  const thing = isFile ? "file" : "folder";
  const severity = isFile && approved.length === 0 ? "error" : "warning";
  if (approved.length > 0) {
    const tail = named === "" ? "" : ` Rename the ${thing} with ${named} in place of "${hit}" where the name has ${uses.join(" or ")}.`;
    return { line: 0, rule: "refused-name", severity, message: `The list refuses "${hit}" ${refusedAs} and approves it as ${approved.join(" and as ")}, so judge which one the ${thing} "${segment}" has.${tail}` };
  }
  if (named === "") {
    return { line: 0, rule: "refused-name", severity, message: `The list refuses "${hit}" ${refusedAs} and gives no other word for it. Rename the ${thing} "${segment}" with another word, because a person reads the name in a listing.` };
  }
  return { line: 0, rule: "refused-name", severity, message: `Rename the ${thing} "${segment}" with ${named} in place of "${hit}", because a person reads the name in a listing.` };
}

/**
 * Reports a refused word in the name of a file, or in the name of a folder on its path.
 *
 * The path is split into segments, and each segment into words. A segment that is a name a tool
 * fixes is skipped. Every other word is read against the refused words, as the plain word rule
 * reads a word of prose, and a phrase such as `prior to` is read across two words. The finding
 * has no line, because a name sits on none, so its line is 0.
 *
 * @param {string} path The path of the file, relative to the project.
 * @returns {{ line: number, rule: string, severity: string, message: string }[]} The findings.
 */
export function refusedName(path) {
  const found = [];
  const segments = path.split(/[\\/]+/).filter((one) => one !== "" && one !== "." && one !== "..");
  segments.forEach((segment, index) => {
    if (FIXED.has(segment)) return;
    const isFile = index === segments.length - 1;
    const words = wordsOf(segment);
    let start = 0;
    while (start < words.length) {
      let length = Math.min(LONGEST, words.length - start);
      while (length > 0 && !REFUSED.has(words.slice(start, start + length).join(" "))) length -= 1;
      if (length === 0) {
        start += 1;
        continue;
      }
      const hit = words.slice(start, start + length).join(" ");
      found.push(nameFinding(segment, isFile, hit, entriesOf(hit)));
      start += length;
    }
  });
  return found;
}
