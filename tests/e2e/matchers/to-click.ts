/**
 * Custom toClick Jest matcher.
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
 * Internal dependencies
 */
import {
	type ElementMatcherOptions,
	type ElementRoot,
	waitForMatch,
	withDefaultOptions,
} from './find-element';

/**
 * Waits for an element matching the selector, and the text if given, then
 * clicks it.
 *
 * @since 1.191.0
 *
 * @param root           Page or element handle to search in.
 * @param selector       CSS selector.
 * @param matcherOptions Options: `text`, `visible`, `button`, `timeout`, `polling`.
 * @return Object with `pass` and `message` keys.
 */
export async function toClick(
	root: ElementRoot,
	selector: string,
	matcherOptions?: ElementMatcherOptions
) {
	const options = withDefaultOptions( matcherOptions );
	const element = await waitForMatch( root, selector, options );
	await element.click( options.button ? { button: options.button } : {} );
	return { pass: true, message: () => '' };
}
