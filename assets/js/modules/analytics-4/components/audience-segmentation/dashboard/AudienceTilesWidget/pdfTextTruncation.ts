/**
 * Text truncation helpers for the Your visitor groups PDF widget.
 *
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

/**
 * Splits a word into its characters, which `@react-pdf` can break the line
 * between without adding a hyphen, so the word can truncate with an ellipsis.
 *
 * @since n.e.x.t
 *
 * @param word The word to split.
 * @return The word's characters, with an empty part between each pair.
 */
export function splitIntoCharacters( word: string ): string[] {
	return Array.from( word ).flatMap( ( character, index ) =>
		index ? [ '', character ] : [ character ]
	);
}

/**
 * Gets the hyphenation callback that lets the text truncate with an ellipsis.
 * Text with spaces gets none: it already breaks at its spaces, and splitting
 * it would close them up.
 *
 * @since n.e.x.t
 *
 * @param text The text to truncate.
 * @return `splitIntoCharacters` for text without spaces, otherwise `undefined`.
 */
export function getTruncationHyphenationCallback(
	text: string
): typeof splitIntoCharacters | undefined {
	return text.includes( ' ' ) ? undefined : splitIntoCharacters;
}
