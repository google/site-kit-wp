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
// Turns every part of a code file that a person does not read into spaces, so the writing rules
// read a comment and a string a person sees, and nothing else. Every line keeps its length, so
// the line and the column a rule reports stay true. The extension of the file says what opens a
// comment and a string. A file whose extension this library does not know stays whole. A file
// can ask, in its opening comment, for its comments alone to be read, and then no string in it
// is read. A file that lists the words a rule bans asks for that, so its own data is never reported.
// A string inside a WordPress translation call, such as `__( 'Save', 'domain' )`, is never read
// either. Design owns that copy, and a reviewer must not suggest wording changes to it.

/** How many words a string needs before a person is taken to read it. A shorter one is a name, a pattern or a field. */
const SHORTEST_STRING = 4;

/** The phrase an opening comment says to ask for the comments alone. A file whose opening comment has it gives no string. */
const COMMENTS_ALONE = "the check reads the comments alone";

/** The words of code before a slash that opens a pattern rather than a division. */
const BEFORE_A_PATTERN = new Set(["return", "typeof", "case", "do", "else", "in", "of", "instanceof", "new", "delete", "void", "throw", "yield", "await"]);

/** The marks of code before a slash that opens a pattern rather than a division. */
const MARKS_BEFORE_A_PATTERN = "(,=:[!&|?{};+-*%<>~^";

/** A mark that opens a comment only at the start of a line or after a space. Elsewhere it marks a color, a private field or a count. */
const AFTER_A_SPACE = new Set(["#", ";"]);

/** The WordPress translation calls whose string arguments are copy from design. A string inside one is never read, whatever its word count. */
const TRANSLATION_CALLS = new Set(["__", "_e", "_x", "_n", "esc_html__", "esc_html_e", "esc_html_x", "esc_attr__", "esc_attr_e", "esc_attr_x"]);

/**
 * What opens a comment and a string in one family of files.
 *
 * `line` opens a comment that ends with the line. `block` is a pair that opens and closes a
 * comment. `quotes` open a string that ends with the line. `whole` open a string of many lines
 * that stays whole. `template` says a backtick opens a string with `${}` code inside it, and
 * that a slash can open a pattern. `tags` says a string counts only inside a tag. `values` says a
 * string before a colon is the name of a field, which nobody reads.
 *
 * @typedef {{ line?: string[], block?: [string, string][], quotes?: string[], whole?: string[], template?: boolean, tags?: boolean, values?: boolean }} Grammar
 */

/** @type {Grammar} */
const SLASHES = { line: ["//"], block: [["/*", "*/"]], quotes: ['"', "'"] };

/** @type {Grammar} */
const SCRIPT = { ...SLASHES, template: true };

/** @type {Grammar} */
const HASHES = { line: ["#"], quotes: ['"', "'"] };

/** @type {Grammar} */
const PYTHON = { ...HASHES, whole: ['"""', "'''"] };

/** @type {Grammar} */
const MARKUP = { block: [["<!--", "-->"]], quotes: ['"', "'"], tags: true };

/** The grammar of each extension this library knows. A prose file is not here, because the whole of it is read. */
const GRAMMARS = new Map([
  [".mjs", SCRIPT],
  [".js", SCRIPT],
  [".cjs", SCRIPT],
  [".ts", SCRIPT],
  [".tsx", SCRIPT],
  [".jsx", SCRIPT],
  [".php", { ...SLASHES, line: ["//", "#"] }],
  [".java", SLASHES],
  [".go", SLASHES],
  [".rs", SLASHES],
  [".c", SLASHES],
  [".h", SLASHES],
  [".cpp", SLASHES],
  [".cs", SLASHES],
  [".swift", SLASHES],
  [".kt", SLASHES],
  [".css", { block: [["/*", "*/"]], quotes: ['"', "'"] }],
  [".scss", SLASHES],
  [".less", SLASHES],
  [".py", PYTHON],
  [".rb", HASHES],
  [".sh", HASHES],
  [".bash", HASHES],
  [".zsh", HASHES],
  [".yaml", HASHES],
  [".yml", HASHES],
  [".toml", PYTHON],
  [".ini", { line: ["#", ";"], quotes: ['"', "'"] }],
  [".html", MARKUP],
  [".htm", MARKUP],
  [".xml", MARKUP],
  [".svg", MARKUP],
  [".vue", MARKUP],
  [".json", { quotes: ['"'], values: true }]
]);

/**
 * Counts the words of a string, where a word is a run of characters with a letter in it.
 *
 * @param {string} content The string, without its quotes.
 * @returns {number} The count.
 */
function wordsIn(content) {
  return content.replace(/\\[nrt]/g, " ").split(/\s+/).filter((one) => /\p{L}/u.test(one)).length;
}

/**
 * Blanks every part of one file that a person does not read.
 *
 * The text is walked once, one character at a time. A comment stays without its marks, and a
 * star that opens a line of a block comment is a mark too. A string stays when it has enough
 * words, without its quotes, and a backslash inside it is blanked with the newline it writes. A
 * pattern between slashes, a division, a name and every other part of the code is blanked.
 *
 * A string inside a WordPress translation call is blanked too, whatever its word count, up to
 * the bracket that closes the call. The name of the call opens the skip, and a bracket inside
 * the call deepens it. A comment inside the call still stays.
 *
 * A string is still read to its closing quote when none is kept, so a comment mark inside a
 * string opens no comment in a file that asks for its comments alone.
 *
 * @param {string} text The whole file.
 * @param {Grammar} grammar What opens a comment and a string in this file.
 * @param {boolean} strings Whether a string of enough words is kept. A file that asks for its comments alone keeps none.
 * @returns {string} The same text, with every part a person does not read turned into spaces.
 */
function blanked(text, grammar, strings) {
  const out = Array.from(text, (one) => (one === "\n" || one === "\r" ? one : " "));
  const lineEnd = (from) => {
    const found = text.indexOf("\n", from);
    return found === -1 ? text.length : found;
  };

  const keepComment = (from, to) => {
    let opensLine = true;
    for (let at = from; at < to; at += 1) {
      const one = text[at];
      if (one === "\n") {
        opensLine = true;
      } else if (opensLine && one === "*") {
        opensLine = false;
      } else {
        if (!/\s/.test(one)) opensLine = false;
        out[at] = one;
      }
    }
  };

  const keepString = (from, to) => {
    for (let at = from; at < to; at += 1) {
      if (text[at] === "\\" && at + 1 < to) {
        at += 1;
        if (!"nrt".includes(text[at])) out[at] = text[at];
      } else {
        out[at] = text[at];
      }
    }
  };

  const isFieldName = (after) => {
    let at = after;
    while (at < text.length && /\s/.test(text[at])) at += 1;
    return text[at] === ":";
  };

  let at = 0;
  let last = "";
  let word = "";
  let inTag = false;
  // How many brackets are open inside a translation call. At 0 the walk is outside one.
  let call = 0;
  const templates = [];
  const expressions = [];

  while (at < text.length) {
    const one = text[at];

    if (templates.length > expressions.length) {
      const current = templates[templates.length - 1];
      if (one === "\\") {
        at += 2;
      } else if (one === "`") {
        current.parts.push([current.from, at]);
        templates.pop();
        const content = current.parts.map(([from, to]) => text.slice(from, to)).join(" ");
        if (strings && call === 0 && wordsIn(content) >= SHORTEST_STRING) for (const [from, to] of current.parts) keepString(from, to);
        last = "`";
        word = "";
        at += 1;
      } else if (one === "$" && text[at + 1] === "{") {
        current.parts.push([current.from, at]);
        expressions.push(0);
        last = "{";
        word = "";
        at += 2;
      } else {
        at += 1;
      }
      continue;
    }

    if (at === 0 && text.startsWith("#!")) {
      at = lineEnd(at);
      continue;
    }

    const lineMark = grammar.line?.find((mark) => text.startsWith(mark, at) && (!AFTER_A_SPACE.has(mark) || at === 0 || /\s/.test(text[at - 1])));
    if (lineMark) {
      let from = at + lineMark.length;
      while (from < text.length && (text[from] === lineMark[lineMark.length - 1] || text[from] === "!")) from += 1;
      const end = lineEnd(from);
      keepComment(from, end);
      at = end;
      continue;
    }

    const block = grammar.block?.find(([open]) => text.startsWith(open, at));
    if (block) {
      const close = text.indexOf(block[1], at + block[0].length);
      keepComment(at + block[0].length, close === -1 ? text.length : close);
      at = close === -1 ? text.length : close + block[1].length;
      continue;
    }

    const whole = grammar.whole?.find((mark) => text.startsWith(mark, at));
    if (whole) {
      const close = text.indexOf(whole, at + whole.length);
      const end = close === -1 ? text.length : close;
      if (strings && call === 0) keepString(at + whole.length, end);
      last = whole[0];
      word = "";
      at = close === -1 ? text.length : close + whole.length;
      continue;
    }

    if (grammar.quotes?.includes(one) && (!grammar.tags || inTag)) {
      let end = at + 1;
      while (end < text.length && text[end] !== one && text[end] !== "\n") end += text[end] === "\\" ? 2 : 1;
      if (end > text.length) end = text.length;
      const closed = text[end] === one;
      const content = text.slice(at + 1, end);
      const named = grammar.values && closed && isFieldName(end + 1);
      if (strings && call === 0 && !named && wordsIn(content) >= SHORTEST_STRING) keepString(at + 1, end);
      last = one;
      word = "";
      at = closed ? end + 1 : end;
      continue;
    }

    if (grammar.template && one === "`") {
      templates.push({ from: at + 1, parts: [] });
      at += 1;
      continue;
    }

    if (grammar.template && one === "/" && (last === "" || MARKS_BEFORE_A_PATTERN.includes(last) || BEFORE_A_PATTERN.has(word))) {
      let end = at + 1;
      let inClass = false;
      while (end < text.length && text[end] !== "\n") {
        if (text[end] === "\\") end += 2;
        else if (inClass) {
          if (text[end] === "]") inClass = false;
          end += 1;
        } else if (text[end] === "[") {
          inClass = true;
          end += 1;
        } else if (text[end] === "/") break;
        else end += 1;
      }
      last = ")";
      word = "";
      at = end + 1;
      continue;
    }

    if (expressions.length > 0 && one === "{") {
      expressions[expressions.length - 1] += 1;
    } else if (expressions.length > 0 && one === "}") {
      if (expressions[expressions.length - 1] === 0) {
        expressions.pop();
        templates[templates.length - 1].from = at + 1;
      } else {
        expressions[expressions.length - 1] -= 1;
      }
    }

    if (call > 0 && one === "(") call += 1;
    else if (call > 0 && one === ")") call -= 1;

    if (grammar.tags && one === "<") inTag = true;
    if (grammar.tags && one === ">") inTag = false;

    if (/[A-Za-z_$]/.test(one)) {
      let end = at + 1;
      while (end < text.length && /[A-Za-z0-9_$]/.test(text[end])) end += 1;
      word = text.slice(at, end);
      last = word[word.length - 1];
      at = end;
      if (call === 0 && TRANSLATION_CALLS.has(word)) {
        let bracket = at;
        while (bracket < text.length && /\s/.test(text[bracket])) bracket += 1;
        if (text[bracket] === "(") {
          call = 1;
          last = "(";
          word = "";
          at = bracket + 1;
        }
      }
      continue;
    }

    if (!/\s/.test(one)) {
      last = one;
      word = "";
    }
    at += 1;
  }

  return out.join("");
}

/**
 * Gives the text of the comment that opens a file, which is every comment before its first line of code.
 *
 * A shebang line is skipped. A line comment gives the text after its mark, and a block comment
 * gives the text between its marks. The walk stops at the first character that is neither a
 * space nor the start of a comment.
 *
 * @param {string} text The whole file.
 * @param {Grammar} grammar What opens a comment in this file.
 * @returns {string} The comments, one after the other.
 */
function openingComment(text, grammar) {
  const parts = [];
  let at = text.startsWith("#!") ? text.indexOf("\n") : 0;
  if (at === -1) return "";
  while (at < text.length) {
    if (/\s/.test(text[at])) {
      at += 1;
      continue;
    }
    const lineMark = grammar.line?.find((mark) => text.startsWith(mark, at));
    if (lineMark) {
      const end = text.indexOf("\n", at);
      const stop = end === -1 ? text.length : end;
      parts.push(text.slice(at + lineMark.length, stop));
      at = stop;
      continue;
    }
    const block = grammar.block?.find(([open]) => text.startsWith(open, at));
    if (block) {
      const close = text.indexOf(block[1], at + block[0].length);
      const stop = close === -1 ? text.length : close;
      parts.push(text.slice(at + block[0].length, stop));
      at = close === -1 ? text.length : close + block[1].length;
      continue;
    }
    break;
  }
  return parts.join("\n");
}

/**
 * Says whether the comment that opens the file asks for its comments alone.
 *
 * The phrase is read with the case of the letters, the stars of a block comment and the breaks
 * between lines taken out, so it can open a sentence, or run across two lines of a comment.
 *
 * @param {string} text The whole file.
 * @param {Grammar} grammar What opens a comment in this file.
 * @returns {boolean} True when the opening comment has the phrase.
 */
function readsCommentsAlone(text, grammar) {
  const words = openingComment(text, grammar).replace(/[*\s]+/g, " ").toLowerCase();
  return words.includes(COMMENTS_ALONE);
}

/**
 * Gives back what a person reads in one file, with everything else turned into spaces.
 *
 * Inside a code file that is a comment and a string of enough words. A string inside a
 * WordPress translation call is never read. A file whose opening comment asks for its
 * comments alone gives no string. A prose file, and a file whose extension this library
 * does not know, comes back whole.
 *
 * @param {string} text The whole file.
 * @param {string} extension The extension of the file, with its dot, such as `.mjs`.
 * @returns {string} The same text, with every part a person does not read turned into spaces.
 */
export function whatAPersonReads(text, extension) {
  const grammar = GRAMMARS.get(extension.toLowerCase());
  if (!grammar) return text;
  return blanked(text, grammar, !readsCommentsAlone(text, grammar));
}
