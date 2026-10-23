/**
 * Custom toFill Jest matcher.
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
import { waitForMatch, withDefaultOptions } from './find-element';

/**
 * Waits for a field matching the selector, then replaces its value.
 *
 * @since n.e.x.t
 *
 * @param {Object} root             Page or element handle to search in.
 * @param {string} selector         CSS selector.
 * @param {string} value            Value to fill in.
 * @param {Object} [matcherOptions] Options: `text`, `visible`, `timeout`, `polling`.
 * @return {Object} Object with `pass` and `message` keys.
 */
export async function toFill( root, selector, value, matcherOptions ) {
	const options = withDefaultOptions( matcherOptions );
	const element = await waitForMatch( root, selector, options );
	await element.fill( value );
	return { pass: true, message: () => '' };
}
