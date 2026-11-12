/**
 * AI insight utility functions.
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

interface TextSegment {
	/** The segment's text, without the `**` markers around it. */
	text: string;
	/** Whether the segment was wrapped in a `**` pair. */
	isBold: boolean;
}

/**
 * Splits text into plain and bold segments, where bold text is wrapped in a `**` pair.
 * An unclosed `**` stays in a plain segment as characters.
 *
 * @since 1.192.0
 *
 * @param {string} text The text to split.
 * @return {Array.<TextSegment>} The segments in their original order, without empty ones.
 */
export function splitBoldSegments( text: string ): TextSegment[] {
	return (
		text
			.split( /\*\*([\s\S]+?)\*\*/ )
			// The capture group puts the text of each bold pair at an odd index.
			.map( ( segment, index ) => ( {
				text: segment,
				isBold: index % 2 === 1,
			} ) )
			.filter( ( segment ) => segment.text !== '' )
	);
}
